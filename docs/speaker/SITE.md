# Speaker site: slides and bilingual talk track

The static site reuses the Reveal.js deck and generates the reading guide from
`guia-glaucia.md`. Do not maintain a second copy of the talk track. The guide has
the run sheet, English speech, Portuguese translation/instructions, all seven
copyable prompts, and links to all 20 slides. Six rehearsal screenshot slots
remain placeholders; illustrative chat results remain labeled mocks.

## Preview and checks

Use Python 3.12 and an isolated virtual environment:

```sh
python -m venv .venv-speaker
.venv-speaker/bin/python -m pip install --require-hashes -r scripts/speaker-site-requirements.txt
.venv-speaker/bin/python -m unittest discover -s tests -p test_speaker_site.py
.venv-speaker/bin/python scripts/build_speaker_site.py --output _site
python -m http.server 8765 --directory _site
```

On Windows use `.venv-speaker\\Scripts\\python.exe` instead of the Unix path.
Use a new output directory for subsequent builds; the builder does not delete
an existing directory. Open the served root, `guide/`, and `slides/`.
For a project-path rehearsal, serve a parent directory containing the build at
`grok-bot-engineering-workshop/` and test that prefix too.

The built output has no CDN, font download, package-manager or runtime API
requirement. Keep the complete generated folder to use it locally/offline;
opening the hosted URL without connectivity is not promised. Local HTTP is
recommended for the Reveal speaker window. Press F for fullscreen, S for
speaker view, arrows for navigation. Browser pop-up/fullscreen restrictions
may require the user's action. Keep the guide/notes screen out of screen sharing.

## Browser verification

CI runs `scripts/check_speaker_browser.py` with pinned Playwright 1.55.0 and its
Chromium build. It serves the site under the GitHub project prefix and checks
all slide hashes, 20 real slide renders, guide widths 390/768, clipboard success
and simulated-rejection selection fallback, F fullscreen, S speaker connection
with real notes, and loaded-deck navigation with the network disabled. External
resource requests and JavaScript/HTTP errors fail the check. This is not a promise
that a hosted URL can reload offline without a local copy.

The `speaker-browser-evidence` Actions artifact retains actual screenshots and a
JSON result for seven days. These are UI verification, never workshop rehearsal
or application acceptance evidence. A human should inspect them after layout
changes and rehearse on the actual presentation device.

## Publication boundary

The source repository remains private. The published slides, embedded Reveal
notes, and full speaker guide are public, as authorized by Glaucia. Publishing
does not grant access to repository source links: those still require GitHub
repository access. Never change repository visibility to solve a Pages plan limit.

`scripts/build_speaker_site.py` copies only its fixed slide-file manifest, the
rendered canonical guide, and the two site UI assets. Application files,
repository metadata, environment files, source specs, and arbitrary new assets
are excluded. A new slide asset causes a closed build failure until reviewed and
added to the manifest. Real rehearsal screenshots need a separate privacy review
before that manifest is expanded; no screenshots are fabricated.

`.github/workflows/speaker-pages.yml` runs build/tests on pull requests. Deploys
run only from main, after the human merge, or a manual dispatch on main. There is
no pull_request_target, PAT, Vercel bypass, database access, or secret input. The
workflow uses SHA-pinned official actions, hash-pinned Markdown, read-only checkout
without persisted credentials, and scoped deployment permissions.

Repository Settings → Pages must use **GitHub Actions**. That source was saved
on 15 October 2026; this is not deployment success. The `github-pages` environment
and its applicable protection rules are honored. Keep private-repository Actions
usage within the owner's quota; no paid plan upgrade is authorized here.

## Human release checklist

- Merge dependency PR #22 first, then retarget/review the speaker-site PR against main.
- Confirm the actual merged acceptance baseline (#9/#10) and current preparation
  evidence before rehearsal; the canonical guide contains dated preparation status.
- Confirm no sensitive information is in guide, notes, source links, or screenshots.
- Inspect the latest real browser artifact and rehearse S/F, copy, and offline
  operation on the actual presentation device. CI covers the generated site,
  not the live workshop flow or genuine rehearsal screenshots.
- Glaucia merges. Verify the exact deployed commit and successful Pages workflow
  before treating the site URL as live. Never report a successful rehearsal or UI
  acceptance from static tests alone.
