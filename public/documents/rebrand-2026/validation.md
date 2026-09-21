# Temvorel redesign validation

Validated on 17 September 2026 using Chromium against the local Vite development server (`5189`) and production preview (`5190`). No registration, public deployment, signing or live transaction was performed.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Production build | Passed, 1,747 modules; route chunks generated | `npm --prefix website run build` |
| Exact schedule-preview cases | 5/5 passed | `node --test website/scripts/schedule-preview.test.mjs` |
| V2 contract cases | 16/16 passed | `output/rebrand/contract-tests.txt` |
| Core browser flows | 28/28 passed | `output/rebrand/core-flows.json` |
| Final Temvorel identity | 7/7 passed; final CSV prefix, titles and review | `output/rebrand/final-identity-ui.json` |
| Responsive route checks | 30/30 without horizontal overflow | `output/rebrand/responsive.json` |
| Automated accessibility | Zero WCAG A/AA violations on six routes | `output/rebrand/axe-results.json` |
| Download endpoints | Brand SVG/JPG, font, PDF, ZIP and identity document returned HTTP 200 with correct content types | `output/rebrand/downloads.json` |
| Materials | 17-page PDF, 12 tables and 40 monetary values preserved; no blank pages; current assets mirror correctly | `docs/materials-validation.json` |

Routes checked: `/`, `/create`, `/locks`, `/lock/1`, `/docs`, `/legal`. Viewports: 360×800, 390×844, 768×1024, 1440×1000 and 1920×1080. Final desktop/mobile screenshots are `output/rebrand/{home,create,locks,lock-1,docs,legal}-{1440,390}.png`. Before screenshots are explicitly prefixed `before-`.

## Interactions and error recovery

Creation covers all four modes, invalid recipient focus, duplicate-recipient rejection, batch allocation expansion, exact totals, start/end timeline presets and return-to-edit without losing inputs. Workspace coverage includes public-ID validation and lookup, mock-wallet read-only live schedules, empty search recovery, canceled filtering, branded CSV, exact settlement details, role-based action states, and staged cancellation/transfer confirmation return paths. The mock provider blocks signing/transaction methods; no transaction success is inferred from these checks.

The homepage tabs support arrow/Home/End keys. Its range slider updates unlocked example value and the selected mode leads to the matching creation route. Mobile navigation opens, closes after navigation and responds to Escape. The native wallet dialog closes with Escape; connection rejection and wrong-network recovery were exercised with the mock provider. Reduced motion changes scrolling to `auto` and disables decorative transitions.

## Accessibility and performance boundaries

Contrast findings in selected modes and workflow labels were fixed. Generic labeled containers were given group roles, and the lookup error description only references a rendered error. Axe cannot resolve the background of the illustrative studio because of its layered backing sheet; those text colors were separately checked against their actual solid surfaces in `manual-contrast.json`. Automated checks do not replace a full screen-reader/user study.

The production home loads a 403.17 kB JavaScript entry (148.80 kB gzip), 35.15 kB stylesheet (7.82 kB gzip), and a 164.7 kB self-hosted font. It no longer requires a large hero raster or third-party font request. One local observation recorded DOM content loaded at 197 ms and LCP at 232 ms; this is local diagnostic data, not a deployment or before/after benchmark. Details: `output/rebrand/performance.json`. Public RPC timing remains an external dependency; live data has unavailable/retry feedback.

## Compatibility and test correction

No deployed Solidity logic, addresses, ABI or rights were changed. One pre-existing contract test initially failed because Ganache advanced the transaction timestamp by two seconds of wall-clock time. The test fixture now uses `miner.timestampIncrement: 0` and advances time explicitly; the exact assertion remains intact and the full suite passes. Ganache reports a native µWS compatibility warning and falls back to its JavaScript implementation on this Node version.

Intermediate working-identity observations in `core-flows.json` remain genuine historical observations. That candidate was rejected for a name collision; final Temvorel checks, generated assets, screenshots and production routes were rerun independently.

This is still an unaudited testnet release. No hosted-wallet integration run, new live funding/claim smoke, domain acquisition, account registration or public launch is claimed. Historical deployment receipts establish prior chain behavior; the rebrand preserves them without relabeling their dates.
