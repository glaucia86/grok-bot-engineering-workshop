"""Exact geometry reuse and non-interference contracts for the speaker mascots."""
import pathlib
import re
import unittest
import xml.etree.ElementTree as ET
ROOT = pathlib.Path(__file__).resolve().parents[1]
DECK = ROOT / 'docs/speaker/slides'
class SlideMascots(unittest.TestCase):
    def test_five_authored_mascots_match_application_geometry(self):
        source = (ROOT/'mvp/src/components/workshop-mascot.tsx').read_text()
        names = {'grok':'grok','fde':'fde-typescript','qa':'qa-bot','devops':'devops','lead':'engineering-lead'}
        for ident, color, path in re.findall(r'id: "(.*?)", color: "(.*?)".*?path: "(.*?)"', source):
            svg = ET.fromstring((DECK/f'assets/avatars/{names[ident]}.svg').read_text())
            body = svg.find('{http://www.w3.org/2000/svg}path')
            self.assertEqual((body.attrib['d'], body.attrib['fill']), (path,color))
    def test_exports_are_current(self):
        import runpy
        generated = runpy.run_path(str(ROOT/'scripts/sync_speaker_mascots.py'))['generated']
        for path, expected in generated().items():
            self.assertEqual(path.read_text(), expected, str(path))

    def test_cover_and_closing_have_all_five(self):
        sections = re.findall(r'<section\b.*?</section>', (DECK/'index.html').read_text(), re.S)
        for section in (sections[0],sections[-1]):
            for name in ['grok','fde-typescript','qa-bot','devops','engineering-lead']:
                self.assertEqual(section.split('<aside')[0].count(f'assets/avatars/{name}.svg'),1)
    def test_svg_layout_matches_every_replaced_image_context(self):
        css = (DECK/'assets/deck.css').read_text()
        mascot_css = (DECK/'assets/mascots.css').read_text()
        for context, declarations in re.findall(r'([^{}]+) img \{([^}]+)\}', css):
            rule = context.strip() + ' .workshop-mascot {' + declarations + '}'
            self.assertIn(rule, mascot_css)

    def test_authored_descriptions_match_exported_artwork(self):
        for name in ['scripts/speaker_content.py', 'docs/speaker/guia-glaucia.md', 'docs/speaker/slides/index.html']:
            text = (ROOT/name).read_text()
            for stale in ['blue square', 'quadrado azul', 'orange cloud', 'nuvem laranja']:
                self.assertNotIn(stale, text, name)
            self.assertIn('gota roxa', text)
            self.assertIn('quadrado verde', text)
        builder = (ROOT/'scripts/build_speaker_site.py').read_text()
        for description in ['FDE TypeScript, green rounded square', 'DevOps, purple teardrop', 'Engineering Lead, red wedge']:
            self.assertIn(description, builder)

    def test_standalone_grok_keeps_its_visibility_outline(self):
        svg = ET.fromstring((DECK/'assets/avatars/grok.svg').read_text())
        body = svg.find('{http://www.w3.org/2000/svg}path')
        self.assertEqual(body.get('stroke'), '#647078')
        self.assertEqual(body.get('stroke-width'), '1.5')

    def test_fixed_stage_disables_automatic_mobile_scroll_view(self):
        self.assertIn('scrollActivationWidth: null', (DECK/'index.html').read_text())

    def test_motion_is_local_and_does_not_capture_navigation(self):
        js = (DECK/'assets/mascots.js').read_text()
        self.assertIn('prefers-reduced-motion: no-preference',js)
        self.assertIn('visibilitychange',js)
        self.assertIn('slidechanged',js)
        for forbidden in ['preventDefault(', 'stopPropagation(', 'fetch(', 'keydown', 'https://']:
            self.assertNotIn(forbidden,js)
        self.assertIn('assets/mascots.js', (DECK/'index.html').read_text())
if __name__ == '__main__': unittest.main()
