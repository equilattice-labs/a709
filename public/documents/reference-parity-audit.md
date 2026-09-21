# Reference workflow parity audit

Presentation names updated for Temvorel. The observations below were executed before the interface redesign; their original record is preserved in `history/pre-rebrand-2026-09-17/reference-parity-audit.md`. They describe protocol mechanics, not new browser validation.

Checked live on 17 September 2026 against [Unlockle](https://unlocklexyz.vercel.app/), its public `/create`, `/locks`, and `/lock/0` application bundles, and the full-match source-verified [ArcLock deployment](https://explorer.testnet.chain.robinhood.com/address/0x3234677de41a6b05b72f20abbf6877d3f1ec1eaf?tab=contract) on Robinhood Chain Testnet 46630. This report documents observable mechanics. It does not reproduce the reference implementation.

## Authoritative sources

- Explorer source/ABI: `https://explorer.testnet.chain.robinhood.com/api/v2/smart-contracts/0x3234677de41a6b05b72f20abbf6877d3f1ec1eaf`. Observed `is_verified: true`, `is_fully_verified: true`, contract `ArcLock`, compiler Solidity 0.8.28.
- Public create bundle: `https://unlocklexyz.vercel.app/_next/static/chunks/3019ba7a2cc35b54.js`.
- Public dashboard bundle: `https://unlocklexyz.vercel.app/_next/static/chunks/490555be47b1a823.js`.
- Public detail bundle: `https://unlocklexyz.vercel.app/_next/static/chunks/223602fe496b11e7.js`.

Contract behavior takes precedence over conflicting homepage text. The source is a fixed deployment with no proxy. No transaction was submitted to the reference project during this audit.

## Four creation modes

Every mode uses a selected ERC-20, wallet connection, token allowance and a transaction to the same escrow primitive. Reference creation sends a native-asset creation fee read from `feeFor`; its authorization path approves an unlimited token allowance if the existing allowance is insufficient. Temvorel uses exact allowances instead.

| Mode | Actual visible inputs | Mapping to the reference contract | Temvorel V2 equivalent |
| --- | --- | --- | --- |
| Vesting | Recipient, total amount, baseline start Now/Custom UTC, optional cliff delay and unit, explicit cliff token amount, unlock duration and unit, cadence, cancelable switch | Contract start = baseline start + cliff delay; end = contract start + unlock duration; cliffAmount is released at contract start; remaining tokens vest from there | Store baseline `start`, separate `cliff`, explicit `cliffAmount`, absolute `end`, and `interval`; economics match when `cliff = reference contract start` |
| Whole-date lock | Recipient, amount, unlock UTC timestamp, cancelable switch | start = end = unlock timestamp, period 0, cliffAmount 0; all tokens unlock at that timestamp | kind 1; start = cliff = end, interval 0, cliffAmount 0 |
| Stream | Recipient, amount, baseline start Now/Custom UTC, duration and unit, cancelable switch | No cliff delay/allocation; start = baseline; end = start + duration; period 1 | kind 2; cliff = start, cliffAmount 0, interval 1 |
| Vested airdrop | Multiline whitespace-separated `address amount` entries, shared baseline/cliff delay/cliff amount/duration/cadence/cancelable | One atomic batch; shared token and schedule; each entry has its own amount, but the same absolute cliffAmount is passed to every recipient | kind 3; shared dates/cadence with amounts and cliffAmounts arrays; shared default plus optional per-row cliff allocation is compatible and more expressive |

The reference default is vesting, start Now, cliff enabled with 12 months delay, 24 months unlock duration, monthly cadence, and cancelable enabled. These are convenience defaults, not separate contract requirements. The URL `/create?mode=vesting|lock|stream|airdrop` selects the relevant mode. Temvorel retains these mode links while choosing more practical demonstration defaults.

The reference accepts explicit past dates and has no onchain requirement that creation precede start. The only duration restriction is `end >= start`, duration at most 100 years, and a positive period for schedules spanning time. It does not require period <= duration. A larger period means only the cliff allocation is available until the final timestamp. Whole locks can use an already elapsed unlock timestamp and become immediately claimable. V2 supports these mechanics; `start=0` and `cliff=0` additionally provide mined-timestamp sentinels so “Now” does not depend on a stale client clock.

## Release calculation and cancellation

For original amount A, cliff allocation C, effective release start S, end E and cadence P:

- Before S: vested amount is 0.
- At S: C is unlocked.
- Between S and E: vested amount is `C + floor((A-C) * (floor((t-S)/P)*P) / (E-S))`.
- At or after E: the full A is unlocked, including final rounding remainder.
- A whole-date lock releases A at its timestamp without a division.
- Withdrawable amount is vested amount minus already withdrawn amount. Only the current recipient may withdraw.

In the reference, S is called `start`; in V2, S is the stored `cliff`. The earlier V1 accrued from its baseline start and merely gated claims until a cliff. That was not equivalent: an allocation of 200 tokens at the cliff of a 1,000-token schedule cannot be expressed with an arbitrary cliff gate alone. V2 adds the explicit allocation and starts remainder vesting at the cliff.

**Reference cancellation is ongoing settlement, not pre-start-only cancellation.** The sender may cancel once whenever the stored cancelable flag is true. It snapshots vested amount V at execution, refunds A-V immediately and leaves V-withdrawn available to the recipient forever. Before the cliff this refunds all tokens. At the cliff it retains the cliff allocation. After the end it refunds zero. Cancellation after an earlier partial withdrawal is supported. V1's pre-start-only rule was a functional gap; V2 closes it.

The reference overwrites its stored amount with V when canceled. V2 deliberately preserves original `amount` and records `vestedAtCancel`, `refunded` and `cancelledAt`, retaining a clearer accounting history without changing settlement economics.

## Recipient transfer and reads

The reference permits the current recipient to transfer the whole entitlement to a nonzero address, including after cancellation or after completion. It does not update sender/recipient indexes during transfer. Its Received dashboard then filters out entries whose current recipient no longer matches the selected wallet. Consequently a transferred entry disappears from the old recipient but does not appear automatically in the new recipient's creation-time index. This is a reference defect, not a feature to reproduce.

V2 updates the current-recipient index on transfer and permits transfer while any entitlement remains unclaimed, including the retained entitlement of a canceled schedule. No-op transfer of a completely exhausted entitlement is rejected. Sender indexes remain historical.

The reference dashboard offers only **Received** and **Sent** tabs; it has no status, token, text search, or mode filter. It queries the first 200 IDs, deduplicates/sorts newest first, refreshes reads every 20 seconds, and computes display progress locally. Rows show ID, type, token amount, counterparty, progress and canceled status. Temvorel's pagination and precise CSV export are additions, not missing parity.

Every reference dashboard row and creation success ID links to **`/lock/{id}`**, a public detail page that can be read without connecting a wallet. It includes type, creator/recipient, token, amount, start/end, cliff amount, cadence, cancelability, unlocked/withdrawn/remaining value, current withdrawable amount, explorer links and action panels. Claim/transfer appear for the current recipient; cancel appears for the creator when enabled and not already canceled. Public detail links were missing in V1 and must be included in the V2 application.

## Contradictions and defects not to carry forward

| Reference statement or implementation | Actual finding | Temvorel decision |
| --- | --- | --- |
| Homepage pre-start cancellation text versus ongoing-settlement FAQ | Verified source and detail page both implement ongoing settlement | Follow actual settlement behavior and use consistent wording throughout |
| Homepage says the owner only pauses new activity | Source applies `whenNotPaused` to creation, claims, cancellation and recipient transfer | V2 has no administrator or pause, keeping recipient access independent |
| Source comments describe native USDC fees | Robinhood testnet gas/native asset is ETH; UI labels ETH | Use ETH for gas, tUSD only as the valueless demonstration ERC-20 |
| Source claim comment mentions sponsored relaying | Function requires `msg.sender == recipient`; no trusted-forwarder path | Do not promise relayed claims |
| Incoming balance check says it rejects rebasing tokens | It only verifies the current incoming delta and cannot predict future rebases | Explain fixed-balance-token support and issuer/rebase risks accurately |
| Transfer changes recipient but leaves indexes unchanged | New recipient dashboard can miss transferred rights | Maintain current recipient indexes |
| Batch validates shared cliff amount against batch total | A smaller individual allocation can still revert in the contract | Validate cliffAmount <= amount per row before approval |
| Unlimited approval | Not needed for an exact deposit | Keep exact approval and reset-first compatibility |

## Completion checklist

V2 contract changes: explicit cliff allocation; cadence from cliff; ongoing cancellation settlement; claims and rotation after cancellation; start-now support; past-date compatibility; long-cadence support; retained original principal and refund history. These are implemented in `TokenSchedulesV2.sol` and covered by the V2 suite.

Application changes: show/edit cliff allocation for vesting/batches, preview the exact formula and allocation, allow immediate starts, remove V1-only future-start/cadence-length restrictions, show canceled vested entitlement and refunds, keep post-cancel claims available, update cancellation confirmations, add public `/lock/:id` pages and links, and replace V1-only narrative everywhere. V2 is a separate deployment; the original V1 code, ABI/configuration, receipts and documentation remain in `contracts/legacy-v1/`.
