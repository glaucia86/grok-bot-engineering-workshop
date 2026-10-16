"""Exercise the actual browser loop without launching Chromium or its HTTP server."""
import ast
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class FragmentPage:
    def __init__(self):
        self.number = 0
        self.step = 0
        self.events = []
        self.fragment_counts = {3: 3, 5: 2, 10: 1}

    def evaluate(self, expression, argument=None):
        if expression == '(i)=>Reveal.slide(i,0,-1)':
            self.number, self.step = argument, 0
        elif expression == 'Reveal.getIndices().h':
            return self.number
        elif expression == 'Reveal.nextFragment()':
            if self.step == self.fragment_counts.get(self.number, 0):
                return False
            self.step += 1
            self.events.append(('advance', self.number, self.step))
            return True
        elif 'new Set(' in expression:
            return self.fragment_counts.get(argument, 0)
        elif '.fragment:not(.visible)' in expression:
            return self.fragment_counts.get(argument, 0) - self.step
        else:
            raise AssertionError(f'Unexpected browser operation: {expression}')

    def wait_for_timeout(self, milliseconds):
        self.events.append(('wait', milliseconds))

    def screenshot(self, *, animations, path):
        self.events.append(('capture', Path(path).name))
        assert animations == 'disabled'


class SpeakerFragmentCapture(unittest.TestCase):
    def capture_events(self):
        # The verifier has intentional top-level browser/server work. Execute only
        # its actual slide loop, avoiding import side effects or a duplicate loop.
        source = ROOT / 'scripts/check_speaker_browser.py'
        tree = ast.parse(source.read_text(encoding='utf-8'), filename=str(source))
        loop = next(node for node in ast.walk(tree) if isinstance(node, ast.For)
                    and isinstance(node.target, ast.Name) and node.target.id == 'number')
        page = FragmentPage()
        namespace = {'page': page, 'OUT': Path('evidence'), 'stepped': 0}
        exec(compile(ast.Module(body=[loop], type_ignores=[]), str(source), 'exec'), namespace)
        return page, namespace['stepped']

    def test_each_fragment_waits_before_its_unique_step_capture(self):
        page, stepped = self.capture_events()
        self.assertEqual(stepped, 6)
        for index, event in enumerate(page.events):
            if event[0] == 'advance':
                _, slide, step = event
                self.assertEqual(page.events[index + 1], ('wait', 700))
                self.assertEqual(page.events[index + 2],
                                 ('capture', f'slide-{slide + 1:02}-step-{step:02}.png'))
        steps = [event[1] for event in page.events
                 if event[0] == 'capture' and '-step-' in event[1]]
        self.assertEqual(len(steps), 6)
        self.assertEqual(len(set(steps)), 6)

    def test_initial_and_final_names_are_preserved_without_phantom_steps(self):
        page, _ = self.capture_events()
        captures = [event[1] for event in page.events if event[0] == 'capture']
        for number in range(1, 23):
            self.assertIn(f'slide-{number:02}.png', captures)
        self.assertEqual([name for name in captures if '-final' in name],
                         ['slide-04-final.png', 'slide-06-final.png', 'slide-11-final.png'])
        self.assertNotIn('slide-01-step-01.png', captures)


if __name__ == '__main__':
    unittest.main()
