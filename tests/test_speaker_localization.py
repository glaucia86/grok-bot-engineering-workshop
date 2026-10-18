import pathlib
import sys
import tempfile
import unittest
import json
import subprocess
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / 'scripts'))
from build_speaker_site import build
from speaker_slide_localization import NAV_SCRIPT
ROOT = pathlib.Path(__file__).resolve().parents[1]

class SlideLocalizationTest(unittest.TestCase):
    def test_build_publishes_portuguese_from_shared_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            output = pathlib.Path(tmp) / 'site'
            build(ROOT, output)
            pt = output / 'slides/pt-br/index.html'
            self.assertTrue(pt.exists(), 'Portuguese slide route must be generated')
            html = pt.read_text()
            self.assertIn('<html lang="pt-BR">', html)
            self.assertIn('Crie seu primeiro', html)
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

if __name__ == '__main__': unittest.main()
