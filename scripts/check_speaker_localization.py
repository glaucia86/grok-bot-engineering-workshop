"""Real Chromium QA for both deck locales; artifacts are UI QA, not rehearsal."""
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1] / '_site'
OUT = ROOT.parent / 'speaker-browser-evidence' / 'localization'
OUT.mkdir(parents=True, exist_ok=True)
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

# Text range bounds catch overflow inside clipped cards too, unlike element boxes.
OVERFLOW = """() => {
  const slide = Reveal.getCurrentSlide(), stage = slide.getBoundingClientRect();
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  const bad = []; let node;
  while (node = walker.nextNode()) {
    const parent = node.parentElement;
    if (!node.textContent.trim() || parent.closest('aside,script,style,defs,mask') || parent.closest('.fragment:not(.visible)')) continue;
    const style = getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const range = document.createRange(); range.selectNodeContents(node);
    for (const box of range.getClientRects()) {
      if (!box.width || !box.height) continue;
      if (box.left < stage.left - 3 || box.right > stage.right + 3 || box.top < stage.top - 3 || box.bottom > stage.bottom + 3)
        bad.push({text:node.textContent.trim(), kind:'stage', box:box.toJSON(), stage:stage.toJSON()});
      for (let el = parent; el && el !== slide; el = el.parentElement) {
        if (!['hidden','clip'].includes(getComputedStyle(el).overflow)) continue;
        const outer = el.getBoundingClientRect();
        if (box.right > outer.right + 3 || box.bottom > outer.bottom + 3 || box.left < outer.left - 3 || box.top < outer.top - 3)
          bad.push({text:node.textContent.trim(), kind:'clip', outer:outer.toJSON(), box:box.toJSON()});
      }
    }
  }
  return bad;
}"""
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Handler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}{PREFIX}/slides/'
report = {'checks': [], 'slides': [], 'note': 'UI QA only; not rehearsal or MVP acceptance evidence.'}
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={'width':1600, 'height':900})
        errors, bad_http, external = [], [], []
        context.on('page', lambda page: page.on('pageerror', lambda error: errors.append(str(error))))
        context.on('response', lambda response: bad_http.append(response.url) if response.status >= 400 else None)
        context.route('**/*', lambda route: route.continue_() if route.request.url.startswith(base.split(PREFIX)[0]) else (external.append(route.request.url), route.abort())[-1])
        page = context.new_page()
        totals = []
        for route, locale in [('', 'en'), ('pt-br/', 'pt-BR')]:
            page.goto(base + route)
            page.wait_for_function('window.Reveal && Reveal.isReady()')
            assert page.locator('html').get_attribute('lang') == locale
            assert page.evaluate('Reveal.getTotalSlides()') == 22
            assert page.locator('.workshop-mascot').count() > 30
            assert page.locator('img[src*="avatars/"]').evaluate_all("els=>els.every(e=>e.getAttribute('src').endsWith('/glaucia.svg'))"), 'Unconverted bot images'
            signature = page.evaluate("Reveal.getSlides().map(s=>[s.dataset.clock,[...s.querySelectorAll('.fragment')].map(f=>f.dataset.fragmentIndex)])")
            totals.append(signature)
            if locale == 'en':
                continue
            page.evaluate('Reveal.configure({transition:"none",autoAnimate:false})')
            for index in range(22):
                page.evaluate('(i)=>Reveal.slide(i,0,-1)', index)
                page.wait_for_timeout(100)
                steps = 0
                while True:
                    page.wait_for_timeout(400)
                    overflow = page.evaluate(OVERFLOW)
                    report['slides'].append({'slide':index+1,'fragment':steps-1,'overflow':overflow})
                    page.screenshot(path=str(OUT/f'pt-slide-{index+1:02}-step-{steps:02}.png'), animations='disabled')
                    assert not overflow, (index+1, steps-1, overflow)
                    if not page.evaluate('Reveal.nextFragment()'):
                        break
                    steps += 1
                expected = page.evaluate("new Set([...Reveal.getCurrentSlide().querySelectorAll('.fragment')].map(f=>f.dataset.fragmentIndex)).size")
                assert steps == expected, (index+1, steps, expected)
                notes = page.locator('section.present aside.notes').text_content()
                assert ('sem cliques' if not steps else f'{steps} clique(s)') in notes
            assert totals[0] == totals[1], 'Locale changed slide order, clock or fragment structure'
            report['checks'].append('22 PT slides: every fragment captured, text bounds and note click counts verified')
        # Repeat language changes and direct links with fragments. No state in storage.
        page.evaluate('Reveal.slide(5,0,2)')
        for locale in ['en','pt-BR','en','pt-BR']:
            page.locator('.deck-language a').focus()
            page.keyboard.press('Enter')
            page.wait_for_function('window.Reveal && Reveal.isReady()')
            assert page.locator('html').get_attribute('lang') == locale
            assert page.evaluate('Reveal.getIndices()') == {'h':5,'v':0,'f':2}
        page.go_back()
        page.wait_for_function('window.Reveal && Reveal.isReady()')
        assert page.evaluate('Reveal.getIndices()') == {'h':5,'v':0,'f':2}
        page.go_forward()
        page.wait_for_function('window.Reveal && Reveal.isReady()')
        assert page.locator('html').get_attribute('lang') == 'pt-BR'
        report['checks'].append('Keyboard language switch: repeated EN/PT, fragment deep link, Back/Forward retain position')
        # Exercise browser notes and confirm Portuguese, preserving original English prompts.
        with context.expect_page() as opened:
            page.keyboard.press('s')
        notes = opened.value
        notes.wait_for_load_state()
        notes.wait_for_function("document.querySelector('.speaker-controls-notes .value').textContent.includes('Passo a passo')")
        notes.screenshot(path=str(OUT/'pt-speaker-notes.png'), timeout=15000)
        notes.close()
        for width,height in [(1280,720),(390,844)]:
            page.set_viewport_size({'width':width,'height':height})
            for index in range(22):
                page.evaluate('(i)=>Reveal.slide(i,0,999)', index)
                page.wait_for_timeout(450)
                assert not page.evaluate(OVERFLOW), (width,index+1,page.evaluate(OVERFLOW))
            page.screenshot(path=str(OUT/f'pt-closing-{width}.png'), animations='disabled')
        report['checks'].append('All PT slides fit 1280×720 and 390×844 stages')
        page.emulate_media(reduced_motion='reduce')
        page.evaluate('Reveal.slide(0)')
        page.wait_for_timeout(500)
        assert page.locator('section.present .workshop-mascot').count() == 5
        assert page.locator('section.present .mascot-eye').evaluate_all("els=>els.every(e=>getComputedStyle(e).animationName === 'none' || getComputedStyle(e).animationPlayState === 'paused')")
        page.screenshot(path=str(OUT/'pt-reduced-motion.png'), animations='disabled')
        context.set_offline(True)
        page.evaluate('Reveal.slide(10,0,3)')
        assert page.evaluate('Reveal.getIndices().h') == 10
        assert page.locator('section.present svg.sketch text').count() > 0
        report['checks'].append('Reduced motion stays static; offline navigation and diagrams work')
        assert not errors, errors
        assert not bad_http, bad_http
        assert not external, external
        report['checks'].append('No console errors, broken requests or external assets under project URL prefix')
        offline = browser.new_context(offline=True)
        offline_page = offline.new_page()
        offline_page.goto((ROOT/'slides/pt-br/index.html').as_uri())
        offline_page.wait_for_function('window.Reveal && Reveal.isReady()')
        offline_page.evaluate('Reveal.slide(5,0,2)')
        offline_page.locator('.deck-language a').click()
        offline_page.wait_for_function('window.Reveal && Reveal.isReady()')
        assert offline_page.locator('html').get_attribute('lang') == 'en'
        assert offline_page.evaluate('Reveal.getIndices()') == {'h':5,'v':0,'f':2}
        offline.close()
        report['checks'].append('Cold offline file load and language switch preserve slide and fragment')
        browser.close()
finally:
    (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    server.shutdown()
print('\n'.join(report['checks']))
