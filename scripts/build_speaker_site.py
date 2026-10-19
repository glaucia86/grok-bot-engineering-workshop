#!/usr/bin/env python3
"""Build the public speaker site from an explicit, secret-free source allowlist."""
import argparse
import html
import pathlib
import re
import shutil
import urllib.parse
import markdown
from speaker_slide_localization import publish_localized_slides

REPO = 'https://github.com/glaucia86/grok-bot-engineering-workshop'
SOURCE_REF = 'main'
ROOT = pathlib.Path(__file__).resolve().parents[1]
SLIDE_FILES = frozenset(('assets/shots/.gitkeep', 'assets/avatars/grok.svg', 'assets/mascots.js', 'assets/mascot-cues.js', 'vendor/bloub/LICENSE', 'vendor/bloub/NOTICE.md', 'assets/mascots.css', 'vendor/fonts/Inter-Variable.woff2', 'vendor/fonts/OFL-Inter.txt', 'assets/avatars/devops.svg', 'assets/avatars/engineering-lead.svg', 'assets/avatars/fde-typescript.svg', 'assets/avatars/glaucia.svg', 'assets/avatars/qa-bot.svg', 'assets/deck.css', 'assets/diagrams.js', 'assets/sketch.js', 'index.html', 'vendor/fonts/OFL-Virgil.txt', 'vendor/fonts/Virgil.woff2', 'vendor/reveal.js-5.2.1/LICENSE', 'vendor/reveal.js-5.2.1/plugin/notes/notes.js', 'vendor/reveal.js-5.2.1/reset.css', 'vendor/reveal.js-5.2.1/reveal.css', 'vendor/reveal.js-5.2.1/reveal.js', 'vendor/roughjs-4.6.6/LICENSE', 'vendor/roughjs-4.6.6/rough.js'))

def source_url(link):
    link = html.unescape(link)
    parsed = urllib.parse.urlsplit(link)
    if parsed.scheme:
        if parsed.scheme != 'https':
            raise ValueError('Only HTTPS source links are allowed')
        return html.escape(html.unescape(link), quote=True)
    if link.startswith('#'):
        return html.escape(link, quote=True)
    path = pathlib.PurePosixPath('docs/speaker')
    parts = list(path.parts)
    for part in parsed.path.split('/'):
        if part == '..':
            if not parts:
                raise ValueError('Source link escapes repository')
            parts.pop()
        elif part and part != '.':
            parts.append(part)
    result = f'{REPO}/blob/{SOURCE_REF}/' + '/'.join(parts) + (f'#{parsed.fragment}' if parsed.fragment else '')
    return html.escape(result, quote=True)

def page(title, body, prefix='', lang='pt-BR'):
    return f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)} · Packt workshop</title><meta name="color-scheme" content="dark">
<link rel="stylesheet" href="{prefix}site.css"><script defer src="{prefix}site.js"></script></head>
<body><a class="skip" href="#content">{'Skip to content' if lang == 'en-US' else 'Pular para o conteúdo'}</a>{body}</body></html>'''

def render_guide(text):
    md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists'], extension_configs={'toc': {'toc_depth': '2'}})
    body = md.convert(text)
    body = re.sub(r'href="([^"]+)"', lambda m: 'href="'+source_url(m[1])+'"', body)
    # English quotes are spoken aloud; Portuguese directions/translations stay visible.
    body = re.sub(r'<p>(["“].*?["”])(.*?)</p>', r'<p><span lang="en" class="spoken">\1</span>\2</p>', body, flags=re.S)
    def copy_block(match):
        command = 'language-sh' in match[0]
        kind, label = ('command', 'comando') if command else ('prompt', 'prompt')
        wrapper = 'prompt command' if command else 'prompt'
        return f'<div class="{wrapper}"><button type="button" class="copy-{kind}">Copiar {label}</button><pre><code lang="en">'
    body = re.sub(r'<pre><code(?: class="[^"]*")?>', copy_block, body)
    body = body.replace('</code></pre>', '</code></pre></div>')
    # Link each run-sheet slide number (human 1-based, Reveal hash 0-based).
    def table_links(match):
        table = match[0]
        if '<th>Slide</th>' in table:
            table = re.sub(r'<td>(\d{1,2})</td>', lambda m: f'<td><a href="../slides/#/{int(m[1])-1}" target="workshop-slides">Slide {m[1]}</a></td>', table)
        return '<div class="table-scroll" tabindex="0" role="region" aria-label="Tabela do workshop">'+table+'</div>'
    body = re.sub(r'<table>.*?</table>', table_links, body, flags=re.S)
    jumps = {0:0, 1:5, 2:8, 3:9, 4:13, 5:15, 6:17, 7:18}
    for block, slide in jumps.items():
        body = re.sub(r'(<h2[^>]*>'+str(block)+r' · .*?</h2>)', r'\1'+f'<a class="slide-link" href="../slides/#/{slide}" target="workshop-slides">Abrir slides do bloco {block} ↗</a>', body)
    return page('Guia da Glaucia · PT / EN', f'''<header class="topbar"><a href="../">Workshop</a><a href="../slides/" target="workshop-slides">Abrir apresentação ↗</a><span>17 nov 2026 · 90 min</span></header>
<div class="guide-layout"><nav class="index" aria-label="Índice do guia"><details open><summary>Índice do guia</summary>{md.toc}</details></nav>
<main id="content" class="guide"><p class="eyebrow">Speaker guide · PT / EN</p><p class="reading-note">Leia as falas em inglês. As instruções e traduções são para sua leitura. Prompts são para copiar, sem ler em voz alta.</p>{body}<p class="end">Fim do guia · <a href="#content">Voltar ao início</a></p></main></div><p role="status" aria-live="polite" class="copy-status"></p>''', '../')

def render_tutorial(text, lang, legacy_text=''):
    en = lang == 'en-US'
    prefix = '../../' if en else '../'
    # Navigation is supplied by the site, rather than links to source Markdown.
    text = re.sub(r'^\[.*?\]\(tutorial-.*?\).*$', '', text, flags=re.M)
    md = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'sane_lists'], extension_configs={'toc': {'toc_depth': '2-3'}})
    body = md.convert(text)
    body = re.sub(r'href="([^"]+)"', lambda m: 'href="'+source_url(m[1])+'"', body)
    # Stable shared step anchors survive translation and can be shared directly.
    for anchor, number in re.findall(r'<h3 id="([^"]+)">(?:Step|Passo) (\d+) ', body):
        md.toc = md.toc.replace(f'href="#{anchor}"', f'href="#step-{int(number):02}"')
    body = re.sub(r'(<h3 id="[^"]+">(?:Step|Passo) (\d+) )', lambda m: f'<span id="step-{int(m[2]):02}" class="step-anchor"></span>'+m[1], body)
    body = re.sub(r'<p><strong>(Fale em inglês:|Say in English:)</strong> (.*?)</p>', r'<p class="speech"><strong>\1</strong> <span lang="en-US">\2</span></p>', body, flags=re.S)
    body = body.replace('<p><strong>Tradução:</strong>', '<p class="translation" lang="pt-BR"><strong>Tradução:</strong>')
    def copy_block(match):
        command = 'language-sh' in match[0]
        kind = 'command' if command else 'prompt'
        label = ('Copy command' if command else 'Copy text') if en else ('Copiar comando' if command else 'Copiar texto')
        return f'<div class="prompt {"command" if command else ""}"><button type="button" class="copy-{kind}">{label}</button><pre><code lang="en-US">'
    body = re.sub(r'<pre><code(?: class="[^"]*")?>', copy_block, body).replace('</code></pre>', '</code></pre></div>')
    body = re.sub(r'<table>.*?</table>', lambda m: '<div class="table-scroll" tabindex="0" role="region" aria-label="'+('Workshop table' if en else 'Tabela do workshop')+'">'+m[0]+'</div>', body, flags=re.S)
    title = 'Presenter guide' if en else 'Guia da apresentadora'
    index = 'Guide contents' if en else 'Índice do guia'
    note = ('Instructions and spoken lines are in English. Read aloud “Say in English” or spoken lines in the optional Speaker Notes. Bracketed cues are for you. Copy blocks go to their stated destination.' if en else 'Instruções em português. Leia em voz alta apenas “Fale em inglês”. A tradução é só para sua leitura. Copie os blocos para o destino indicado.')
    pt_current = '' if en else ' aria-current="page"'
    en_current = ' aria-current="page"' if en else ''
    switch = f'<nav class="language-switch" aria-label="{"Guide language" if en else "Idioma do guia"}"><a href="{"../" if en else "./"}" lang="pt-BR" hreflang="pt-BR"{pt_current}>PT-BR</a><a href="{"./" if en else "en-us/"}" lang="en-US" hreflang="en-US"{en_current}>EN-US</a></nav>'
    legacy = ''
    if not en:
        old = markdown.markdown(legacy_text, extensions=['toc'])
        ids = re.findall(r'<h[1-6] id="([^"]+)"', old)
        legacy = ''.join(f'<p class="legacy-anchor" id="{anchor}">Esta seção está no <a href="run-sheet/#{anchor}">roteiro de apresentação e pronúncia</a>.</p>' for anchor in ids if f'id="{anchor}"' not in body)
        legacy += '<details class="extra-guide"><summary>Roteiro de apresentação e pronúncia</summary><p><a href="run-sheet/">Abrir roteiro por slide, falas e dicas de pronúncia ↗</a></p></details>'
    return page(title, f'''<header class="topbar"><a href="{prefix}">Workshop</a><a href="{prefix}slides/" target="workshop-slides">{'Open presentation' if en else 'Abrir apresentação'} ↗</a>{switch}</header><div class="guide-layout"><nav class="index" aria-label="{index}"><details open><summary>{index}</summary>{md.toc}</details></nav><main id="content" class="guide"><p class="eyebrow">{title} · {lang}</p><p class="reading-note">{note}</p>{legacy}{body}<p class="end"><a href="#content">{'Back to top' if en else 'Voltar ao início'}</a></p></main></div><p role="status" aria-live="polite" class="copy-status"></p>''', prefix, lang)


def build(root, output):
    root, output = pathlib.Path(root).resolve(), pathlib.Path(output).resolve()
    if output == root or root.is_relative_to(output):
        raise ValueError('Output cannot contain the source repository')
    if output.exists():
        raise ValueError('Use a new empty output path; existing outputs are not deleted')
    speaker = root/'docs/speaker'
    files = [p for p in (speaker/'slides').rglob('*') if p.is_file()]
    inputs = files + [speaker/'guia-glaucia.md', speaker/'tutorial-en.md', speaker/'tutorial-pt-br.md', speaker/'site/site.css', speaker/'site/site.js']
    for path in inputs:
        if not path.is_file() or not path.resolve().is_relative_to(root):
            raise ValueError(f'Source escapes repository or is missing: {path.name}')
        if path.is_symlink() or any(parent.is_symlink() for parent in path.parents if parent != root):
            raise ValueError('Symlinks cannot be published')
    actual = {path.relative_to(speaker/'slides').as_posix() for path in files}
    if actual != SLIDE_FILES:
        raise ValueError(f'Slide manifest mismatch. Unreviewed: {actual-SLIDE_FILES}; missing: {SLIDE_FILES-actual}')
    if (speaker/'slides/assets/shots/.gitkeep').read_bytes():
        raise ValueError('Screenshot placeholder must be empty')
    for path in files:
        if path.is_symlink() or any(parent.is_symlink() for parent in path.parents if parent != root):
            raise ValueError('Symlinks cannot be published')
    output.mkdir(parents=True)
    for path in files:
        target = output/'slides'/path.relative_to(speaker/'slides')
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
    publish_localized_slides(speaker, output)
    (output/'guide').mkdir()
    legacy_text = (speaker/'guia-glaucia.md').read_text(encoding='utf-8')
    (output/'guide/run-sheet').mkdir()
    legacy = render_guide(legacy_text).replace('../', '../../')
    legacy = legacy.replace('<main id="content" class="guide">', '<main id="content" class="guide"><p><a href="../">← Voltar ao tutorial PT-BR</a></p>')
    (output/'guide/run-sheet/index.html').write_text(legacy, encoding='utf-8')
    (output/'guide/index.html').write_text(render_tutorial((speaker/'tutorial-pt-br.md').read_text(encoding='utf-8'), 'pt-BR', legacy_text), encoding='utf-8')
    (output/'guide/en-us').mkdir()
    (output/'guide/en-us/index.html').write_text(render_tutorial((speaker/'tutorial-en.md').read_text(encoding='utf-8'), 'en-US'), encoding='utf-8')
    for name in ['site.css','site.js']:
        shutil.copyfile(speaker/'site'/name,output/name)
    (output/'.nojekyll').touch()
    (output/'index.html').write_text(page('Build Your First Engineering Bot', '''<main id="content" class="home"><p class="eyebrow">Packt live workshop · 90 min</p><h1>Build Your First<br><span>Engineering Bot</span><br>with Grok Bot</h1><p class="byline">Glaucia Lemos · 17 Nov 2026<br>11:00–12:30 Brasília · 9:00–10:30 ET</p><div class="choices"><a class="primary" href="slides/" lang="en">Open presentation ↗</a><a href="guide/">Guia da apresentadora · PT-BR / EN-US ↗</a></div><div class="team" aria-label="Workshop bot team"><img src="slides/assets/avatars/fde-typescript.svg" alt="FDE TypeScript, green triangle"><img src="slides/assets/avatars/qa-bot.svg" alt="QA bot, pink teardrop"><img src="slides/assets/avatars/devops.svg" alt="DevOps, purple circle"><img src="slides/assets/avatars/engineering-lead.svg" alt="Engineering Lead, red rounded square"></div><p class="hint">Apresentação: <kbd>F</kbd> tela cheia · <kbd>S</kbd> notas da apresentadora.<br>Compartilhe só a janela do deck. O guia e as notas publicados são públicos.</p></main>'''), encoding='utf-8')
    print(f'Built speaker site: {len(files)} deck files + guide + landing (explicit allowlist)')

if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=pathlib.Path,default=ROOT/'_site')
    args=parser.parse_args()
    build(ROOT,args.output)


