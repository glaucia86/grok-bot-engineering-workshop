import pathlib
import sys
import tempfile
import unittest
import json
import re
import html
import subprocess
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
from build_speaker_site import build
from speaker_slide_localization import NAV_SCRIPT, catalog, render_portuguese, translate, localize_diagrams
from speaker_content import SL, PROMPTS
ROOT = pathlib.Path(__file__).resolve().parents[1]

class SlideLocalizationTest(unittest.TestCase):
    def test_rescheduled_date_is_consistent_across_published_pages(self):
        expected = {
            'index.html': '20 Nov 2026',
            'slides/index.html': '20 Nov 2026',
            'slides/pt-br/index.html': '20 nov 2026',
            'guide/index.html': '20 de novembro de 2026',
            'guide/en-us/index.html': 'November 20, 2026',
            'guide/live/index.html': 'November 20, 2026',
            'guide/run-sheet/index.html': '20/11',
        }
        with tempfile.TemporaryDirectory() as tmp:
            output = pathlib.Path(tmp) / 'site'
            build(ROOT, output)
            for route, date in expected.items():
                with self.subTest(route=route):
                    page = (output / route).read_text()
                    self.assertIn(date, page)
                    self.assertNotRegex(page, r'November 17|17 [Nn]ov 2026|17 de novembro|17/11')
                    if route == 'index.html':
                        self.assertIn('11:00–12:30', page)

    def test_build_publishes_portuguese_from_shared_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = pathlib.Path(tmp) / 'site'
            build(ROOT, output)
            pt = output / 'slides/pt-br/index.html'
            self.assertTrue(pt.exists(), 'Portuguese slide route must be generated')
            html = pt.read_text()
            self.assertIn('<html lang="pt-BR">', html)
            self.assertIn('<title>Crie seu primeiro time de bots de engenharia com Grok Bot · Packt · 20 nov 2026</title>', html)
            self.assertIn('<h1>Crie seu primeiro<br><span class="hl-amber">time de bots de engenharia</span><br>com Grok Bot</h1>', html)
            self.assertTrue('CI verde<br><span class="hl-red">não</span> é aceite.' in html, 'PT grammar must preserve emphasis on não')
            self.assertEqual(html.count('<section '), 22)
            self.assertEqual(html.count('<aside class="notes">'), 22)
            self.assertIn('Bem-vindos, pessoal!', html)
            self.assertNotIn('Welcome, everyone!', html)
            self.assertIn('../assets/deck.css', html)
            self.assertIn('href="../"', html)
            self.assertIn('fragmentInURL: true', html)
            en = (output/'slides/index.html').read_text()
            self.assertIn('Build Your First', en)
            self.assertIn('href="pt-br/"', en)
            self.assertTrue((output/'slides/pt-br/diagrams.js').exists())
            notes_ui = output/'slides/pt-br/notes.js'
            self.assertTrue(notes_ui.exists(), 'Presenter controls must also be localized')
            self.assertIn('Próximo slide', notes_ui.read_text())
            self.assertTrue(r'lang=\"pt-BR\"' in notes_ui.read_text(), 'Presenter view language must be PT-BR')

    def test_merge_language_expresses_authority_not_a_promised_outcome(self):
        source = (ROOT/'docs/speaker/slides/index.html').read_text()
        self.assertIn('Only I can merge.', source)
        self.assertNotIn('I always merge.', source)
        self.assertIn('From empty chat to a reviewed PR', source)

    def test_shared_mascots_support_nested_locale_asset_paths(self):
        script = (ROOT/'docs/speaker/slides/assets/mascots.js').read_text()
        self.assertTrue('img[src^="../assets/avatars/"]' in script,
                        'Nested PT avatar paths must be promoted to animated SVGs')

    def test_offline_language_link_keeps_file_slide_and_fragment(self):
        script = NAV_SCRIPT.removeprefix('<script>').removesuffix('</script>')
        harness = """
        const link = {getAttribute:()=> '../', addEventListener:()=>{}};
        global.document = {querySelector:()=>link};
        global.Reveal = {isReady:()=>true, getIndices:()=>({h:5,v:0,f:2})};
        global.window = {Reveal,location:{href:'file:///tmp/site/slides/pt-br/index.html',search:'',hash:''},addEventListener:()=>{}};
        """ + script + "\nconsole.log(link.href)"
        run = subprocess.run(['node','-e',harness],capture_output=True,text=True,check=True)
        self.assertEqual(run.stdout.strip(), 'file:///tmp/site/slides/index.html#/5/0/2')

    def test_new_visible_english_text_requires_explicit_translation(self):
        with self.assertRaisesRegex(ValueError, 'Untranslated slide text'):
            translate('A new sentence that has not been reviewed.', catalog())

    def test_portuguese_notes_preserve_every_executable_prompt(self):
        source = (ROOT/'docs/speaker/slides/index.html').read_text()
        result = render_portuguese(source, catalog())
        prompts = [html.unescape(p) for p in re.findall(r'<pre lang="en">(.*?)</pre>', result, re.S)]
        expected = [PROMPTS[step['prompt']] for slide in SL for step in slide['do'] if step['prompt'] is not None]
        self.assertEqual(prompts, expected)
        for slide in SL:
            self.assertEqual(len(slide['say']), 1, 'Each talk track must be one connected paragraph')
            self.assertIn(html.escape(slide['say'][0]['pt']), result)

    def test_diagrams_keep_geometry_fragments_and_technical_identifiers(self):
        source = (ROOT/'docs/speaker/slides/assets/diagrams.js').read_text()
        result = localize_diagrams(source, catalog())
        pattern = r'(\b(?:text|label):\s*)("(?:[^"\\]|\\.)*")'
        normalized = lambda text: re.sub(pattern, r'\1""', text).replace('../assets/avatars/', 'assets/avatars/')
        self.assertEqual(normalized(result), normalized(source))
        self.assertIn('/api/feedback', result)
        self.assertIn('DATABASE_URL', result)

if __name__ == '__main__': unittest.main()
