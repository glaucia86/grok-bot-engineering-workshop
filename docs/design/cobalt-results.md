# Cobalt results workspace

## Direction and scope

Glaucia explicitly requested a different application palette and a substantially
better results dashboard. This iteration starts at `f9308d0`: cobalto `#244be8`,
ink `#182239`, pale neutral `#f4f6fb`, white, and amber `#d89216`. Manrope is
self-hosted from the official Google Fonts distribution under the included OFL.
The three routes retain their purpose. Five mascot colors and all their vector
geometry, cursor movement, blink timing and static preferences are unchanged.

The dashboard is a reading workspace: actual response/talk totals and the most
reviewed talk; fixed-scale comparisons; a selected talk with rating histogram,
4/5 share and dated comments; exact tabular values. Comparison labels select the
talk too. Desktop has comparison and detail columns. Mobile puts the explorer
first; its DOM/focus order also precedes comparison controls. Long comparisons
scroll only beyond six talks, with an explicit hint and a focusable scroll area.
No trends, overall averages derived from already-rounded means, or sample data
are placed in the product. Missing details preserve the comparison and have an
independent retry. Selection/revision changes abort outdated detail requests.

## Data contract

Existing `POST /api/feedback` and aggregate `GET /api/feedback` are unchanged.
The additive read-only `GET /api/feedback/insights?talkId=...` returns:

- `talkId`, `count`, one-decimal `average`;
- `distribution`: five integer counts, indexed by ratings 1 through 5;
- `comments`: nonblank `{text, date}` records, newest first, dates in UTC.

A missing/blank talk query returns 400 before database access; an unknown talk
returns 404. Names are compared case-insensitively, as in the existing summary.
The projection selects no author or record ID. Comment text is rendered as plain
React text, with no HTML injection. The form tells attendees that written
comments appear in results while names are not shown. Free text itself is not
redacted. No schema/migration, credentials, protection, database provider or
creation behavior changed. Like the existing workshop aggregation, this small
read model selects rows and groups in application memory; it has no pagination.

## Loop and validation

Applied local frontend-design, ui-ux-pro-max and Impeccable guidance, plus TDD.
The explicit user direction settled palette and scope. The first design review
identified a clipped fifth comparison and a buried mobile explorer; the next
iteration corrected both and aligned keyboard order with the mobile hierarchy.
TDD observed failures for missing details, counts/projection, independent retry,
superseded requests, selection, useful totals and logical focus order before
implementation. The local suite includes real on-disk PGlite reads through the
new handler. Browser fixtures derive summaries and details from the same 41
synthetic ratings; the post-save scenario adds one rating and comment, then
checks 42 responses and seven five-star ratings after navigation/reload.

The Impeccable mechanical scan flagged a historical thick stale-state border,
even though a thinner runtime override existed; the source declaration was
corrected. That source scan is not an accessibility or visual certification.
Actual Windows Chromium captures and independent read-only review establish
visual checks; they do not certify remote data or performance.

## Open PR review observations

The CI observation was applicable: the old checkout override tested head only.
PR validation now runs independent head and synthetic-merge jobs with distinct
artifact names; push/manual runs retain one job. Permissions stay read-only.

The old integration-36 manifest had a globals.css digest/import-order mismatch.
Its original fields are retained with an explicit historical provenance warning.
Fresh captures use the committed final source, compare working content against
Git, and record SHA-256 over UTF-8 text normalized to LF. The capture helper
requires the owned server's startup marker/liveness and a dynamic port. Its
existing regression tests cover foreign occupied ports. Open review threads
alone are not proof that those already-fixed capture issues remain in the code.

`evidence/cobalt-results/manifest.json` identifies the captured source commit,
fixture, Windows/browser, owned origin, source/font hashes and nine three-route
captures at 390/768/1440 px. Additional browser evidence covers 320px, empty,
loading, errors, detail retry and the corrected complete comparison. These are
local fixtures, never remote Neon acceptance. Publication uses PR #42's isolated
QA branch only, followed by exact-head and merge CI. No merge, production action,
remote POST, shared Neon test or new persistent permission is part of this work.
