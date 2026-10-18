import pathlib
import tempfile
import unittest
from test_speaker_site import builder, ROOT

class GuideLanguages(unittest.TestCase):
    def test_separate_complete_tutorials(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = pathlib.Path(tmp)/'site'
            builder.build(ROOT, out)
            pt = (out/'guide/index.html').read_text()
            en = (out/'guide/en-us/index.html').read_text()
            self.assertIn('lang="pt-BR"', pt)
            self.assertIn('lang="en-US"', en)
            for page in (pt,en):
                self.assertIn('class="language-switch"',page)
                self.assertIn('aria-current="page"',page)
                self.assertIn('id="step-01"',page)
                self.assertIn('id="step-24"',page)
            self.assertIn('Fale em inglês:',pt)
            self.assertIn('class="speech"',pt)
            self.assertIn('class="translation"',pt)
            self.assertIn('Copy command',en)
            self.assertIn('Skip to content',en)
            self.assertNotIn('Copiar',en)
            self.assertNotIn('Tutorial em português',en)
            self.assertTrue((out/'guide/run-sheet/index.html').exists())

    def test_tutorial_copy_blocks_are_lossless(self):
        import re
        from html import unescape
        for filename, lang in [('tutorial-en.md','en-US'),('tutorial-pt-br.md','pt-BR')]:
            source = (ROOT/'docs/speaker'/filename).read_text()
            result = builder.render_tutorial(source,lang)
            expected = re.findall(r'```\w*\n(.*?)\n```',source,re.S)
            actual = [unescape(x).rstrip('\n') for x in re.findall(r'<pre><code[^>]*>(.*?)</code></pre>',result,re.S)]
            self.assertEqual(expected,actual)
            self.assertEqual(result.count('class="speech"'),25)
            self.assertEqual(result.count('class="translation"'),0 if lang=='en-US' else 25)

    def test_legacy_skills_are_semantic_lists(self):
        import re
        source = (ROOT/'docs/speaker/guia-glaucia.md').read_text()
        result = builder.render_guide(source)
        for heading, skills in [('Skills do FDE',['shadcn','vercel-react-best-practices','neon-drizzle']),('Skills do QA',['playwright-best-practices','playwright-cli','create-verification-skill','interrogate']),('Skills do DevOps',['deploy-to-vercel','ci-cd-and-automation'])]:
            section = re.search(r'<h3[^>]*>'+heading+r'</h3>\s*<ul>(.*?)</ul>',result,re.S)
            self.assertIsNotNone(section,heading)
            self.assertEqual(section[1].count('<li>'),len(skills))
            for skill in skills:
                self.assertIn('<code>'+skill+'</code>',section[1])
        self.assertIn('O QA tem quatro skills',result)
        self.assertIn('não</strong> monta o checklist',result)

    def test_toc_uses_language_stable_steps_and_placeholders_are_visible(self):
        for filename,lang,placeholder in [('tutorial-en.md','en-US','FIELD'),('tutorial-pt-br.md','pt-BR','CAMPOS')]:
            result = builder.render_tutorial((ROOT/'docs/speaker'/filename).read_text(),lang)
            for number in range(1,26):
                self.assertIn(f'href="#step-{number:02}"',result)
            self.assertIn('&lt;'+placeholder+'&gt;',result)
            self.assertIn('<pre><code lang="en-US">',result)

    def test_tutorial_skills_are_semantic_and_separate_from_explanations(self):
        import re
        for filename,lang in [('tutorial-en.md','en-US'),('tutorial-pt-br.md','pt-BR')]:
            result = builder.render_tutorial((ROOT/'docs/speaker'/filename).read_text(),lang)
            prefix = 'Skills to select for ' if lang=='en-US' else 'Skills para selecionar no '
            for bot,count in [('FDE',3),('QA',4),('DevOps',2)]:
                section = re.search(r'<h4[^>]*>'+prefix+bot+r'</h4>\s*<ul>(.*?)</ul>',result,re.S)
                self.assertIsNotNone(section,bot)
                self.assertEqual(section[1].count('<li>'),count)
                self.assertEqual(section[1].count('<code>'),count)

    def test_continuous_speech_matches_between_languages(self):
        import re
        en = (ROOT/'docs/speaker/tutorial-en.md').read_text()
        pt = (ROOT/'docs/speaker/tutorial-pt-br.md').read_text()
        english = re.findall(r'\*\*Say in English:\*\* “([^\n]+)”',en)
        bilingual = re.findall(r'\*\*Fale em inglês:\*\* “([^\n]+)”\n\n\*\*Tradução:\*\* ([^\n]+)',pt)
        self.assertEqual(len(english),25)
        self.assertEqual(english,[line[0] for line in bilingual])
        for speech,translation in bilingual:
            self.assertGreaterEqual(len(speech.split()),30)
            self.assertLessEqual(len(speech.split()),70)
            self.assertGreater(len(translation.split()),25)
