#!/usr/bin/env python3
"""Reuse the app's authored mascot geometry as offline SVGs and inline templates.
Run after editing workshop-mascot.tsx. --check detects stale generated artwork.
"""
import argparse
import json
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
DECK = ROOT/'docs/speaker/slides'
NAMES = {'grok':'grok', 'fde':'fde-typescript', 'qa':'qa-bot', 'devops':'devops', 'lead':'engineering-lead'}
START, END = '<!-- workshop-mascot templates:start -->', '<!-- workshop-mascot templates:end -->'

def generated():
    source = (ROOT/'mvp/src/components/workshop-mascot.tsx').read_text()
    characters = re.findall(r'id: "(.*?)", color: "(.*?)", shape: "(.*?)", eyes: (\[\[.*?\]\]), path: "(.*?)"', source)
    if [c[0] for c in characters] != list(NAMES):
        raise ValueError('App mascot format changed; review the exporter before regenerating')
    files, templates = {}, []
    for ident, color, shape, eyes, path in characters:
        angle, ink = (-22,'#fff') if ident == 'grok' else (-12,'#101516')
        eye_svg = ''.join(f'<g transform="rotate({angle} {x} {y})"><ellipse class="mascot-eye" cx="{x}" cy="{y}" rx="5" ry="10"/></g>' for x,y in json.loads(eyes))
        art = f'<path class="mascot-body" d="{path}" fill="{color}"/><g class="mascot-face" fill="{ink}">{eye_svg}</g>'
        files[DECK/f'assets/avatars/{NAMES[ident]}.svg'] = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">{art}</svg>\n'
        templates.append(f'<template id="mascot-{NAMES[ident]}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" focusable="false" data-mascot="{ident}" data-shape="{shape}"><g class="mascot-motion">{art}</g></svg></template>')
    html = (DECK/'index.html').read_text()
    block = START+'\n'+'\n'.join(templates)+'\n'+END
    if START in html:
        html = re.sub(re.escape(START)+r'.*?'+re.escape(END), lambda _:block,html, flags=re.S)
    else:
        html = html.replace('<script src="vendor/reveal.js', block+'\n\n<script src="vendor/reveal.js',1)
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
        else:
            path.write_text(content)
