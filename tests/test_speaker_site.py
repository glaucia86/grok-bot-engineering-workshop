import importlib.util
import pathlib
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('site_builder', ROOT/'scripts/build_speaker_site.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class SpeakerSite(unittest.TestCase):
    def test_recovery_block_keeps_routine_optional_and_qa_fixed(self):
        content_spec = importlib.util.spec_from_file_location('speaker_content_recovery', ROOT/'scripts/speaker_content.py')
        content = importlib.util.module_from_spec(content_spec)
        content_spec.loader.exec_module(content)
        recovery = content.BLOCKS[6]
        slide = content.SL[17]
        self.assertEqual(recovery['name'], 'Recovery')
        self.assertEqual((recovery['t'], recovery['et'], recovery['slides']), ('12:10–12:22', '10:10–10:22', (18, 18)))
        self.assertEqual((slide['title'], slide['m'], slide['clicks']), ('Block 6: Recovery first', 12, 1))
        self.assertIn('OPTIONAL', slide['do'][1]['en'])
        self.assertIn('OPCIONAL', slide['do'][1]['pt'])
        self.assertIn('OPTIONAL', slide['do'][2]['en'])
        self.assertIn('OPCIONAL', slide['do'][2]['pt'])
        self.assertIn('Q&A starts at 12:22', ' '.join(line['en'] for line in slide['say']))

    def test_rule_run_sheet_click_count_uses_slide_source(self):
        from unittest.mock import patch
        content_spec = importlib.util.spec_from_file_location('speaker_content', ROOT/'scripts/speaker_content.py')
        content = importlib.util.module_from_spec(content_spec)
        content_spec.loader.exec_module(content)
        def rule_row(table):
            return next(line for line in table.splitlines() if len(line.split('|')) > 4 and line.split('|')[3].strip() == '5')
        self.assertEqual(content.SL[4]['clicks'], 1)
        self.assertIn('(1 clique)', rule_row(content.run_sheet()))
        guide = (ROOT/'docs/speaker/guia-glaucia.md').read_text(encoding='utf-8')
        self.assertIn('(1 clique)', rule_row(guide))
        # A future fragment change must also update the table, including pluralization.
        with patch.dict(content.SL[4], clicks=3):
            self.assertIn('(3 cliques)', rule_row(content.run_sheet()))

    def test_build_is_allowlisted_and_relative(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = pathlib.Path(tmp)/'site'
            builder.build(ROOT, out)
            self.assertTrue((out/'index.html').exists())
            self.assertTrue((out/'guide/index.html').exists())
            self.assertTrue((out/'slides/vendor/fonts/Virgil.woff2').exists())
            self.assertFalse((out/'mvp').exists())
            self.assertFalse((out/'spec.md').exists())
            self.assertFalse((out/'package.json').exists())
            guide = (out/'guide/index.html').read_text()
            self.assertIn('../slides/#/0', guide)
            self.assertIn('../slides/#/21', guide)
            self.assertIn('Copiar prompt', guide)
            self.assertIn('lang="en"', guide)
            self.assertIn('11:00', guide)
            self.assertIn('12:30', guide)
            self.assertNotIn('href="/assets', guide)
            self.assertNotIn('href="../../spec.md', guide)
            self.assertIn('github.com/glaucia86/grok-bot-engineering-workshop/blob/', guide)
    def test_rejects_unsafe_source_links(self):
        with self.assertRaises(ValueError):
            builder.source_url('javascript:alert(1)')
        with self.assertRaises(ValueError):
            builder.source_url('../../../../etc/passwd')
    def test_prompts_identical_to_canonical_guide(self):
        from html import unescape
        import re
        guide = (ROOT/'docs/speaker/guia-glaucia.md').read_text()
        prompts = re.findall(r'```\w*\n(.*?)\n```', guide, re.S)
        with tempfile.TemporaryDirectory() as tmp:
            builder.build(ROOT, pathlib.Path(tmp)/'site')
            output = (pathlib.Path(tmp)/'site/guide/index.html').read_text()
            copied = [unescape(x).rstrip() for x in re.findall(r'<pre><code[^>]*>(.*?)</code></pre>',output,re.S)]
            self.assertEqual([x.rstrip() for x in prompts],copied)
            self.assertEqual(output.count('class="copy-prompt"'),10)
            self.assertEqual(output.count('class="copy-command"'),1)
            self.assertIn('Copiar comando',output)
            self.assertIn('git ls-remote --exit-code --heads origin refs/heads/checkpoint/mvp-base',output)
    def test_generated_speaker_content_is_up_to_date(self):
        import subprocess, sys
        before = {p: p.read_bytes() for p in [ROOT/'docs/speaker/guia-glaucia.md', ROOT/'docs/speaker/slides/index.html']}
        result = subprocess.run([sys.executable, str(ROOT/'scripts/speaker_content.py'), '--check'], cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, 'Generated guide/deck notes are stale. Run: python scripts/speaker_content.py\n' + result.stdout + result.stderr)
        self.assertEqual(before, {p: p.read_bytes() for p in before}, '--check must be read-only')
    def test_all_relative_resources_and_anchors_resolve(self):
        from html.parser import HTMLParser
        from urllib.parse import urlsplit, unquote
        class Links(HTMLParser):
            def __init__(self): super().__init__(); self.links=[]; self.ids=set()
            def handle_starttag(self,tag,attrs):
                attrs=dict(attrs)
                if 'id' in attrs:self.ids.add(attrs['id'])
                for key in ['href','src']:
                    if key in attrs:self.links.append(attrs[key])
        with tempfile.TemporaryDirectory() as tmp:
            out=pathlib.Path(tmp)/'site';builder.build(ROOT,out)
            for page in out.rglob('*.html'):
                parsed=Links();parsed.feed(page.read_text())
                for link in parsed.links:
                    url=urlsplit(link)
                    if url.scheme or url.netloc:continue
                    target=(page.parent/unquote(url.path)).resolve() if url.path else page
                    if target.is_dir():target=target/'index.html'
                    self.assertTrue(target.is_relative_to(out.resolve()),link)
                    self.assertTrue(target.is_file(),link)
                    if url.fragment and not url.fragment.startswith('/'):
                        dest=Links();dest.feed(target.read_text())
                        self.assertIn(url.fragment,dest.ids,link)
    def test_fail_closed_for_unreviewed_assets(self):
        import shutil
        for filename in ['.env','unreviewed.png','private-notes.txt','extra.html','extra.js','.gitkeep']:
            with tempfile.TemporaryDirectory() as tmp:
                source=pathlib.Path(tmp)/'source';source.mkdir()
                shutil.copytree(ROOT/'docs',source/'docs')
                (source/'docs/speaker/slides'/filename).write_text('private')
                with self.assertRaises(ValueError):builder.build(source,pathlib.Path(tmp)/'out')
    def test_rejects_symlinked_inputs(self):
        import shutil
        for relative in ['docs/speaker/guia-glaucia.md','docs/speaker/site/site.css','docs/speaker/site/site.js','docs/speaker/slides/vendor/fonts/Virgil.woff2']:
            with tempfile.TemporaryDirectory() as tmp:
                source=pathlib.Path(tmp)/'source';source.mkdir()
                shutil.copytree(ROOT/'docs',source/'docs')
                secret=pathlib.Path(tmp)/'private';secret.write_text('private content')
                target=source/relative;target.unlink();target.symlink_to(secret)
                with self.assertRaises(ValueError):builder.build(source,pathlib.Path(tmp)/'out')
                self.assertFalse((pathlib.Path(tmp)/'out').exists())
    def test_source_urls_cannot_inject_attributes(self):
        for link in ['foo&quot;onclick=&quot;alert(1)', '#x&quot;onclick=&quot;alert(1)', 'https://example.org/"onmouseover="x']:
            result=builder.source_url(link)
            self.assertNotIn('"',result)
            self.assertNotIn('<',result)
        for link in ['javascript:alert(1)','data:text/html,test','file:///etc/passwd']:
            with self.assertRaises(ValueError):builder.source_url(link)
    def test_english_speech_does_not_label_translation_english(self):
        output=builder.render_guide('> "Welcome!"\n> *Bem-vindos!*')
        self.assertIn('<span lang="en" class="spoken">"Welcome!"</span>',output)
        self.assertNotIn('<p lang="en"',output)
    def test_deck_prompts_match_guide(self):
        import re
        from html import unescape
        guide=(ROOT/'docs/speaker/guia-glaucia.md').read_text()
        deck=(ROOT/'docs/speaker/slides/index.html').read_text()
        expected=[body for language,body in re.findall(r'```(\w*)\n(.*?)\n```',guide,re.S) if not language]
        actual=[unescape(x) for x in re.findall(r'<pre>(.*?)</pre>',deck,re.S)]
        self.assertEqual(expected,actual)
    def test_assets_have_no_external_runtime_dependencies(self):
        import re
        source = (ROOT/'docs/speaker/slides/index.html').read_text()
        self.assertNotRegex(source, r'(?:src|href)=["\']https?://')
        self.assertEqual(source.count('class="ph"'),6)
        self.assertIn('mock UI',source)
        self.assertNotIn('criteria 1–10',source)
        self.assertIn('WARN',source)

if __name__=='__main__': unittest.main()
