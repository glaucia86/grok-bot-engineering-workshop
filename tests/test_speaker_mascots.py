"""Exact geometry reuse and non-interference contracts for the speaker mascots."""
import pathlib
import re
import unittest
import xml.etree.ElementTree as ET
ROOT = pathlib.Path(__file__).resolve().parents[1]
DECK = ROOT / 'docs/speaker/slides'
class SlideMascots(unittest.TestCase):
    def test_uploaded_geometry_colors_and_initial_eyes(self):
        mapping = {'grok':'bloub-cercle-neutre-encre-anime.svg','fde-typescript':'bloub-triangle-surpris-vert-anime.svg','qa-bot':'qa-bot.svg','devops':'bloub-cercle-attentif-violet-anime.svg','engineering-lead':'bloub-squircle-surpris-rouge-anime.svg'}
        ns = {'s':'http://www.w3.org/2000/svg'}
        for name, filename in mapping.items():
            original = ET.parse(ROOT/'docs/speaker/mascot-sources'/filename).getroot()
            svg = ET.parse(DECK/f'assets/avatars/{name}.svg').getroot()
            self.assertEqual(svg.get('viewBox'), '-125 -125 250 250')
            self.assertEqual([p.get('d') for p in original.findall('.//s:path', ns)], [p.get('d') for p in svg.findall('.//s:path', ns)])
            self.assertEqual([p.get('fill') for p in original.findall('.//s:rect', ns)], [p.get('fill') for p in svg.findall('.//s:rect', ns)])
            eyes = [e for e in svg.iter() if 'mascot-eye' in e.get('class','').split()]
            self.assertEqual(len(eyes),2)
            self.assertTrue(all(e.get('transform','').startswith('matrix(') for e in eyes))
            self.assertNotEqual(eyes[0].get('transform'), eyes[1].get('transform'))
            for eye in eyes:
                self.assertEqual(eye.get('style'), '--mascot-eye-initial:'+eye.get('transform'))
            self.assertNotIn('<style', ET.tostring(svg, encoding='unicode'))

    def test_template_animation_is_namespaced_and_instance_safe(self):
        html = (DECK/'index.html').read_text()
        for name in ['grok','fde','qa','devops','lead']:
            self.assertIn(f'@keyframes mascot-{name}-oeil0',html)
            self.assertIn(f'class="mascot-eye mascot-{name}-oeil1"',html)
        self.assertNotIn('@keyframes oeil',html)
        js = (DECK/'assets/mascots.js').read_text()
        self.assertIn('instance-',js)
        self.assertIn("dataset.motion = 'static'", js)
        self.assertNotIn('function blink(', js)
        self.assertIn('transform: var(--mascot-eye-initial) !important', (DECK/'assets/mascots.css').read_text())

    def test_contextual_cues_are_limited_to_the_two_chats_and_closing(self):
        html = (DECK/'index.html').read_text()
        sections = re.findall(r'<section\b.*?</section>', html, re.S)
        for index, name, cue in [(7, 'fde-typescript', 'thinking'), (12, 'qa-bot', 'thinking'), (21, 'grok', 'wink')]:
            visible = sections[index].split('<aside class="notes">')[0]
            self.assertRegex(visible, rf'<img(?=[^>]*src="assets/avatars/{name}\.svg")(?=[^>]*data-mascot-cue="{cue}")[^>]*>')
        self.assertEqual(html.count('data-mascot-cue="thinking"'), 2)
        self.assertEqual(html.count('data-mascot-cue="wink"'), 1)

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
            for stale in ['blue square', 'quadrado azul', 'orange cloud', 'nuvem laranja', 'green square', 'quadrado verde', 'purple drop', 'gota roxa']:
                self.assertNotIn(stale, text, name)
            self.assertIn('círculo roxo', text)
            self.assertIn('triângulo verde', text)
        builder = (ROOT/'scripts/build_speaker_site.py').read_text()
        for description in ['FDE TypeScript, green triangle', 'DevOps, purple circle', 'Engineering Lead, red rounded square']:
            self.assertIn(description, builder)

    def test_standalone_grok_keeps_its_visibility_outline(self):
        svg = ET.fromstring((DECK/'assets/avatars/grok.svg').read_text())
        body = next(e for e in svg.iter() if e.get('class') == 'mascot-body')
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
