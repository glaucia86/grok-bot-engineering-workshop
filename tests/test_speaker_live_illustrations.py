"""Presentation stays ready to teach without live screenshot edits."""
import re
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
class LiveIllustrations(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT/'docs/speaker/slides/index.html').read_text()
        self.slides = re.findall(r'<section\b[^>]*>(.*?)</section>', self.html, re.S)
    def test_group_conversations_have_named_speakers(self):
        for index in (7, 12):
            visible = self.slides[index].split('<aside class="notes">')[0]
            self.assertIn('group-conversation', visible)
            for name in ('Glaucia', 'FDE TypeScript', 'QA bot', 'DevOps'):
                self.assertIn(name, visible)
            self.assertIn('Simulation', visible)
            self.assertNotIn('Engineering Lead', visible)
    def test_no_screenshot_placeholders_remain(self):
        self.assertNotRegex(self.html, r'class="ph(?:"| )')
        for index in (8, 13, 14, 16, 17):
            visible = self.slides[index].split('<aside class="notes">')[0]
            self.assertNotIn('Your real rehearsal', visible)
            self.assertRegex(visible, r'(?i)illustrati|example')
    def test_portrait_and_optional_comment_are_preserved(self):
        portrait = (ROOT/'docs/speaker/slides/assets/avatars/glaucia.svg').read_text()
        self.assertIn('data:image/jpeg;base64,', portrait)
        self.assertNotIn('>GL<', portrait)
        self.assertIn('Comment <em>optional</em>', self.slides[14])
        self.assertNotIn('required comment', self.slides[14])
    def test_fragment_counts_stay_with_original_run_sheet(self):
        for index, count in {7:2, 8:1, 12:3, 13:1, 14:2, 16:3, 17:1}.items():
            visible = self.slides[index].split('<aside class="notes">')[0]
            self.assertEqual(len(re.findall(r'class="[^"]*\bfragment\b', visible)), count, index)
if __name__ == '__main__':
    unittest.main()
