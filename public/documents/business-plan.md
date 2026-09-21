# Temvorel — business and execution plan

**Value, on your terms.**  
English-language launch plan · 17 September 2026 · Planning currency: USD

Temvorel is a token release workspace for teams: fund a schedule once, make its terms visible, and let recipients claim according to the contract. Its first implementation targets **Robinhood Chain Testnet, chain ID 46630**, with token vesting, a whole-date lock, a finite payment stream and batch vested distributions. The ambition is to become an operating layer for recurring token allocations across teams, grants and communities—not a token-price speculation business.

This document separates the current testnet product from commercial hypotheses. **There are no asserted customers, revenue, external audits, partnerships, investor commitments or acquired domain/social accounts.** Financial figures are scenario assumptions to be tested, not forecasts of returns. Live research and dated sources are in [research.md](research.md).

## 1. The problem, customer and promise

Token distribution teams frequently coordinate a spreadsheet of allocations, wallet addresses, cliff dates, funding approvals and recipient questions. A transfer spreadsheet does not enforce a future promise. A deployed vesting contract does not by itself explain the promise well, make operational reviews easy, or produce a useful recipient experience.

The initial customer is an English-speaking founder, finance operator or grant manager at a small onchain organization that needs **10–500 recipient allocations per campaign**, repeats allocation work at least quarterly, and already controls its own ERC-20 treasury and EVM wallet. The paying buyer is the organization; the recipient is the main product user during the life of a schedule. A wallet connection is an account connection, not proof of employment, identity or legal entitlement.

Prioritize three segments in order:

| Segment | Job to be done | First measurable outcome | Purchase trigger |
| --- | --- | --- | --- |
| Robinhood Chain builders and early token teams | Give contributors a clear allocation and a repeatable release schedule. | Complete a correct test creation and claim without developer intervention. | Repeated campaigns consume more than four operator hours per month. |
| Ecosystem grant administrators | Fund fixed-duration grants and make recipients' release timing visible. | Reconcile a cohort's funded, claimed and remaining amounts. | Multiple programs or reviewers need a shared view and export. |
| Communities running vested distributions | Allocate small amounts to many wallets while avoiding manual transfers. | Correct batch input validation and a high first-claim completion rate. | Repeated distributions justify operational support and reporting. |

Do not start with regulated equity compensation, securities distribution, tax calculation, institutional custody or complex employee termination logic. Those workflows require legal and product capabilities beyond a testnet scheduling contract. Larger institutions are a later segment only after requirements, funding and security investment are established.

The promise: **“Turn a token allocation into a funded schedule your recipient can inspect and claim.”** This is narrower and more defensible than promising investment growth, secure returns or automatic commercial success.

## 2. Product and current delivery boundary

### Core workflow

1. **Understand and simulate.** An English website explains the four release shapes and lets a visitor preview an illustrative schedule before connecting a wallet.
2. **Connect and select network.** An EVM wallet connects; transaction actions require Robinhood Chain Testnet. The user sees the connected address and network.
3. **Prepare.** The operator supplies token, amount, recipient, dates and any cliff allocation. The interface checks addresses, integer token units, date order, cliff amounts and batch totals. It shows the cancellation rule and release preview before signing.
4. **Approve and fund.** A token approval permits the escrow contract to transfer the intended amount. Creation deposits the allocation into the contract. Approval and creation may be separate wallet transactions; “fund once” does not imply every first use takes one signature.
5. **Inspect and claim.** The sender and recipient inspect their schedules; the recipient claims the currently released amount and receives an explorer-linked receipt. An unavailable RPC or failed transaction must be visible rather than presented as success.
6. **Return and reconcile.** A later claim or new campaign brings the operator and recipient back. Current onchain state remains the source of truth.

### Four uses, one funded release model

| Mode | Rule | Example | Boundary |
| --- | --- | --- | --- |
| Vesting | A configured cliff allocation unlocks at the cliff; the remaining allocation accrues from the cliff to the end at the chosen cadence. | A contributor allocation with an explicit initial release at a 3-month cliff and a scheduled remainder. | Nothing accrues before the cliff. The cliff allocation is separate from the post-cliff release and can be zero. |
| Whole-date lock | Nothing releases until the selected unlock timestamp, then the full balance is available. | A treasury allocation with a fixed release date. | The lock does not guarantee the token's value or underlying asset safety. |
| Payment stream | A fully funded finite allocation accrues by the second from its start, with no cliff lump sum. | A fixed 30-day grant or retainer denominated in a supported token. | This is claimable accrual, not automatic per-second wallet transfers or an open-ended salary account. |
| Vested distribution | Multiple recipients receive separate funded schedules under shared timing, with individual cliff amounts. | A community contributor cohort. | This MVP uses a bounded batch of up to 100 allocations, not a million-address Merkle campaign. |

### Rules that remain consistent everywhere

An optional cancellation flag permits **creator cancellation before or during a schedule**. Cancellation freezes the amount vested at that transaction's block time and immediately refunds only the unvested amount to the original sender. The recipient retains the vested amount minus previous claims and can claim it later; those earned rights are not clawed back. Before the cliff, no amount is vested, so cancellation refunds the full deposit. A noncancelable schedule cannot be canceled. This choice and its effect on future releases must appear prominently during setup.

A cliff allocation is explicit: for 1,200 tokens, a 300-token cliff allocation unlocks 300 at the cliff; the remaining 900 accrue afterward. With nine days from cliff to end and a daily cadence, 100 more vest per completed day. Cadence rounds elapsed time down from the cliff, and the end releases all remaining rounding dust. A recipient can transfer the remaining entitlement, including an unclaimed vested balance after cancellation, to a different wallet without changing its value or timing.

Schedules use integer token amounts and blockchain timestamps. A final release must settle the full allocation without leaving rounding dust beyond supported token behavior. Tokens should behave as ordinary ERC-20s; fee-on-transfer, rebasing, malicious or externally frozen tokens require separate treatment and are not promised as supported merely because they expose ERC-20 functions.

The current deployment is a **free, immutable testnet MVP**. No protocol fee switch, subscription gate or future paid feature should be described as altering existing funded schedules. The frontend must state the actual audit/deployment status. Test evidence and a public source verification are not independent security audits. “Noncustodial” means the application operator does not hold the user's private key or have discretionary access to the funded schedule; funds are still subject to smart-contract and token risk.

The exact shipped ABI, tested behavior, deployment receipt and limitations live with the implementation. This plan does not certify implementation completion. Before a release announcement, reconcile the product guide, UI, source and deployment manifest.

### Proposed commercial product, not shipped functionality

After validation, build a separate organizational workspace with role-based review, reusable recipient lists, CSV reconciliation, schedule labels, event indexing, team activity history and opt-in notifications. Later integrations may include Safe transaction preparation, accounting exports and developer APIs. None of these may prevent recipients from using the underlying free contract or direct chain access.

A cancellation at subscription end stops paid services; it never cancels, captures or changes a funded allocation. Data export and direct contract instructions are part of the product's trust proposition.

## 3. Why Robinhood Chain, and what it does not imply

Robinhood's official docs describe an Ethereum-compatible L2, ETH gas and mainstream developer tooling. They list **mainnet chain 4663 and testnet chain 46630**; therefore this plan does not assume Robinhood Chain mainnet is unlaunched. Temvorel's own release stays on testnet until its separate launch gates are met. [Official network configuration](https://docs.robinhood.com/chain/connecting).

A focused chain gives the team a bounded support surface and an identifiable builder community. Familiar EVM tooling permits a later chain expansion with less platform-specific rework. Neither choice establishes an official Robinhood relationship. No logo treatment, copy or pitch should imply affiliation, endorsement or preferred access.

The ecosystem's real-world-asset focus is a **future adjacency**, not permission to distribute every asset. Official Stock Token docs describe tokenized debt securities, jurisdiction restrictions and ERC-8056 display multipliers. Temvorel's MVP uses ordinary test ERC-20s. Supporting regulated stock tokens would require issuer/compliance review, allowed-transfer analysis, correct raw-token versus underlying-share accounting, and specific legal advice. No stock-token custody, minting, securities sale or investment service is part of the initial offer. [Official Stock Token overview](https://docs.robinhood.com/chain/stock-tokens).

## 4. Competition and a realistic advantage

| Alternative | Existing strength, based on current public material | Temvorel's proposed response |
| --- | --- | --- |
| Sablier | Mature multi-chain vesting, airdrops and payment tooling; established security work and distribution. | Compete on a focused operator workflow and clarity for a chosen segment, not breadth or maturity. |
| Hedgey | Token operations, vesting, investor/employee portals and free core tools. | Prove measurable reconciliation and support savings before asking for a subscription. |
| Superfluid | Composable continuous money-streaming infrastructure. | Serve fixed, prepaid commitment schedules with simple terms; avoid an unnecessary general streaming protocol. |
| Custom contracts + spreadsheets | Flexibility, existing habits, no new SaaS procurement. | Lower setup error, developer dependency and recipient support burden with a well-tested standard flow. |
| Reference-site workflow | Four schedule types already combined on Robinhood Chain Testnet. | Original implementation and UX, explicit rules, and a service business beyond a visual reskin. |

The initial contract is readily imitable. Durable advantage, if achieved, comes from trusted operational execution, reliable indexing, integrations, recipient comprehension and a proven acquisition channel. It does not come from a moat claim attached to a new name. Audits, open source and straightforward export build trust but also keep switching possible; that is acceptable if customers pay for ongoing service value.

As checked on 17 September 2026, Sablier's public pricing lists approximately **$0.99 per stream withdrawal** and **$1.99 per airdrop claim**, with sponsored and volume options. Hedgey advertises free core onchain tools. These are dated competitor observations, not a promise that competitors will keep those prices. [Sablier pricing](https://sablier.com/pricing), [Hedgey](https://hedgey.finance/).

## 5. Market hypothesis and validation

There is no researched, defensible Robinhood-specific customer count in the current evidence. Avoid multiplying crypto TVL by a fee rate: locked value is neither company revenue nor a count of willing buyers. Build the addressable market from identifiable organizations and their operational budget.

The following envelope is a **planning assumption to replace with a named prospect list**:

| Layer | Assumption | Illustrative annual software opportunity |
| --- | --- | --- |
| Longer-term global serviceable category | 2,000 English-speaking onchain teams that need recurring allocation operations and can buy software. | 2,000 × $219 blended monthly revenue × 12 = **$5.256 million**. |
| Initial Robinhood-focused reachable cohort | 80 potentially relevant organizations over 24 months, before conversion. | Even 100% conversion would be only **$210,240 annual revenue** at $219/month. |
| Initial 12-month target | 20–65 paying organizations, conditional on shipping paid features and validating demand. | Exit annualized recurring revenue **$52,560–$170,820**, not year-one recognized revenue. |

The 80-organization chain-focused envelope is **below the roughly 119 paying organizations needed to cover the proposed cost base**. A Robinhood-only subscription business at this price would not support the team under these assumptions. The plan therefore requires evidence for at least one of: a larger reachable segment, higher demonstrated willingness to pay, lower costs, or expansion to another EVM ecosystem after product fit. At 80 payers and an 85% gross margin, break-even monthly ARPA would be about **$324**. This is a decision constraint, not an issue to hide in a pitch.

### First eight weeks of customer discovery

- Build a list of 60 named prospective organizations from public ecosystem sources; classify token readiness, recipient count, frequency, buyer and current process. Do not count wallets as businesses.
- Conduct 20 operator interviews, request an anonymized description of one recent campaign, and measure time spent on preparation, reconciliation and recipient support. Interview recipients as well as founders.
- Recruit five design partners to complete two testnet workflows each. Record every blocked step and whether they can explain cliff/cancellation semantics accurately.
- Test $99 and $399 workspace propositions with actual scoped paid-pilot proposals after capabilities are available. A verbal “interesting” response is not willingness-to-pay evidence.
- Require at least three organizations to repeat a workflow without founder prompting, and at least two to accept a paid pilot or equivalent concrete procurement step before building a broad dashboard suite.

Use only user-authorized outreach and consented recordings. This document is an acquisition plan, not evidence that outreach has occurred.

## 6. Pricing and payment loop

### Current testnet offer

**$0 protocol fee and $0 subscription.** Users need testnet ETH for network gas and supported test tokens for allocations. Testnet assets are for testing, not company revenue or investment value. The team does not monetize deposits, recipient balances, float or token price appreciation. Gas estimates are network-dependent and should be denominated honestly rather than advertised as a fixed dollar price.

### Proposed workspace pricing, subject to validation

| Plan | Hypothesized monthly price | Service value | Limits / promise |
| --- | --- | --- | --- |
| Core | Free | Public contract interaction, recipient claims, basic schedule visibility. | Existing schedule access is not contingent on a subscription. |
| Operator | $99 | One organization, labeled schedules, saved templates, CSV reconciliation, opt-in alerts. | Define support and usage limits before sale. |
| Team | $399 | Collaboration, review workflow, audit trail, richer exports and priority response. | No guaranteed fund recovery or legal/accounting service. |
| Integration | Individually scoped | API/integration support or migration assistance after repeat demand. | Excluded from financial model until signed, priced and deliverable. |

An assumed customer mix of 60% Operator and 40% Team gives **$219 monthly average revenue per paying organization**. No volume levy on locked tokens or per-claim fee is needed for the base model. If a future contract version introduces any fee, it must be separately deployed, explicitly disclosed and cannot retroactively alter this immutable MVP.

The future purchase path is a self-serve workspace trial → clearly priced plan → processor-hosted checkout or approved business invoice → verified payment webhook → workspace entitlement → monthly usage/value report → renewal or cancel-and-export. Use a payment processor and operating entity appropriate to the jurisdiction. No checkout is claimed to exist in the current static/testnet delivery. Never collect card details directly in a custom frontend. Refund, tax, support and privacy terms must be written before taking commercial payment.

## 7. Acquisition, activation, revenue and retention loop

| Stage | Action and owner | Evidence collected | Next transition |
| --- | --- | --- | --- |
| Discovery | Founder publishes English schedule explanations, testnet demos and transparent build notes; pursues approved ecosystem workshops and direct conversations. | Qualified organizations by source, not impressions alone. | A visitor starts a schedule preview. |
| Activation | Product helps a sender create a valid funded test schedule and a recipient make a claim. | Confirmed chain receipts, completion time, failed/rejected transactions, comprehension feedback. | Sender creates a second schedule or invites a real teammate to review. |
| Evaluation | Founder measures administrative time before/after a repeat campaign. | Workflow hours saved, recipient support requests and correctly reconciled allocations. | Buyer accepts a scoped paid-workspace pilot. |
| Conversion | A commercial entity supplies terms and hosted checkout/invoice when the paid feature is ready. | Collected payment, service entitlement and cancellation acknowledgement. | Organization repeats the work without founder intervention. |
| Retention | Workspace generates monthly reconciliation and upcoming-release context with opt-in alerts. | Repeat active organizations, gross revenue retention, support load and export use. | Renewal and introduction to another qualified operator. |
| Referral | Recipient-facing clarity and successful operator outcomes support a voluntary case study/referral. | Referred activated organizations, permission to use any name or quote. | New organization re-enters discovery. |

Initial content is the prepared three-post launch sequence: explain the problem, demonstrate the four schedules, then show the testnet funding/claim flow and its limits. No reward campaign, referral token or airdrop entitlement should be implied. Testnet activity must not be presented as qualification for a future token.

The first channel experiment allocates **$2,000/month of cash** to content, demos and events, and tracks founder time separately. Do not launch broad paid ads until activation is repeatable. A hypothetical funnel of 1,000 qualified visits → 100 preview starts → 30 completed first schedules → 12 repeat teams → 4 paid teams yields **$500 cash CAC** at that spend. If founder sales time costs an additional $1,500, fully loaded CAC is **$875**. These are experiment assumptions; conversion must be measured, and prospects who merely hold a wallet are not qualified visits.

## 8. Unit economics and operating model

At $219 monthly ARPA and a planning gross margin of 85%, monthly gross profit per paying organization is **$186.15**. This 15% variable-cost allowance covers payment processing, customer-specific RPC/indexing usage and incremental service effort; fixed salaries and base infrastructure are separate. Use actual cost allocations once usage exists.

- A $500 cash CAC pays back in about **2.7 months** at that gross profit; an $875 fully loaded CAC takes about **4.7 months**.
- At a purely illustrative 3% monthly logo churn, gross-profit LTV is $219 × 85% ÷ 3% ≈ **$6,205**. With 6% churn it falls to about **$3,103**. The calculation assumes a stable cohort and is unreliable before retention history; it is not an investor-ready observed LTV.
- Operational break-even at $22,000/month fixed cost is $22,000 ÷ $186.15 ≈ **119 paying organizations**. At $149 ARPA it requires about 174, and at $299 ARPA about 87, holding gross margin constant.
- Treat annual prepayments as cash and deferred service obligations, not instantly recognized revenue. No annual-payment boost is included in the base case.

The recurring service team is two founding builders, fractional design/QA, and fractional operator support. Founders initially own customer discovery and support so they can identify repeated work before automating it. A dedicated security reviewer must be independent of the primary contract author before any real-value launch; local tests are necessary but insufficient.

## 9. Budget, runway and financial sensitivity

Illustrative capitalization requirement: **$360,000**. This is a funding target, not a claim of available cash or an offer of securities. No project token sale is planned. The baseline assumes modest founder compensation and must be adjusted for location, taxes, employment structure and quotes.

| Recurring monthly category | Budget |
| --- | ---: |
| Two founder/builder cash compensation budgets | $12,000 |
| Fractional design and QA | $2,500 |
| Fractional support / developer relations | $2,000 |
| Base infrastructure, RPC, monitoring and tools | $1,000 |
| Customer discovery, content and events | $2,000 |
| Legal/accounting/admin reserve | $1,000 |
| Operating contingency | $1,500 |
| **Total fixed monthly cash cost** | **$22,000** |

| One-time pre-production category | Budget |
| --- | ---: |
| Independent contract/security reviews and remediation | $40,000 |
| Legal formation, customer terms and relevant compliance review | $12,000 |
| Launch instrumentation and operational setup | $5,000 |
| Security response / bounty reserve | $10,000 |
| Brand, domain acquisition and launch contingency | $5,000 |
| **Total one-time allocation** | **$72,000** |

These figures are envelopes, not vendor quotes. The domain budget does not establish registrar price or purchase authorization. Some reserves may remain unspent; the cash model conservatively treats the full $72,000 as used in year one. If payroll taxes, benefits or compliance requirements exceed the compensation/legal envelopes, rebase the plan before hiring.

No-revenue runway after all one-time allocations is ($360,000 − $72,000) ÷ $22,000 = **13.1 months**. Do not call this an 18-month runway.

### First-year scenarios

Each count below is a billable organization for the full modeled month. Cash is assumed collected monthly without bad debt; variable costs equal 15% of revenue. No token proceeds, grants, asset appreciation, integration fees or bank interest are included. M1–M3 are free discovery/testnet work. Paid plans start only if their product and legal gates are met.

| Scenario | Monthly paying organizations, M1 → M12 | Organization-months | Year-one revenue | Exit MRR | Year-end cash |
| --- | --- | ---: | ---: | ---: | ---: |
| Downside | 0, 0, 0, 0, 2, 3, 5, 7, 10, 12, 15, 20 | 74 | $16,206 | $4,380 | $37,775 |
| Base | 0, 0, 0, 3, 6, 10, 15, 22, 30, 40, 52, 65 | 243 | $53,217 | $14,235 | $69,234 |
| Upside | 0, 0, 0, 5, 10, 20, 30, 45, 60, 80, 105, 135 | 490 | $107,310 | $29,565 | $115,214 |

Formula: year-end cash = $360,000 − $72,000 − 12 × $22,000 + 85% × year-one revenue. Exit MRR is the last month's count × $219; it is not recognized annual revenue. Counts represent a net outcome after churn; adding churn again would double-count it.

At the base exit run rate, monthly net cash burn is roughly $9,900 and cash supports approximately seven additional months **if customers, costs and revenue remain flat**. The upside reaches monthly operating break-even by year end but assumes expansion beyond the initial 80-organization reachable cohort. The downside leaves little room for another annual security or compliance expense. Decide on cost reduction or additional capital by month 8, well before cash is low. Do not finance ongoing payroll from user escrow balances.

Sensitivity is dominated by demand, not transaction volume. If the paid workspace slips three months, rebuild the month-by-month model immediately; do not retain the original revenue ramp. If security review costs double, $40,000 of extra expense consumes about 1.8 months of pre-revenue runway. If support needs exceed the 15% variable cost envelope, gross margin and break-even must be recalculated.

## 10. Milestones, owners and go/no-go rules

Dates are relative to project kickoff; mainnet deployment is a separate decision and is not automatically authorized by this plan.

| Window | Deliverable and owner | Go criterion | If the criterion is missed |
| --- | --- | --- | --- |
| Weeks 1–2 | Founding engineering: English Vue website, four-mode testnet flow, wallet/network guards, documented contract behavior and repeatable local tests. | Create → fund → claim demonstrated on the intended testnet; failed transactions never display success; no secret is bundled. | Fix correctness and observability before promotion. |
| Weeks 3–4 | Founder/operator: 20 interviews and five hands-on design partners; support notebook. | At least 3 partners finish an unassisted repeat workflow; users can explain cancellation and cliff timing. | Narrow the segment or simplify the flow; do not spend on broad acquisition. |
| Weeks 5–8 | Engineering + independent reviewer: threat model, review quotations, fuzz/invariant plan, mobile and accessibility remediation; operator validates paid scope. | Zero known critical/high findings; at least two concrete paid-pilot commitments for identified services. | Keep testnet free; defer production and broad workspace build. |
| Months 3–4 | Workspace lead: smallest paid reporting/collaboration service; commercial lead: entity, terms, processor and billing support. | Five repeat organizations and successful end-to-end trial → payment → entitlement → cancellation/export. | Revise value/price. A pricing page alone is not commercialization. |
| Months 5–6 | Engineering/security: production readiness review; founder: retained customer cohort and approved case study. | Independent review complete, deployment verified, incident plan rehearsed, legal scope cleared, measurable customer value. | Continue testnet; funded real-value schedules remain out of scope. |
| Months 7–9 | Growth lead: one repeatable channel; technical lead: evaluate a second EVM chain only if demand supports it. | Fully loaded CAC payback <6 months, support sustainable, at least 80% of activated organizations retained at 90 days. | Reduce burn and focus; no unfunded chain expansion. |
| Months 10–12 | Leadership: retention and capital decision. | Credible path to ≥119 paying teams or equivalent margin/cost improvement; ≥6 months runway planned. | Cut scope, lower fixed costs, raise on real evidence, or stop the paid experiment. |

For a permissionless immutable contract, a frontend “closed beta” is not an enforceable deposit limit: others can call the contract directly. A real-value pilot that depends on caps or allowlists needs an explicitly reviewed contract design. Do not advertise a value cap that exists only in the UI.

## 11. Measurement and reporting

The north-star metric is **monthly active organizations completing a correct funded release workflow with at least one recipient claim**, rather than TVL or raw wallet connections. Testnet and mainnet metrics must remain separate.

| KPI | Definition | Initial target / review cadence |
| --- | --- | --- |
| Activation | Organizations with a confirmed first create and recipient claim ÷ qualified organizations starting setup. | Establish baseline in first 20 trials; target >40% after onboarding fixes. |
| Time to first value | Median time from starting a prepared setup to a confirmed recipient claim in a short test schedule. | <10 minutes excluding intentional cliff delay and faucet wait; report exclusions. |
| Creation reliability | Confirmed creations ÷ wallet-submitted creation transactions. | >98% excluding deliberate user rejection; categorize every failure. |
| Recipient comprehension | Recipients correctly state next release and cancellation rule in usability testing. | ≥90% of a minimum 20 observed tests. |
| Repeat use | Activated organizations creating another campaign within 60 days. | ≥30%, adjusted for actual allocation cadence. |
| Paid conversion | Paid organizations ÷ eligible trial organizations after a full evaluation window. | Learn from first 10 eligible trials; target ≥20%. |
| Retention | 90-day paying organizations retained; gross revenue retention separately. | ≥80% logo retention initially; seek ≥90% after segment fit. |
| Economics | Fully loaded acquisition cost, gross margin, support hours per paying organization. | <6-month CAC payback, ≥80% gross margin, <1 routine support hour per organization/month. |
| Safety | Reconciliation discrepancies, known unresolved severity findings, misleading transaction states. | Zero unexplained balance discrepancy; zero critical/high findings at production gate. |

Instrument a minimal event schema: `preview_started`, `wallet_connected`, `network_ready`, `approval_submitted`, `creation_submitted`, `creation_confirmed`, `claim_confirmed`, `repeat_campaign`, `trial_started`, `payment_confirmed`, `subscription_canceled`. Transaction hashes and contract events verify financial state; analytics events alone cannot confirm settlement. Separate failed, dropped, reverted and user-rejected transactions. Avoid collecting private keys, seed phrases or full recipient CSVs in analytics. Wallet addresses are linkable data and should be minimized with documented retention.

Report weekly product/funnel cohorts and monthly cash/retention. Publish a metric only with its definition, time range, network and source. The testnet demo must not count internal deployment/testing wallets as acquired customers.

## 12. Risk register and operational response

| Risk | Concrete failure | Mitigation / owner |
| --- | --- | --- |
| Contract defect | Early unlock, overclaim, duplicate claim, rounding error or reentrancy. | Independent review, meaningful boundary/invariant tests, minimal immutable scope, reproducible builds; security lead. |
| Unsupported token behavior | Balance changes, transfer tax, blacklist or a deceptive token cause wrong accounting or failed claims. | Balance-delta checks where applicable, explicit supported-token policy, token-specific review and clear UI; engineering. A creation check cannot detect every future token behavior. |
| Incorrect schedule input | Wrong wallet, units, timezone, cliff or cancellation expectation is funded irreversibly. | Checksummed display, token decimals, UTC/local display, preview, explicit review, sample batch and confirmation; product. |
| Network or RPC disruption | Balances do not load, receipt status is stale, transactions stall. | Provider redundancy, source timestamps, retries without duplicate submissions, explorer fallback and incident status; engineering. |
| Treasury / deployer compromise | Secrets leak into source, logs or frontend assets. | Test-only key handling, no key in bundles, separate production keys and access policy; engineering. |
| Demand failure | Operators use free tools and will not buy workspace features. | Paid pilot tests, narrow segment, time-saved measurement and explicit stop gates; founder. |
| Competitive response | Established protocols add the same workspace features. | Faster segment-specific service, integrations and reliability; leadership. Do not assume exclusive contracts. |
| Legal scope creep | Marketing implies stock ownership, regulated distribution or an official Robinhood partnership. | Clear independent identity, standard-token scope, legal review before restricted assets/markets; commercial lead. |
| Name availability | Domain or matching X handle cannot be secured. | Dated registry evidence and official X username preflight before paid brand launch; founder. A successful preflight is not a reservation or a guarantee of later registration. |
| Frontend compromise | Malicious UI changes recipients or requests excessive approvals. | Reviewed deploy pipeline, dependency controls, verified contract links and transaction-summary checks; engineering. |
| Notification/indexer outage | Paid workspace misses a scheduled alert or displays stale accounting. | Event replay, block checkpointing, monitoring and visible sync status; workspace lead. Contract settlement must not depend on notifications. |

Incident procedure: confirm scope, stop promoting new deposits, display a factual warning with affected contract/network, preserve diagnostic evidence without secrets, involve the independent reviewer, publish verified updates and document recovery options. An immutable contract may have no pause, upgrade or recovery mechanism. Do not promise that operators can reverse an exploit or recover funds. Keep direct claim instructions and a static copy of verified ABI/source available where feasible.

## 13. Brand, launch package and ownership handoff

The prepared identity is **Temvorel / temvorel.xyz / @temvorel**, pronounced **TEM-vor-el**. Temvorel is a coined name formed from tempo, vow and release: commitments released with a clear rhythm. The exact-name search, registry checks and X username validation are recorded in [name-availability.md](name-availability.md). These are point-in-time observations; no domain purchase, account registration, reservation or trademark clearance is claimed. A public search cannot establish that a string has never existed anywhere online.

The prepared launch package consists of an English Vue site, a distinct logo system, X avatar/banner, English bio and three illustrated JPG posts. Publication requires ownership of the chosen domain/account and a final check that the copy describes the actual deployed product. The root project's delivery manifest records which technical/art assets are present. This plan does not imply the domain is serving the website or the X posts are published.

Recommended short bio: **“Value, on your terms. Vesting, locks, streams & vested distributions on Robinhood Chain Testnet. Independent. Test tokens only.”**

Initial launch success is ten independent organizations completing and understanding a full testnet workflow, with evidence of repeat need. Mainnet readiness, paid revenue and ecosystem expansion are separate milestones. If those demand and safety gates fail, the rational outcome is a smaller free tool or a halted commercial experiment—not stronger marketing claims.

## Source notes

All web observations checked 17 September 2026:

- [Robinhood Chain overview](https://docs.robinhood.com/chain/), [network configuration](https://docs.robinhood.com/chain/connecting), [deployment guide](https://docs.robinhood.com/chain/deploy-smart-contracts).
- [Robinhood Stock Tokens](https://docs.robinhood.com/chain/stock-tokens) and [developer integration/accounting](https://docs.robinhood.com/chain/building-with-stock-tokens).
- [Sablier product](https://sablier.com/) and [pricing](https://sablier.com/pricing).
- [Hedgey](https://hedgey.finance/) and [Superfluid](https://www.superfluid.org/).
- [Lido](https://lido.fi/), [Jupiter](https://jup.ag/) and [Uniswap](https://app.uniswap.org/) for content and interaction research.
- [Provided reference](https://unlocklexyz.vercel.app/), reviewed as a workflow benchmark, not a security or business claim source for Temvorel.

The market counts, customer mix, prices, funnel rates, cost estimates and financial scenarios are explicitly **internal planning assumptions**. They are not attributed to the sources above.
