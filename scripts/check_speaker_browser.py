"""Real Chromium verification. Screenshots are site QA, never rehearsal evidence."""
import functools
import http.server
import json
from pathlib import Path
import threading
from playwright.sync_api import sync_playwright

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
        page = context.new_page()
        page.goto(base, wait_until='networkidle')
        page.screenshot(animations='disabled', path=str(OUT/'home-desktop.png'), full_page=True)
        page.get_by_role('link', name='Guia da apresentadora').click()
        page.wait_for_load_state('networkidle')
        assert page.url == base+'guide/'
        assert page.locator('.copy-prompt').count() == 7
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
        assert page.evaluate('Reveal.getTotalSlides()') == 20
        for number in range(20):
            page.evaluate('(i)=>Reveal.slide(i)', number)
            page.wait_for_timeout(400)
            assert page.evaluate('Reveal.getIndices().h') == number
            page.screenshot(animations='disabled', path=str(OUT/f'slide-{number+1:02}.png'))
        for link in slide_links:
            page.goto(link, wait_until='networkidle')
            page.wait_for_function('(i)=>Reveal.getIndices().h === i', arg=int(link.rsplit('/',1)[1]))
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
        notes.screenshot(animations='disabled', path=str(OUT/'speaker-notes.png'))
        notes.close()
        results.append('Reveal: 20 slide renders, hash links, F fullscreen and S notes popup PASS')
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
        page.screenshot(animations='disabled', path=str(OUT/'slides-mobile.png'))
        assert not errors, errors
        assert not external, external
        assert not bad, bad
        results.append('No JavaScript errors, HTTP failures or external resource requests')
        browser.close()
    (OUT/'results.json').write_text(json.dumps({'checks':results,'note':'Real site-render QA only. Not workshop rehearsal or application acceptance evidence.'},indent=2))
    print('\n'.join(results))
finally:
    server.shutdown()
