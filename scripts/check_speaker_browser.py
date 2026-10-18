"""Real Chromium verification. Screenshots are site QA, never rehearsal evidence."""
from collections import Counter
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

# Inspect computed eye transforms, not just data attributes or screenshots. In a
# mask, removing the original matrix puts both eye cutouts at the same origin.
MASCOT_STATE = r"""selector => [...document.querySelectorAll(selector)].map(svg => {
  const matrix = value => {
    const m = new DOMMatrix(value || undefined);
    return [m.a, m.b, m.c, m.d, m.e, m.f];
  };
  const masks = [...svg.querySelectorAll('mask')];
  const refs = [...svg.querySelectorAll('[mask]')].map(e => {
    const match = /^url\(["']?#([^"')]+)["']?\)$/.exec(e.getAttribute('mask'));
    const target = match && document.getElementById(match[1]);
    return {id: match && match[1], local: !!target && svg.contains(target) && target.localName === 'mask'};
  });
  return {
    mascot: svg.dataset.mascot, viewBox: svg.getAttribute('viewBox'), motion: svg.dataset.motion,
    current: !!svg.closest('section.present'),
    masks: masks.map(e => e.id), refs,
    hasBodyWrapper: !!svg.querySelector('.mascot-motion .mascot-body'),
    hasMaskedFace: !!svg.querySelector('mask .mascot-face'),
    keyframes: [...svg.querySelectorAll('style')].flatMap(e =>
      [...e.textContent.matchAll(/@keyframes\s+([\w-]+)/g)].map(match => match[1])),
    eyes: [...svg.querySelectorAll('.mascot-eye')].map(eye => {
      const style = getComputedStyle(eye);
      return {
        tag: eye.localName, classes: [...eye.classList].filter(c => c !== 'mascot-eye'),
        authored: eye.getAttribute('transform'), initial: matrix(eye.getAttribute('transform')),
        transform: matrix(style.transform), inlineTransform: eye.style.transform,
        name: style.animationName, duration: style.animationDuration,
        direction: style.animationDirection, iterations: style.animationIterationCount,
        playState: style.animationPlayState,
        nativeAnimation: eye.getAnimations().some(a => a instanceof CSSAnimation && a.animationName === style.animationName),
        maskedFace: !!eye.closest('mask .mascot-face')
      };
    })
  };
})"""


def mascot_state(page, selector='.workshop-mascot'):
    return page.evaluate(MASCOT_STATE, selector)


def assert_static_mascots(page, selector='.workshop-mascot', standalone=False):
    states = mascot_state(page, selector)
    assert states, f'No mascots matched {selector}'
    for svg in states:
        assert standalone or svg['motion'] == 'static', svg
        assert len(svg['eyes']) == 2, svg
        matrices = []
        for eye in svg['eyes']:
            assert eye['authored'] and eye['authored'].startswith('matrix('), eye
            assert eye['name'] == 'none' and not eye['nativeAnimation'], eye
            assert eye['initial'] != [1, 0, 0, 1, 0, 0], eye
            assert all(abs(a - b) < .00001 for a, b in zip(eye['initial'], eye['transform'])), eye
            matrices.append(eye['transform'])
        assert matrices[0] != matrices[1], svg
    # Static means stable over real elapsed time, including after a former active
    # animation is cancelled. Do not disable animations or freeze the page clock.
    page.wait_for_timeout(220)
    assert [[eye['transform'] for eye in svg['eyes']] for svg in mascot_state(page, selector)] == [
        [eye['transform'] for eye in svg['eyes']] for svg in states
    ]
    return states


def assert_active_mascots(page):
    page.wait_for_function("""() => {
      const bots = [...document.querySelectorAll('section.present .workshop-mascot')];
      return bots.length && bots.every(svg => svg.dataset.motion === 'active' &&
        [...svg.querySelectorAll('.mascot-eye')].every(eye => getComputedStyle(eye).animationName !== 'none'));
    }""")
    states = mascot_state(page, 'section.present .workshop-mascot')
    for svg in states:
        assert len(svg['eyes']) == 2, svg
        for eye in svg['eyes']:
            assert eye['nativeAnimation'] and eye['name'] in svg['keyframes'], eye
            assert eye['playState'] == 'running', eye
            assert eye['duration'] == '2.967s' and eye['direction'] == 'alternate', eye
            assert eye['iterations'] == 'infinite', eye
            assert not eye['inlineTransform'], eye  # Gaze belongs to wrapper groups.
        assert svg['eyes'][0]['name'] != svg['eyes'][1]['name'], svg
    # Let Chromium's native timeline advance. A class toggle, paused keyframe,
    # JS-only blink or screenshot with animations disabled cannot satisfy this.
    samples = [[eye['transform'] for svg in states for eye in svg['eyes']]]
    for _ in range(5):
        page.wait_for_timeout(220)
        samples.append([eye['transform'] for svg in mascot_state(page, 'section.present .workshop-mascot') for eye in svg['eyes']])
    for index, first in enumerate(samples[0]):
        assert any(sample[index] != first for sample in samples[1:]), (index, samples)
    assert not page.locator('.workshop-mascot[data-motion="active"]').evaluate_all(
        "bots => bots.some(svg => !svg.closest('section.present'))"
    )
    return states


ROOT = Path('_site').resolve()
OUT = Path('speaker-browser-evidence')
OUT.mkdir(exist_ok=True)
PREFIX = '/grok-bot-engineering-workshop'
class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith(PREFIX + '/'):
            self.send_error(404)
            return
        self.path = self.path[len(PREFIX):]
        super().do_GET()
    def log_message(self, *args):
        pass
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}{PREFIX}/'
results = []
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width':1440,'height':900}, permissions=['clipboard-read','clipboard-write'])
        errors, external, bad = [], [], []
        context.on('page', lambda pg: pg.on('pageerror', lambda error: errors.append(str(error))))
        context.on('response', lambda response: bad.append(f'{response.status} {response.url}') if response.status >= 400 else None)
        def route(request_route):
            if request_route.request.url.startswith(base.split(PREFIX)[0]):
                request_route.continue_()
            else:
                external.append(request_route.request.url)
                request_route.abort()
        context.route('**/*', route)
        # Pointer/visibility events before Reveal.initialize must be harmless.
        # Keep a real browser timeline: the native SVG keyframes are not JS timers.
        startup_context = browser.new_context(viewport={'width':1440,'height':900})
        startup_context.route('**/*', route)
        startup = startup_context.new_page()
        startup.on('pageerror', lambda error: errors.append(str(error)))
        startup.add_init_script("""{
          const pending = new Promise(resolve => { window.releaseMascotFonts = resolve; });
          document.fonts.load = () => pending;
        }""")
        startup.goto(base+'slides/', wait_until='domcontentloaded')
        assert not startup.evaluate('Reveal.isReady()')
        startup.mouse.move(800, 300)
        startup.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
        assert not errors, errors
        assert_static_mascots(startup)
        startup.evaluate('window.releaseMascotFonts([])')
        startup.wait_for_function('document.querySelector(".reveal").classList.contains("ready")')
        startup.evaluate("document.dispatchEvent(new Event('visibilitychange'))")
        assert_active_mascots(startup)
        startup.screenshot(animations='allow', path=str(OUT/'mascot-native-animation-desktop.png'))
        startup_context.close()
        results.append('Pre-ready pointer/visibility events, static initial matrices and native 2.967s SVG animation PASS')
        page = context.new_page()
        page.goto(base, wait_until='networkidle')
        page.screenshot(animations='disabled', path=str(OUT/'home-desktop.png'), full_page=True)
        page.get_by_role('link', name='Guia da apresentadora').click()
        page.wait_for_load_state('networkidle')
        assert page.url == base+'guide/'
        assert page.locator('.copy-prompt').count() == 10
        assert page.locator('.copy-command').count() == 1
        page.locator('.copy-command').click()
        page.wait_for_function("document.querySelector('.copy-status').textContent === 'Comando copiado.'")
        assert page.evaluate('navigator.clipboard.readText()') == 'git ls-remote --exit-code --heads origin refs/heads/checkpoint/mvp-base'
        page.locator('.copy-prompt').first.click()
        page.wait_for_function("document.querySelector('.copy-status').textContent === 'Prompt copiado.'")
        copied = page.evaluate('navigator.clipboard.readText()')
        assert copied == page.locator('.prompt:not(.command) code').first.text_content().rstrip('\n')
        page.screenshot(animations='disabled', path=str(OUT/'guide-prompt-desktop.png'))
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(animations='disabled', path=str(OUT/'guide-desktop.png'))
        # Exercise every internal anchor and each guide-to-slide hash at project base.
        links = page.locator('a[href^="#"]').evaluate_all('(xs)=>xs.map(x=>x.getAttribute("href"))')
        for anchor in links:
            assert page.locator('[id="'+anchor[1:]+'"]').count() == 1, anchor
        slide_links = page.locator('a[href^="../slides/#/"]').evaluate_all('(xs)=>xs.map(x=>x.href)')
        assert len(slide_links) >= 20
        # Deterministic rejection exercises fallback without changing browser security settings.
        page.evaluate("Object.defineProperty(navigator.clipboard, 'writeText', {configurable:true,value:()=>Promise.reject(new Error('test rejection'))})")
        page.locator('.copy-prompt').first.click()
        page.wait_for_function("document.querySelector('.copy-status').textContent.startsWith('Cópia bloqueada.')")
        assert page.evaluate('getSelection().getRangeAt(0).cloneContents().textContent') == page.locator('.prompt:not(.command) code').first.text_content()
        assert page.evaluate('getSelection().toString()').rstrip('\n') == page.locator('.prompt:not(.command) code').first.text_content().rstrip('\n')
        page.evaluate("delete navigator.clipboard.writeText; document.querySelector('.copy-status').textContent=''; getSelection().removeAllRanges(); window.scrollTo(0,0)")
        results.append('guide: clipboard success, simulated rejection selection fallback, local anchors and project-base slide links PASS')
        for width in (390, 768):
            page.set_viewport_size({'width':width,'height':844})
            page.screenshot(animations='disabled', path=str(OUT/f'guide-{width}.png'))
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'guide overflow at {width}'
            page.locator('.prompt:not(.command)').first.scroll_into_view_if_needed()
            page.screenshot(animations='disabled', path=str(OUT/f'guide-prompt-{width}.png'))
            page.evaluate('window.scrollTo(0,0)')
        results.append('guide: 390px/768px document overflow PASS')
        page.set_viewport_size({'width':1440,'height':900})
        page.goto(base+'slides/', wait_until='networkidle')
        page.wait_for_function('window.Reveal && Reveal.isReady()')
        assert page.evaluate('Reveal.getTotalSlides()') == 22
        stepped = 0
        for number in range(22):
            page.evaluate('(i)=>Reveal.slide(i,0,-1)', number)  # -1 = before the first fragment
            page.wait_for_timeout(400)
            assert page.evaluate('Reveal.getIndices().h') == number
            page.screenshot(animations='disabled', path=str(OUT/f'slide-{number+1:02}.png'))
            # Capture every click stage after its transition, plus the completed state below.
            steps = 0
            while page.evaluate('Reveal.nextFragment()'):
                steps += 1
                page.wait_for_timeout(700)  # screenshots disable animations, not fragment CSS transitions
                page.screenshot(animations='disabled', path=str(OUT/f'slide-{number+1:02}-step-{steps:02}.png'))
            expected = page.evaluate("(i)=>new Set([...Reveal.getSlides()[i].querySelectorAll('.fragment')].map(f=>f.dataset.fragmentIndex)).size", number)
            assert steps == expected, (number+1, steps, expected)
            if steps:
                page.wait_for_timeout(700)  # let the last fragment transition finish (screenshots disable animations only)
                hidden = page.evaluate("(i)=>Reveal.getSlides()[i].querySelectorAll('.fragment:not(.visible)').length", number)
                assert hidden == 0, (number+1, hidden)
                page.screenshot(animations='disabled', path=str(OUT/f'slide-{number+1:02}-final.png'))
                stepped += steps
        assert (OUT/'slide-04-final.png').exists() and (OUT/'slide-06-final.png').exists() and (OUT/'slide-11-final.png').exists()
        results.append(f'Reveal: every fragment step and final state captured ({stepped} steps, architecture, team flow and loop included) PASS')
        for link in slide_links:
            page.goto(link, wait_until='networkidle')
            page.wait_for_function('(i)=>Reveal.getIndices().h === i', arg=int(link.rsplit('/',1)[1]))
        page.evaluate('Reveal.slide(0)')
        # Uploaded SVGs retain their geometry, two distinct eye matrices and
        # per-instance namespacing even when several copies of one bot coexist.
        assert page.locator('template[id^="mascot-"]').count() == 5
        states = mascot_state(page)
        assert states
        ids = page.locator('[id]').evaluate_all('(elements) => elements.map(e => e.id)')
        assert len(ids) == len(set(ids)), 'Duplicate document ID (including mascot masks)'
        keyframes = [name for svg in states for name in svg['keyframes']]
        assert len(keyframes) == len(states) * 2 and len(set(keyframes)) == len(keyframes), keyframes
        classes = Counter(name for svg in states for eye in svg['eyes'] for name in eye['classes'])
        for svg in states:
            assert svg['viewBox'] == '-125 -125 250 250', svg
            assert svg['hasBodyWrapper'] and svg['hasMaskedFace'], svg
            assert svg['masks'] and svg['refs'] and all(ref['local'] for ref in svg['refs']), svg
            assert len(svg['eyes']) == 2 and all(eye['tag'] == 'path' and eye['maskedFace'] for eye in svg['eyes']), svg
            assert all(any(classes[name] == 1 for name in eye['classes']) for eye in svg['eyes']), svg
        assert page.locator('.workshop-mascot[data-blink]').count() == 0
        for slide_number in [0, 21]:
            page.evaluate('(i)=>Reveal.slide(i)', slide_number)
            assert page.locator('section.present .workshop-mascot').count() == 5
            current = assert_active_mascots(page)
            # The five uploaded bots must not silently share one bot's eye data.
            assert len({tuple(tuple(eye['initial']) for eye in svg['eyes']) for svg in current}) == 5
            assert_static_mascots(page, 'section:not(.present) .workshop-mascot')
        page.evaluate('Reveal.slide(0)')
        assert_active_mascots(page)
        before_gaze = [[eye['authored'] for eye in svg['eyes']] for svg in mascot_state(page)]
        page.mouse.move(1400, 300)
        page.wait_for_function("[...document.querySelectorAll('section.present .mascot-face')].some(e=>e.style.transform.includes('translate'))")
        assert [[eye['authored'] for eye in svg['eyes']] for svg in mascot_state(page)] == before_gaze
        assert all(not eye['inlineTransform'] for svg in mascot_state(page) for eye in svg['eyes'])
        page.screenshot(animations='disabled', path=str(OUT/'mascots-gaze-desktop.png'))
        page.emulate_media(reduced_motion='reduce')
        page.wait_for_function("[...document.querySelectorAll('.mascot-motion,.mascot-face')].every(e=>!e.style.transform)")
        assert_static_mascots(page)
        page.screenshot(animations='disabled', path=str(OUT/'mascots-reduced-motion.png'))
        page.emulate_media(reduced_motion='no-preference')
        assert_active_mascots(page)
        # Reveal presentation modes suspend motion without destroying first-frame eyes.
        page.evaluate('Reveal.toggleOverview(true)')
        assert_static_mascots(page)
        page.evaluate('Reveal.toggleOverview(false)')
        assert_active_mascots(page)
        page.evaluate('Reveal.togglePause(true)')
        assert_static_mascots(page)
        page.evaluate('Reveal.togglePause(false)')
        assert_active_mascots(page)
        # Cameos must never intersect actual content or the progress HUD.
        for slide_number in [2, 15, 19]:
            page.evaluate('(i)=>Reveal.slide(i,0,999)', slide_number)
            page.wait_for_timeout(800)
            overlaps = page.evaluate("""()=>{const s=Reveal.getCurrentSlide(), c=s.querySelector('.slide-cameo').getBoundingClientRect();
              return [...s.children, document.querySelector('#hud')].filter(e=>!e.matches('.slide-cameo,aside')).filter(e=>{
              const r=e.getBoundingClientRect(); return r.width && r.height && c.left<r.right && c.right>r.left && c.top<r.bottom && c.bottom>r.top;
              }).map(e=>e.className)}""")
            assert not overlaps, (slide_number+1, overlaps)
        page.evaluate('Reveal.slide(0)')
        results.append('Five uploaded mascots: unique masks/classes/keyframes, native eye motion, wrapper-only gaze, static offscreen/reduced-motion/overview/pause states and unobstructed cameos PASS')
        # Notes header click count must equal the number of fragment steps on each slide.
        mismatches = page.evaluate("""()=>Reveal.getSlides().map((s,i)=>{const n=new Set([...s.querySelectorAll('.fragment')].map(f=>f.dataset.fragmentIndex)).size;const m=/(\\d+) click/.exec(s.querySelector('aside.notes').textContent);return (m?+m[1]:0)===n?null:`slide ${i+1}: notes ${m?m[1]:0} vs ${n}`}).filter(Boolean)""")
        assert not mismatches, mismatches
        # HUD advances with elapsed time on the last slide and the Q&A bar is full by 12:29.
        page.evaluate('Reveal.slide(21)')
        qa_bar = "document.querySelectorAll('#hud-segs .seg i')[7].style.width"
        start = page.evaluate(qa_bar)
        assert start != '100%', start
        page.evaluate("()=>{const t=Date.now;Date.now=()=>t()+3.5*60000;renderHud();Date.now=t}")
        assert page.evaluate(qa_bar) == '100%'
        page.evaluate('Reveal.slide(0)')
        page.keyboard.press('f')
        page.wait_for_function('!!document.fullscreenElement')
        page.keyboard.press('Escape')
        with context.expect_page() as opened:
            page.keyboard.press('s')
        notes = opened.value
        notes.wait_for_load_state('networkidle')
        notes.locator('#connection-status').wait_for(state='hidden')
        notes.wait_for_function("document.querySelector('.speaker-controls-notes .value').textContent.trim().length > 20")
        notes.wait_for_function("document.querySelector('#current-slide iframe').contentWindow.Reveal.isReady()")
        # Screenshot is evidence only; the assertions above are the test. Headless popups on CI runners can hang on
        # "waiting for fonts to load", so bring the popup to front, bound the fonts wait, and degrade to a warning.
        notes.bring_to_front()
        notes.evaluate("Promise.race([document.fonts.ready, new Promise(r=>setTimeout(r,5000))])")
        try:
            notes.screenshot(animations='disabled', path=str(OUT/'speaker-notes.png'), timeout=10000)
        except PlaywrightTimeoutError as error:
            print('WARNING: speaker-notes screenshot skipped:', str(error).splitlines()[0])
            page.bring_to_front()
            page.screenshot(animations='disabled', path=str(OUT/'speaker-notes-fallback.png'))
        notes.close()
        results.append('Reveal: 22 slide renders, hash links, F fullscreen and S notes popup PASS')
        # Offline is tested with network disabled after all local assets are loaded.
        context.set_offline(True)
        page.keyboard.press('ArrowRight')
        page.wait_for_timeout(400)
        assert page.evaluate('Reveal.getIndices().h') >= 1
        page.screenshot(animations='disabled', path=str(OUT/'slide-offline.png'))
        results.append('Reveal: loaded deck navigation offline PASS; fresh reload offline is not promised')
        context.set_offline(False)
        page.set_viewport_size({'width':390,'height':844})
        page.goto(base+'slides/', wait_until='networkidle')
        page.wait_for_function('Reveal.isReady() && !Reveal.isScrollView() && Reveal.getIndices().h === 0')
        page.locator('section.present h1').wait_for(state='visible')
        page.screenshot(animations='disabled', path=str(OUT/'slides-mobile.png'))
        touch = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
        touch.route('**/*', route)
        touch_page = touch.new_page()
        touch_page.on('pageerror', lambda error: errors.append(str(error)))
        touch_page.goto(base+'slides/', wait_until='networkidle')
        touch_page.wait_for_function('Reveal.isReady() && !Reveal.isScrollView() && Reveal.getIndices().h === 0')
        touch_page.locator('section.present h1').wait_for(state='visible')
        touch_page.mouse.move(300, 200)
        touch_page.wait_for_timeout(200)
        assert touch_page.evaluate("[...document.querySelectorAll('.mascot-motion,.mascot-face')].every(e=>!e.style.transform)")
        assert_static_mascots(touch_page)
        touch_page.screenshot(animations='disabled', path=str(OUT/'mascots-touch-cover.png'))
        touch_page.evaluate('Reveal.slide(21)')
        touch_page.wait_for_function('Reveal.getIndices().h === 21 && !Reveal.isScrollView()')
        touch_page.locator('section.present h1').filter(has_text='Questions?').wait_for(state='visible')
        touch_page.wait_for_timeout(800)
        assert touch_page.locator('section.present .workshop-mascot').count() == 5
        assert_static_mascots(touch_page)
        bounds = touch_page.locator('section.present h1').bounding_box()
        assert bounds and bounds['x'] >= 0 and bounds['y'] >= 0 and bounds['x'] + bounds['width'] <= 390 and bounds['y'] + bounds['height'] <= 844, bounds
        touch_page.screenshot(animations='disabled', path=str(OUT/'mascots-touch-closing.png'))
        touch.close()
        fallback = browser.new_context(java_script_enabled=False)
        fallback.route('**/*', route)
        fallback_page = fallback.new_page()
        fallback_page.goto(base+'slides/', wait_until='networkidle')
        fallback_images = fallback_page.locator('img[src^="assets/avatars/"]')
        assert fallback_images.count() > 0
        assert fallback_images.evaluate_all('(images) => images.every(e => e.complete && e.naturalWidth > 0)')
        # Open each actual fallback SVG with scripting disabled. Image-load checks
        # alone cannot catch collapsed mask eyes or an accidentally animated fallback.
        fallback_urls = sorted(set(fallback_images.evaluate_all('(images) => images.map(e => e.src)')))
        checked_fallbacks = 0
        for url in fallback_urls:
            fallback_page.goto(url, wait_until='networkidle')
            if not fallback_page.locator('.mascot-eye').count():
                continue  # The presenter's human portrait is not a bot.
            checked_fallbacks += 1
            assert fallback_page.locator('svg').get_attribute('viewBox') == '-125 -125 250 250'
            assert fallback_page.locator('style, animate, animateTransform, script').count() == 0
            assert_static_mascots(fallback_page, 'svg', standalone=True)
        assert checked_fallbacks == 5, checked_fallbacks
        fallback.close()
        results.append('Touch/coarse pointer and five no-JavaScript SVG fallbacks retain static, distinct first-frame eyes PASS')
        assert not errors, errors
        assert not external, external
        assert not bad, bad
        results.append('No JavaScript errors, HTTP failures or external resource requests')
        browser.close()
    (OUT/'results.json').write_text(json.dumps({'checks':results,'note':'Real site-render QA only. Not workshop rehearsal or application acceptance evidence.'},indent=2))
    print('\n'.join(results))
finally:
    server.shutdown()

