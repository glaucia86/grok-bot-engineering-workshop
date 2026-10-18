# Uploaded mascot sources

These six SVG files were supplied by the workshop owner on 2026-10-18 and are
retained byte-for-byte. They are not described as extracted official assets. The owner subsequently
identified Bloub as the animation reference; see the attribution below.

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

## Contextual motion

The owner shared [Bloub](https://github.com/jeremy-prt/bloub) on 2026-10-18.
Its README documents 14 states and 16 expressions, beyond the idle eye motion
embedded in the uploaded SVGs. We adapt `thinking` as one three-dot pulse on the
FDE avatar in slide 8 and QA avatar in slide 13, and `wink` as one short eye gesture
by Grok on slide 22. This keeps the supplied silhouettes and colors intact rather
than replacing the avatars with Bloub's body morphs. The example chats remain
explicitly labeled simulations; these decorations report no actual task status.

Cues run once on slide entry (under 3 seconds), share the gaze RAF, and stop when
finished. Overview, pause, print, hidden tab, reduced motion and touch suppress
cues. Resuming these modes does not replay a cancelled cue. Normal SVG eye motion
resumes afterward; static exports and original uploads are unchanged. Gaze now
uses time-based smoothing with a smaller body movement.

Bloub: Copyright (c) 2026 Jérémy Perret, MIT. The distributed speaker site includes
[full MIT license](../slides/vendor/bloub/LICENSE) and
[adaptation notice](../slides/vendor/bloub/NOTICE.md). As Bloub's README explains,
its license covers code, not the x.ai-inspired design; neither project claims
these as official x.ai assets or affiliation.
