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
  // Inspect the rendered SVG root, never mask paths: mask geometry has no
  // ordinary layout box even when it is painting a visible mascot.
  const hiddenAncestors = [];
  for (let element = svg; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (style.display === 'none' || ['hidden', 'collapse'].includes(style.visibility) || style.contentVisibility === 'hidden') {
      hiddenAncestors.push({tag: element.localName, class: element.getAttribute('class'), display: style.display, visibility: style.visibility});
    }
  }
  const rendered = [...svg.getClientRects()].some(rect => rect.width > 0 && rect.height > 0) &&
    !hiddenAncestors.length && (!svg.checkVisibility || svg.checkVisibility({visibilityProperty: true, contentVisibilityAuto: true}));
  const masks = [...svg.querySelectorAll('mask')];
  const refs = [...svg.querySelectorAll('[mask]')].map(e => {
    const match = /^url\(["']?#([^"')]+)["']?\)$/.exec(e.getAttribute('mask'));
    const target = match && document.getElementById(match[1]);
    return {id: match && match[1], local: !!target && svg.contains(target) && target.localName === 'mask'};
  });
  return {
    mascot: svg.dataset.mascot, viewBox: svg.getAttribute('viewBox'), motion: svg.dataset.motion,
    current: !!svg.closest('section.present'), rendered, hiddenAncestors,
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
        transform: matrix(style.transform), computedTransform: style.transform, inlineTransform: eye.style.transform,
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


def assert_static_mascots(page, selector='.workshop-mascot', standalone=False, require_current_rendered=False):
    def check(states):
        assert states, f'No mascots matched {selector}'
        if standalone or require_current_rendered:
            required = [svg for svg in states if standalone or svg['current']]
            assert required and all(svg['rendered'] for svg in required), ('Expected rendered static mascots', states)
        for svg in states:
            assert standalone or svg['motion'] == 'static', svg
            assert len(svg['eyes']) == 2, svg
            for eye in svg['eyes']:
                assert eye['authored'] and eye['authored'].startswith('matrix('), eye
                assert eye['name'] == 'none' and not eye['nativeAnimation'], eye
                assert eye['initial'] != [1, 0, 0, 1, 0, 0], eye
                # Chromium reports transform:none for descendants of Reveal's
                # display:none slides. Only rendered roots provide computed-style
                # evidence; hidden roots must still retain the authored matrices.
                if svg['rendered']:
                    assert all(abs(a - b) < .00001 for a, b in zip(eye['initial'], eye['transform'])), (svg, eye)
            assert svg['eyes'][0]['initial'] != svg['eyes'][1]['initial'], svg
            if svg['rendered']:
                assert svg['eyes'][0]['transform'] != svg['eyes'][1]['transform'], svg

    states = mascot_state(page, selector)
    check(states)
    # Recheck both the static policy and actual visible eye geometry over time.
    # A ready/current-slide test must contain rendered roots on both observations.
    page.wait_for_timeout(220)
    later = mascot_state(page, selector)
    check(later)
    assert len(later) == len(states)
    for before, after in zip(states, later):
        assert [eye['authored'] for eye in before['eyes']] == [eye['authored'] for eye in after['eyes']]
        if before['rendered'] and after['rendered']:
            assert [eye['transform'] for eye in before['eyes']] == [eye['transform'] for eye in after['eyes']]
    return states


def assert_active_mascots(page):
    page.wait_for_function("""() => {
      const bots = [...document.querySelectorAll('section.present .workshop-mascot')];
      return bots.length && bots.every(svg => svg.dataset.motion === 'active' && svg.dataset.cue !== 'wink' &&
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


def assert_contextual_cues(page, output):
    """Observe actual visible decoration, finite lifetime and mode cancellation."""
    for index, ident in [(7, 'fde'), (12, 'qa')]:
        page.evaluate('(i)=>Reveal.slide(i,0,-1)', index)
        cue = page.locator(f'section.present .workshop-mascot[data-mascot="{ident}"][data-mascot-cue="thinking"]')
        cue.wait_for(state='visible')
        page.wait_for_function("document.querySelector('section.present [data-cue=thinking] .mascot-thinking')?.style.opacity > 0.8")
        circles = cue.locator('.mascot-thinking circle')
        assert circles.count() == 3
        before = circles.evaluate_all('(xs)=>xs.map(x=>x.getAttribute("r"))')
        page.wait_for_timeout(180)
        assert circles.evaluate_all('(xs)=>xs.map(x=>x.getAttribute("r"))') != before
        page.screenshot(path=str(output/f'mascots-thinking-slide-{index+1:02}.png'))
        page.wait_for_function("!document.querySelector('section.present [data-cue=thinking]')")
        assert cue.locator('.mascot-thinking').evaluate('(e)=>getComputedStyle(e).display') == 'none'
    page.evaluate('Reveal.slide(21)')
    wink = page.locator('section.present [data-mascot-cue="wink"]')
    page.wait_for_function("document.querySelector('section.present .mascot-wink')?.style.transform.includes('scale')")
    page.wait_for_timeout(650)
    assert wink.locator('.mascot-wink').evaluate('(e)=>new DOMMatrix(getComputedStyle(e).transform).d') < .5
    page.screenshot(path=str(output/'mascots-closing-wink.png'))
    page.wait_for_function("!document.querySelector('section.present [data-cue=wink]')")
    assert wink.locator('.mascot-wink').evaluate('(e)=>e.style.transform') == ''
    page.wait_for_timeout(1700)
    assert wink.get_attribute('data-cue') == 'idle', 'Cue must not loop'
    # Overview / reduced motion cancel immediately, and resuming must not replay.
    for mode in ('overview', 'reduce', 'print'):
        page.evaluate('Reveal.slide(0)')
        page.evaluate('Reveal.slide(7)')
        page.wait_for_function("document.querySelector('section.present [data-cue=thinking]')")
        if mode == 'overview': page.evaluate('Reveal.toggleOverview(true)')
        elif mode == 'reduce': page.emulate_media(reduced_motion='reduce')
        else: page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
        page.wait_for_function("[...document.querySelectorAll('[data-mascot-cue]')].every(e=>e.dataset.cue==='idle')")
        assert page.locator('.mascot-thinking').evaluate_all('(xs)=>xs.every(x=>getComputedStyle(x).display==="none")')
        if mode == 'overview': page.evaluate('Reveal.toggleOverview(false)')
        elif mode == 'reduce': page.emulate_media(reduced_motion='no-preference')
        else: page.evaluate("window.dispatchEvent(new Event('afterprint'))")
        page.wait_for_timeout(550)
        assert not page.locator('[data-cue="thinking"], [data-cue="wink"]').count()
    # Leaving the slide must cancel its cue, even before it has finished.
    page.evaluate('Reveal.slide(0)')
    page.evaluate('Reveal.slide(7)')
    page.wait_for_function("document.querySelector('section.present [data-cue=thinking]')")
    page.evaluate('Reveal.slide(8)')
    assert not page.locator('[data-cue="thinking"], [data-cue="wink"]').count()


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
        cue_context = browser.new_context(viewport={'width':1440,'height':900}, record_video_dir=str(OUT/'clips'), record_video_size={'width':960,'height':600})
        cue_context.route('**/*', route)
        cue_page = cue_context.new_page()
        cue_page.on('pageerror', lambda error: errors.append(str(error)))
        cue_page.goto(base+'slides/', wait_until='networkidle')
        cue_page.wait_for_function('Reveal.isReady()')
        assert_contextual_cues(cue_page, OUT)
        cue_video = cue_page.video
        cue_context.close()
        cue_video.save_as(str(OUT/'mascot-cues.webm'))
        results.append('Contextual cues: visible thinking pulses and one wink, finite lifetime, no replay after overview/reduced-motion/print, offscreen cancellation PASS')
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
        # Ready live-demo panels must fit the fixed stage without clipped content.
        for index in (7, 8, 12, 13, 14, 16, 17):
            page.evaluate('(i)=>Reveal.slide(i,0,-1)', index)
            while page.evaluate('Reveal.nextFragment()'):
                page.wait_for_timeout(100)
            page.wait_for_timeout(700)
            clipped = page.locator('section.present .group-conversation, section.present .conversation-charter, section.present .workshop-ui, section.present .design-board').evaluate_all("""els => els.flatMap(el => {
                const outer = el.getBoundingClientRect();
                const bad = [...el.querySelectorAll('p, b, strong, small, dt, dd, .workshop-footer, .conversation-footer')].filter(child => {
                    const box = child.getBoundingClientRect();
                    return box.width > 0 && box.height > 0 && (box.bottom > outer.bottom + 2 || box.right > outer.right + 2);
                });
                return bad.map(child => ({panel: el.className, text: child.textContent, bounds: child.getBoundingClientRect().toJSON(), outer: outer.toJSON()}));
            })""")
            assert not clipped, (index, clipped)
        results.append('Ready illustrations: chat and panel content fits without clipping PASS')
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
        assert_static_mascots(page, require_current_rendered=True)
        page.screenshot(animations='disabled', path=str(OUT/'mascots-reduced-motion.png'))
        page.emulate_media(reduced_motion='no-preference')
        assert_active_mascots(page)
        # Reveal presentation modes suspend motion without destroying first-frame eyes.
        page.evaluate('Reveal.toggleOverview(true)')
        assert_static_mascots(page, require_current_rendered=True)
        page.evaluate('Reveal.toggleOverview(false)')
        assert_active_mascots(page)
        page.evaluate('Reveal.togglePause(true)')
        assert_static_mascots(page, require_current_rendered=True)
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
        for index in (7, 8, 12, 13, 14, 16, 17, 18):
            page.evaluate('(i)=>Reveal.slide(i,0,-1)', index)
            while page.evaluate('Reveal.nextFragment()'):
                page.wait_for_timeout(100)
            page.wait_for_timeout(700)
            page.screenshot(animations='disabled', path=str(OUT/f'live-slide-{index+1:02}-mobile.png'))
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
        assert_static_mascots(touch_page, require_current_rendered=True)
        touch_page.screenshot(animations='disabled', path=str(OUT/'mascots-touch-cover.png'))
        touch_page.evaluate('Reveal.slide(21)')
        touch_page.wait_for_function('Reveal.getIndices().h === 21 && !Reveal.isScrollView()')
        touch_page.locator('section.present h1').filter(has_text='Questions?').wait_for(state='visible')
        touch_page.wait_for_timeout(800)
        assert touch_page.locator('section.present .workshop-mascot').count() == 5
        assert_static_mascots(touch_page, require_current_rendered=True)
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

