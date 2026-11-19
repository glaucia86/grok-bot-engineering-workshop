"""Build PT-BR from the canonical deck; never maintain a second slide tree.

The catalog covers exact visible text and accessible labels. Unknown text fails
closed so English edits cannot silently leak into the Portuguese deck. Code,
identifiers and technical names are explicitly preserved. Speaker notes use the
existing Portuguese source fields; executable prompts remain byte-identical.
"""
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from speaker_content import SL, BLOCKS, PROMPTS, ST, DEMO, DEMO_BACK

CATALOG_PATH = Path(__file__).with_name('speaker_slides_pt_br.tsv')
PRESERVED = {
    'Design', 'FDE TypeScript', 'QA bot', 'DevOps', 'Grok Bot', 'Glaucia',
    'Glaucia Lemos', 'FDE', 'QA', 'README.md', 'mvp/', 'checkpoint/mvp-base',
    'docs/inception.md', 'CI + Vercel', 'Workshop - Packt Grok Bot',
    'Glaucia + FDE TypeScript + QA bot + DevOps', 'shadcn',
    'vercel-react-best-practices', 'neon-drizzle', 'playwright-best-practices',
    'playwright-cli', 'create-verification-skill', 'interrogate',
    'principle-prove-it-works', 'PASS', 'FAIL', 'WARN', 'BLOCKED', 'abc1234',
    'PASS · AC4', 'FAIL · AC8', 'Actions:', 'DATABASE_URL:', 'Feedback MVP',
    'GitHub Actions', 'keynote', 'GitHub Actions + preview',
    'PASS / FAIL / WARN / BLOCKED', 'CI + preview', 'Lauren Tan', '(@poteto)',
    '/poteto-mode', '/poteto-help', 'cursor.com/marketplace/cursor/pstack',
    'github.com/cursor/plugins/tree/main/pstack', 'x.ai/bot/plugin/9717366',
    'GitHub Actions\nVitest · Playwright', 'Drizzle ORM', 'GitHub PR', 'SQL', 'deploy', 'DevOps\nCI + preview',
    'Pull request', 'CI + preview\nActions · Vercel',
    'https://www.youtube.com/watch?v=O_zcc6Xl12g',
}


def catalog():
    pairs = [line.split('\t') for line in CATALOG_PATH.read_text(encoding='utf-8').splitlines() if line]
    if any(len(p) != 2 for p in pairs) or len({p[0] for p in pairs}) != len(pairs):
        raise ValueError('Invalid or duplicate slide translation')
    return {a.replace('\\n', '\n'): b.replace('\\n', '\n') for a, b in pairs}


def translate(text, messages):
    key = text.strip()
    if not key:
        return text
    if key in messages:
        return text[:len(text)-len(text.lstrip())] + messages[key] + text[len(text.rstrip()):]
    if key in PRESERVED or re.fullmatch(r'[\d\s.:,–·+→↗↻●/!?-]+(?: ET| BRT| min)?', key):
        return text
    raise ValueError(f'Untranslated slide text: {key!r}')


class LocalizedHTML(HTMLParser):
    def __init__(self, messages):
        super().__init__(convert_charrefs=True)
        self.messages, self.out, self.raw = messages, [], None

    def handle_starttag(self, tag, attrs):
        original = self.get_starttag_text()
        if tag in ('script', 'style'):
            self.raw = tag
        def attr(match):
            name, value = match[1], html.unescape(match[2])
            if name in ('alt', 'aria-label', 'title'):
                value = translate(value, self.messages)
            elif name == 'data-block':
                number, label = value.split(' · ', 1)
                value = number + ' · ' + translate(label, self.messages)
            elif name in ('src', 'href') and value.startswith(('assets/', 'vendor/')):
                value = {'assets/diagrams.js': 'diagrams.js', 'vendor/reveal.js-5.2.1/plugin/notes/notes.js': 'notes.js'}.get(value, '../' + value)
            elif tag == 'html' and name == 'lang':
                value = 'pt-BR'
            else:
                return match[0]
            return name + '="' + html.escape(value, quote=True) + '"'
        self.out.append(re.sub(r'([\w-]+)="([^"]*)"', attr, original))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        self.out.append(f'</{tag}>')
        if self.raw == tag:
            self.raw = None

    def handle_data(self, data):
        self.out.append(data if self.raw else html.escape(translate(data, self.messages), quote=False))

    def handle_comment(self, data):
        self.out.append('<!--' + data + '-->')

    def handle_decl(self, decl):
        self.out.append('<!' + decl + '>')


def portuguese_notes(index, messages):
    s, n = SL[index], index + 1
    block = next(b for b in BLOCKS if b['slides'][0] <= n <= b['slides'][1])
    def para(text, style='en'):
        return f'<p style="{ST[style]}">{html.escape(text)}</p>'
    def heading(text):
        return para(text, 'sec')
    clicks = f'{s["clicks"]} clique(s)' if s['clicks'] else 'sem cliques'
    out = [para(f'⏱ {s["t"]} BRT · {s["m"]} min · slide {n}/{len(SL)} · bloco {BLOCKS.index(block)} · {translate(block["name"], messages) if block["name"] in messages else block["name"]} · {clicks}' + (' · SLIDE OPCIONAL' if s.get('optional') else ''), 'head'), heading('🖱 Passo a passo'), '<ol>']
    if n in DEMO:
        out[1:1] = [para('🎬 DEMO AO VIVO AGORA', 'sec'), para(DEMO[n][1]), para(DEMO_BACK[1])]
    for step in s['do']:
        out.append('<li>' + para(step['pt']))
        for key, prefix in [('ok', '✅ '), ('fail', '⚠️ ')]:
            if step[key]:
                out.append(para(prefix + step[key][1]))
        if step['prompt'] is not None:
            out.append('<p>Prompt para copiar (em inglês):</p><pre lang="en">' + html.escape(PROMPTS[step['prompt']]) + '</pre>')
        out.append('</li>')
    out.extend(['</ol>', heading('🗣 Fale (leia em voz alta)')])
    out.extend(para(line['pt']) for line in s['say'])
    out.extend([heading('✂️ Se atrasar'), para(s['cut'][1])])
    if s['qa']:
        out.append(heading('❓ Perguntas prováveis'))
        for q in s['qa']:
            out.extend([para('P: ' + q['qpt']), para('R: ' + q['apt'])])
    if s['nxt']:
        out.extend([heading('➡️ Transição'), para(s['nxt'][1])])
    if n == block['slides'][1]:
        out.extend([heading('✅ Como saber que funcionou'), para(block['check'][1])])
    return '<aside class="notes">\n' + '\n'.join(out) + '\n</aside>'


NAV_STYLE = '''<style id="deck-language-style">
.deck-language{position:fixed;right:18px;top:12px;z-index:40;font:600 14px Inter,sans-serif;background:#111827;border:1px solid #64748b;border-radius:8px;padding:6px 10px;display:flex;gap:10px;align-items:center;color:#e2e8f0}
.deck-language a{color:#e2e8f0;text-decoration:underline;padding:3px}.deck-language a:focus-visible{outline:3px solid #fbbf24;outline-offset:3px}.deck-language [aria-current]{color:#fbbf24}
@media print{.deck-language{display:none}}
</style>'''
NAV_SCRIPT = '''<script>
(function () {
  const link = document.querySelector('.deck-language a');
  function destination() {
    const url = new URL(link.getAttribute('data-route'), window.location.href);
    if (url.protocol === 'file:' && url.pathname.endsWith('/')) url.pathname += 'index.html';
    url.search = window.location.search;
    const index = window.Reveal && Reveal.isReady() ? Reveal.getIndices() : null;
    url.hash = index ? '/' + index.h + '/' + (index.v || 0) + (typeof index.f === 'number' ? '/' + index.f : '') : window.location.hash;
    link.href = url.href;
  }
  destination();
  link.addEventListener('click', destination);
  link.addEventListener('focus', destination);
  window.addEventListener('hashchange', destination);
})();
</script>'''


def with_language_switch(text, locale):
    pt = locale == 'pt-BR'
    route, label, current = ('../', 'English', 'Português') if pt else ('pt-br/', 'Português', 'English')
    nav = f'<nav class="deck-language" aria-label="{"Idioma dos slides" if pt else "Slide language"}"><span aria-current="true">{current}</span><a href="{route}" data-route="{route}" lang="{"en" if pt else "pt-BR"}" hreflang="{"en" if pt else "pt-BR"}">{label}</a></nav>'
    return text.replace('</head>', NAV_STYLE + '\n</head>').replace('<body>', '<body>\n' + nav).replace('hash: true,', 'hash: true, fragmentInURL: true,').replace('</body>', NAV_SCRIPT + '\n</body>')


def render_portuguese(source, messages):
    notes = []
    def hold_notes(match):
        notes.append(portuguese_notes(len(notes), messages))
        return f'<!--localized-notes-{len(notes)-1}-->'
    source = re.sub(r'<aside class="notes">.*?</aside>', hold_notes, source, flags=re.S)
    if len(notes) != len(SL):
        raise ValueError('Slide and speaker-note counts differ')
    parser = LocalizedHTML(messages)
    parser.feed(source)
    output = ''.join(parser.out)
    for index, note in enumerate(notes):
        output = output.replace(f'<!--localized-notes-{index}-->', note)
    # HUD block labels are JavaScript literals, never source-code identifiers.
    for label in ['Setup', 'Create the bots', 'Design', 'Verify', 'Background PR', 'Approval', 'Recovery', 'Q&A']:
        output = output.replace('["' + label + '",', '[' + json.dumps(translate(label, messages), ensure_ascii=False) + ',')
    output = output.replace('`Block ${bi}', '`Bloco ${bi}')
    # Portuguese grammar: the original uses separate emphasis spans for "is not".
    output = output.replace('>é <span class="hl-red">não</span> aceite.', '><span class="hl-red">não</span> é aceite.')
    return with_language_switch(output, 'pt-BR')


def localize_diagrams(source, messages):
    def label(match):
        return match[1] + json.dumps(translate(json.loads(match[2]), messages), ensure_ascii=False)
    return re.sub(r'(\b(?:text|label):\s*)("(?:[^"\\]|\\.)*")', label, source).replace('"assets/avatars/"', '"../assets/avatars/"')


def localize_notes_plugin(source):
    # Only presentation strings in the vendored MIT plugin; no third-party code
    # changes or copied source file to maintain. Fail if an upgrade changes them.
    labels = {
        r'lang=\"en\"': r'lang=\"pt-BR\"',
        'reveal.js - Speaker View': 'reveal.js - Notas da apresentadora',
        '>Loading speaker view...</div>': '>Carregando notas da apresentadora...</div>',
        '>Upcoming</span>': '>Próximo slide</span>',
        '>Notes</h4>': '>Notas</h4>',
        '>Time <span': '>Tempo <span',
        '>Click to Reset</span>': '>Clique para zerar</span>',
        '>Pacing – Time to finish current slide</h4>': '>Ritmo – Tempo para concluir este slide</h4>',
        "'Default'": "'Padrão'", "'Wide'": "'Largo'", "'Tall'": "'Alto'", "'Notes only'": "'Só notas'",
        'Cross origin error.<br>The speaker window can only be opened from the same origin.': 'Erro de origem.<br>A janela de notas só pode ser aberta na mesma origem.',
        'Error connecting to main window.<br>Please try closing and reopening the speaker view.': 'Erro ao conectar à janela principal.<br>Feche e reabra a janela de notas.',
        'Speaker view popup failed to open. Please make sure popups are allowed and reopen the speaker view.': 'A janela de notas não abriu. Permita pop-ups e reabra a janela de notas.',
    }
    for before, after in labels.items():
        if before not in source:
            raise ValueError('Notes plugin translation needs review: ' + before)
        source = source.replace(before, after)
    return source


def publish_localized_slides(speaker, output):
    messages = catalog()
    source = (speaker/'slides/index.html').read_text(encoding='utf-8')
    pt = render_portuguese(source, messages)
    diagrams = localize_diagrams((speaker/'slides/assets/diagrams.js').read_text(encoding='utf-8'), messages)
    destination = output/'slides/pt-br'
    destination.mkdir()
    (destination/'index.html').write_text(pt, encoding='utf-8')
    (destination/'diagrams.js').write_text(diagrams, encoding='utf-8')
    (destination/'notes.js').write_text(localize_notes_plugin((speaker/'slides/vendor/reveal.js-5.2.1/plugin/notes/notes.js').read_text(encoding='utf-8')), encoding='utf-8')
    (output/'slides/index.html').write_text(with_language_switch(source, 'en'), encoding='utf-8')
