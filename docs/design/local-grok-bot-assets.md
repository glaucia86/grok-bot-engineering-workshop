# Installed Grok Bot: where the mascots live

The user-authorized installation is Grok Bot 0.71.2 at `C:\Users\glauc\AppData\Local\Programs\Grok Bot`. Executable metadata says SpaceXAI; Windows reported a valid Anysphere, Inc. signature. This does not certify every packaged resource.

## Location and mechanism

The relevant renderer is packaged inside `resources/app.asar`, not a folder of one PNG per named bot. A plaintext ASAR-header inventory found 667 members. Its 15 PNG/JPEG-like members are named app/service icons, wallpaper and CTA graphics; that filename inventory alone is not proof about all runtime assets.

The inspected visual code establishes these paths:

| ASAR member | Role observed in static code |
| --- | --- |
| `dist/renderer/assets/index.eager-platform-DKZJbDqM.js` | Procedural body/eye geometry, SVG tree creation, expressions, blink state, gaze and animated React wrapper |
| `dist/renderer/assets/index.eager-app-CrGjYQbA.js` | Resolves avatar shape/color and generates cached static SVG data URLs |
| `dist/renderer/assets/index-CUXtfEUp.js` | Resolves bot avatar configuration, including supplied image data/URL versus generated shape/color |
| `dist/renderer/assets/chunk-agent-avatar-editor-CCIIBRSX.js` | Avatar editor and shape/color selection/import references |

In the 676,970-byte platform member, the minified binding `KN` (UTF-8 byte offset 500362) accepts `isFollowingPointer`, default false. When enabled, a passive pointer listener normalizes coordinates relative to the avatar's bounds and sends them to the gaze controller. A requestAnimationFrame loop advances the model and updates an SVG tree. It handles document visibility, offscreen intersection and cleanup. This proves an available capability, not that every avatar instance enables it.

The same member has model/frame generation (`ih`, offset 349032), an expression/blink controller (`ax`, 341105), SVG namespace element construction (`Xh`, 499563), and static SVG data-URL generation (`ZN`, 504994). Body aliases include blob/sphere and other shape families. These are code-generated vector characters, with separate eye/expression state, rather than screenshot crops or a single downloaded GIF. The generated SVG and property names are observed statically; no source paths, geometric data or implementation were copied into the workshop.

## Created/customized mascots

The application supports shape, color and per-bot identity settings, plus avatar image data/URLs. The role labels FDE, QA, DevOps and their selected configuration are account/bot data, not identified assignments in this static installation. Their exact current values and any uploaded avatar bytes remain unknown. No account profile, database, cookies, tokens, conversations or authentication files were opened to resolve them. No license permitting redistribution of these application bundles/artwork was established; the Electron license does not establish rights to application mascots.

## REA evidence and integrity limit

REA6.5.0 was explicitly used with `analyze-javascript-application` on the installed ASAR, selecting the avatar-editor and platform members in separate read-only analyses. Default integrity policy stopped on native companion hash mismatches. The documented record-and-continue mode retained these contradictions as untrusted evidence; no executable, native addon, application bootstrap or app JavaScript was run. Selected visual member SHA-256 values separately matched their declared ASAR-member hashes.

Editor analysis: `ev_580893755ea300bde85e7536122091182dad00273e8b83c581fe0caf8884d22c`. Platform analysis: `ev_27d716867941188e97a7f4dcde06f58b6ec0737fa90b5c3b51f20bab8b8415a1`. Analysis used exact `--source-path` selections and bounded semantic graphs; unselected-source relationships remain unknown. The broader archive integrity is not certified. A provenance-only manifest is in `evidence/native-mascot/local-app-inspection.json`; proprietary sources remain outside the repository.

This is static evidence from the installed application, not runtime observation and not proof that x.ai/bot uses the same engine. The application was not launched or injected, and no debugging port/security setting was enabled on it. The workshop implementation remains independently authored SVG geometry with pointer/gaze/blink behavior and reduced-motion handling. No private data is needed for that equivalent.

The native workshop candidate 8321ca4 was authored and verified before this installed-app investigation. The subsequent change documents provenance and mechanisms only; it does not transplant the application engine.
