"""Real-browser language navigation, content separation and clipboard checks."""
def check_languages(page, context, base, out, results):
    for route, lang in [('guide/', 'pt-BR'), ('guide/en-us/', 'en-US')]:
        page.goto(base+route, wait_until='networkidle')
        assert page.locator('html').get_attribute('lang') == lang
        assert page.locator('.language-switch [aria-current=page]').text_content() == lang
        assert page.locator('.speech').count() == 25
        assert page.locator('.translation').count() == (0 if lang == 'en-US' else 25)
        assert page.locator('#step-25').count() == 1
        for width in (1440, 768, 390):
            page.set_viewport_size({'width': width, 'height':900})
            page.screenshot(path=str(out/f'guide-{lang}-{width}.png'), animations='disabled')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        skills_heading = 'Skills to select for QA' if lang == 'en-US' else 'Skills para selecionar no QA'
        skills = page.get_by_role('heading', name=skills_heading, exact=True)
        assert skills.locator('xpath=following-sibling::ul[1]/li').count() == 4
        for width in (1440, 390):
            page.set_viewport_size({'width':width,'height':900})
            skills.scroll_into_view_if_needed()
            page.screenshot(path=str(out/f'guide-{lang}-skills-{width}.png'), animations='disabled')
        page.locator('.speech').first.scroll_into_view_if_needed()
        page.screenshot(path=str(out/f'guide-{lang}-speech.png'), animations='disabled')
        page.locator('.copy-command').first.click()
        page.wait_for_function("document.querySelector('.copy-status').textContent.includes('copiado') || document.querySelector('.copy-status').textContent === 'Command copied.'")
        assert page.evaluate('navigator.clipboard.readText()') == page.locator('.command code').first.text_content().rstrip('\n')
        page.evaluate("Object.defineProperty(navigator.clipboard, 'writeText', {configurable:true,value:()=>Promise.reject(new Error('test rejection'))})")
        page.locator('.copy-prompt').first.click()
        page.wait_for_function("/blocked|bloqueada/.test(document.querySelector('.copy-status').textContent)")
        assert page.evaluate('getSelection().toString()') == page.locator('.prompt:not(.command) code').first.text_content()
        page.evaluate('delete navigator.clipboard.writeText')
    page.goto(base+'guide/')
    page.locator('.index a[href="#step-12"]').click()
    page.wait_for_url(base+'guide/#step-12')
    en = page.locator('.language-switch a[lang="en-US"]')
    en.focus()
    page.keyboard.press('Enter')
    page.wait_for_url(base+'guide/en-us/#step-12')
    assert page.locator('#step-12').count() == 1
    page.go_back()
    assert page.url == base+'guide/#step-12'
    page.go_forward()
    assert page.url == base+'guide/en-us/#step-12'
    page.goto(base+'guide/#run-sheet-de-uma-pagina')
    assert page.locator('#run-sheet-de-uma-pagina').is_visible()
    page.locator('#run-sheet-de-uma-pagina a').click()
    page.wait_for_url(base+'guide/run-sheet/#run-sheet-de-uma-pagina')
    nojs = context.browser.new_context(java_script_enabled=False, reduced_motion='reduce')
    fallback = nojs.new_page()
    fallback.goto(base+'guide/')
    fallback.locator('.language-switch a[lang="en-US"]').click()
    assert fallback.locator('html').get_attribute('lang') == 'en-US'
    assert fallback.locator('.speech').count() == 25
    assert fallback.locator('.command code').first.text_content()
    nojs.close()
    page.set_viewport_size({'width':1440,'height':900})
    results.append('Guide PT-BR/EN-US: 25 steps, separate speech/translation, three viewports, clipboard/fallback, keyboard, back/forward, legacy deep links and no-JS navigation PASS')
