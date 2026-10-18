# Uploaded mascot sources

These six SVG files were supplied by the workshop owner on 2026-10-18 and are
retained byte-for-byte. No authorship, license or external brand provenance was
provided; they are not described as extracted official assets.

Approved role mapping follows color and uses the uploaded shapes:

- `bloub-cercle-neutre-encre-anime.svg`: Grok Bot, black circle
- `bloub-triangle-surpris-vert-anime.svg`: FDE TypeScript, green triangle
- `qa-bot.svg`: QA bot, pink drop
- `bloub-cercle-attentif-violet-anime.svg`: DevOps, purple circle
- `bloub-squircle-surpris-rouge-anime.svg`: Engineering Lead, red rounded square
- `bloub-cercle-neutre-ambre-anime.svg`: reserved extra; not part of the deck team

Run `python scripts/sync_speaker_mascots.py` after an approved source change.
`--check` verifies the exports. The deck exporter preserves paths, colors and
native eye keyframes, namespacing mask IDs/classes/keyframes. Each rendered
instance receives another unique namespace. The standalone image exports are
static first-frame fallbacks, so they also work without JavaScript. Only the
active slide animates with a fine pointer and no reduced-motion preference;
separate wrappers add bounded mouse gaze without replacing native eye matrices.
The black silhouette retains a thin visibility outline for the dark deck.

These source files are not in the public speaker site's explicit asset allowlist.
