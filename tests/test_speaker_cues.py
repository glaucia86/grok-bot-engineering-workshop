"""Finite mascot cues sampled by elapsed time, independent of refresh rate."""
import json
from pathlib import Path
import subprocess
import unittest
ROOT = Path(__file__).resolve().parents[1]
class MascotCues(unittest.TestCase):
    def sample(self, kind, times):
        script = 'const sandbox = {window:{}}; require("node:vm").runInNewContext(require("node:fs").readFileSync("./docs/speaker/slides/assets/mascot-cues.js", "utf8"), sandbox); const {sampleCue} = sandbox.window.WorkshopMascotCues; console.log(JSON.stringify('+json.dumps(times)+'.map(t=>sampleCue('+json.dumps(kind)+', t))));'
        result = subprocess.run(['node','-e',script],cwd=ROOT,text=True,capture_output=True)
        self.assertEqual(result.returncode,0,result.stderr)
        return json.loads(result.stdout)
    def test_thinking_has_one_left_to_right_pulse_then_finishes(self):
        samples = self.sample('thinking',[0,825,1325,1825,2850,10000])
        self.assertEqual(samples[0]['opacity'],0)
        for index, sample in enumerate(samples[1:4]):
            self.assertEqual(sample['kind'],'thinking')
            self.assertEqual(sample['pulses'].index(max(sample['pulses'])),index)
            self.assertTrue(all(0<=value<=1 for value in sample['pulses']))
        self.assertEqual(samples[4:],[None,None])
    def test_wink_closes_one_eye_once_and_returns_to_native_motion(self):
        samples = self.sample('wink',[0,450,800,1100,1550,10000])
        self.assertEqual(samples[0]['close'],0)
        self.assertEqual(samples[1]['close'],0)
        self.assertEqual(samples[2]['close'],1)
        self.assertLess(samples[3]['close'],1)
        self.assertEqual(samples[4:],[None,None])
    def test_unknown_and_invalid_times_have_no_cue(self):
        self.assertEqual(self.sample('unknown',[0,800]),[None,None])
        self.assertEqual(self.sample('thinking',[-1]),[None])
if __name__ == '__main__': unittest.main()
