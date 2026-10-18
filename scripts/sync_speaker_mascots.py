#!/usr/bin/env python3
"""Export the user-supplied animated SVGs into offline deck assets.
Original uploads remain unchanged in docs/speaker/mascot-sources. No app artwork
is regenerated. Static fallbacks retain the first eye matrices; templates retain
native keyframes, namespaced again per rendered instance by mascots.js.
"""
import argparse
from pathlib import Path
import re
import xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
DECK = ROOT/'docs/speaker/slides'
SOURCE = ROOT/'docs/speaker/mascot-sources'
NAMES = {'grok':'grok', 'fde':'fde-typescript', 'qa':'qa-bot', 'devops':'devops', 'lead':'engineering-lead'}
SOURCES = {'grok':('bloub-cercle-neutre-encre-anime.svg','circle'), 'fde':('bloub-triangle-surpris-vert-anime.svg','triangle'), 'qa':('qa-bot.svg','drop'), 'devops':('bloub-cercle-attentif-violet-anime.svg','circle'), 'lead':('bloub-squircle-surpris-rouge-anime.svg','rounded-square')}
START, END = '<!-- workshop-mascot templates:start -->', '<!-- workshop-mascot templates:end -->'
NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('',NS)
def tag(name): return '{'+NS+'}'+name

def exported(ident):
    filename, shape = SOURCES[ident]
    source = (SOURCE/filename).read_text()
    if re.search(r'<(?:script|foreignObject)|\bon\w+\s*=|(?:https?:)?//(?!www.w3.org/2000/svg)|@import|(?:href|src)=', source, re.I):
        raise ValueError('Unexpected active or external SVG content')
    svg = ET.fromstring(source)
    style = svg.find(tag('style'))
    css = style.text
    svg.remove(style)
    svg.attrib = {'viewBox': '-125 -125 250 250', 'focusable':'false', 'data-mascot':ident, 'data-shape':shape, 'data-motion':'static'}
    mask = svg.find('.//'+tag('mask'))
    old_id = mask.get('id'); new_id = f'mascot-{ident}-mask'
    mask.set('id',new_id)
    face = ET.Element(tag('g'), {'class':'mascot-face'})
    for eye in list(mask):
        cls = eye.get('class')
        if cls not in ('oeil0','oeil1'): continue
        matrix = re.search(r'@keyframes '+cls+r'\{0%\{transform:(matrix\([^)]*\))',css).group(1)
        eye.set('transform',matrix)
        eye.set('style','--mascot-eye-initial:'+matrix)
        eye.set('class',f'mascot-eye mascot-{ident}-{cls}')
        mask.remove(eye); face.append(eye)
    mask.append(face)
    for elem in svg.iter():
        if elem.get('mask') == f'url(#{old_id})': elem.set('mask',f'url(#{new_id})')
    art = next(g for g in svg.findall(tag('g')) if g.get('opacity')=='1')
    body = art.find(tag('path')); body.set('class','mascot-body')
    if ident == 'grok':
        body.set('stroke','#647078'); body.set('stroke-width','1.5')
    motion = ET.Element(tag('g'), {'class':'mascot-motion'})
    # Keep definitions and artwork in the same coordinate system during gaze.
    for child in list(svg): svg.remove(child); motion.append(child)
    svg.append(motion)
    static = ET.tostring(svg,encoding='unicode')+'\n'
    for cls in ('oeil0','oeil1'):
        css = css.replace(cls,f'mascot-{ident}-{cls}')
    style = ET.SubElement(svg,tag('style')); style.text=css
    return static, ET.tostring(svg,encoding='unicode')

def generated():
    files, templates = {}, []
    for ident, name in NAMES.items():
        static, animated = exported(ident)
        files[DECK/f'assets/avatars/{name}.svg'] = static
        templates.append(f'<template id="mascot-{name}">{animated}</template>')
    html = (DECK/'index.html').read_text()
    block = START+'\n'+'\n'.join(templates)+'\n'+END
    html = re.sub(re.escape(START)+r'.*?'+re.escape(END), lambda _:block,html, flags=re.S)
    files[DECK/'index.html'] = html
    return files

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    for path, content in generated().items():
        if args.check:
            if not path.exists() or path.read_text() != content:
                raise SystemExit(f'Stale mascot export: {path.relative_to(ROOT)}')
        else: path.write_text(content)
