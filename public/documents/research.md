# Temvorel — product, network and design research

Research date: **17 September 2026**. Sources below were fetched live; Sablier, Lido, Jupiter and Uniswap were also inspected in a rendered desktop browser. This report distinguishes observable facts from design decisions and business hypotheses. Source marketing claims are attributed to their publishers and are not independent audits.

## Product baseline and scope

The supplied reference resolves to [Unlockle](https://unlocklexyz.vercel.app/). Its landing page presents four schedules: token vesting, a whole-date token lock, a payment stream and a vested batch airdrop. It also describes wallet connection, token approval, schedule preview, claims, recipient transfer, an explorer link and a sender/recipient dashboard.

The useful product pattern is a single contract primitive viewed through four user intentions. Temvorel adopts that functional model, with its own implementation, wording, visual identity and brand assets. The reference's source, logos, artwork, claimed audits and customer proof do not constitute evidence about Temvorel.

The reference contains inconsistent cancellation descriptions: one section says creator cancellation before the start; an FAQ describes cancellation after vesting with a split refund. The revised Temvorel contract implements **optional creator cancellation with a vested-value snapshot**: refund the unvested remainder and preserve already vested, unclaimed value for the recipient. A schedule may include an explicit `cliffAmount`; nothing vests before the cliff, that amount vests at the cliff, and the remainder vests from the cliff to the end at the selected cadence. Streams use `cliff = start`, `cliffAmount = 0` and a one-second interval. The exact deployed revision and behavior must be checked against [contracts.md](contracts.md); a user must see the cancellation and cliff rules before funding.

## Verified Robinhood Chain facts

| Fact | Official source and observed evidence | Implication |
| --- | --- | --- |
| Ethereum-compatible L2 using Arbitrum technology | [About Robinhood Chain](https://docs.robinhood.com/chain/) describes an EVM-compatible L2 on Arbitrum Dedicated Blockchains. | Standard Solidity, ERC-20, ethers and viem tooling are appropriate. |
| Mainnet and testnet exist | [Connecting](https://docs.robinhood.com/chain/connecting) lists mainnet `4663` and testnet `46630`. | Describe **Temvorel as a testnet release**. Do not say Robinhood Chain itself is only a testnet. |
| Testnet configuration | Chain ID `46630`, symbol `ETH`, public RPC `https://rpc.testnet.chain.robinhood.com`, explorer `https://explorer.testnet.chain.robinhood.com`. | Wallet switching and deployment must use testnet values; reject a mismatched chain before sending. |
| Production RPC considerations | Official connecting page says public endpoints are rate limited and not recommended for production. | A production launch needs funded RPC capacity, monitoring and fallback providers. |
| Official deployment guidance | [Deploy a Contract](https://docs.robinhood.com/chain/deploy-smart-contracts) recommends testnet first; its example commands default to mainnet. | Copying an example without switching the configuration would be wrong for this brief. No key belongs in source or the frontend. |
| Gas token | Official docs specify ETH. | A mock ERC-20 balance does not pay gas. No claim of “free gas” or fixed dollar gas cost. |
| Stock Token legal nature | [Stock Tokens](https://docs.robinhood.com/chain/stock-tokens) describes tokenized debt securities, eligibility restrictions and no legal or beneficial ownership in the underlying issuer. | “Tokenized stocks” does not mean that every ERC-20 tool may market equity ownership or unrestricted stock distribution. |
| Stock Token accounting | [Building with Stock Tokens](https://docs.robinhood.com/chain/building-with-stock-tokens) describes ERC-8056 `uiMultiplier()`, fixed raw balances and adjusted share displays. | A future RWA integration needs explicit raw-token/share-unit handling and jurisdiction/issuer review. It is outside the ordinary test-token MVP. |

The network's documentation may evolve. Confirm chain ID through JSON-RPC immediately before deployment. A published deployment address and successful receipt, not this report, are evidence of a contract deployment.

## Four mainstream interface studies

The selection covers established onchain products with visibly active product surfaces. No unsupported claim is made that these are the four most popular protocols, or that a current ranking has been measured.

| Site | Observed content and hierarchy | Observed visual / interaction pattern | Decision for Temvorel |
| --- | --- | --- | --- |
| [Sablier](https://sablier.com/) | Clear “Onchain token distribution” proposition; app/pricing CTAs; use-case cards; schedule features; security/source links; ecosystem section; closing CTA. | Dark navy, orange buttons, blue 3D hourglass and coins, broad two-column hero, roomy sections and rounded cards. | Best **information architecture** match. Lead with release schedules, explain the four modes, show verifiable contract mechanics and a clear app action. Use original imagery and a distinct palette. |
| [Lido](https://lido.fi/) | “staking with stETH” hero; live-looking metric labels; product cards; security, audits and governance; ecosystem and extensive footer. | Near-white/pastel surface, very large black typography, generous negative space, prominent 3D token, compact high-contrast CTA. | Adopt editorial clarity and staged proof. Temvorel can link tests/source/deployment status; it cannot borrow Lido's maturity, audits or financial metrics. |
| [Jupiter](https://jup.ag/) | “Home of Onchain Finance”; persistent wallet connection; sidebar organized as Trade/Earn/Manage; a central working form; portfolio state and help. | Dense dark application shell, muted panels, lime actions, persistent navigation and network/product context. | Use the operational pattern in the app: obvious mode selection, persistent wallet/network state, transaction feedback and a focused workspace. Avoid its large menu because Temvorel has four related tasks. |
| [Uniswap](https://uniswap.org/) → [app.uniswap.org](https://app.uniswap.org/) | The root redirects directly to the app. One central exchange task, token selectors, primary connect/start action and compact navigation. | White canvas, pink accents, soft blurred token imagery, centered form and a short proposition. Browser localization translated this session to Chinese; structure and hierarchy remained inspectable. | Put the first meaningful action within one interaction of the homepage. Use progressive disclosure for advanced scheduling inputs; never require connection to understand the product. |

Current design direction: a light precision workspace with a cobalt-blue action color, explicit timeline tracks, square control points, compact navigation and strong typographic hierarchy. The home page makes the four release modes inspectable; the creation flow separates setup from review; schedules expose state and next actions. This replaces the former sculpture-led visual approach. A schedule preview remains useful without a wallet and is visibly labeled as illustrative.

Marketing content sequence: identity/network status → one clear benefit → schedule preview → four uses → create/fund/claim explanation → security mechanics and limits → honest pricing → roadmap → FAQ → working app and documentation links. Onchain metrics must come from the deployed contract or show an empty/loading state; no fabricated TVL, users, partnerships or audit badges.

## Competitive product and pricing observations

| Product | Live source observation | Consequence for the business |
| --- | --- | --- |
| Sablier | [Homepage](https://sablier.com/) presents vesting, airdrops, grants, payroll and deployment on 24+ EVM chains. [Pricing](https://sablier.com/pricing) displays approximately $0.99 per stream withdrawal and $1.99 per airdrop claim in native gas token, plus sponsorship/volume arrangements. | Vesting is an established category. Recipient-cost transparency and operational ease matter; a new entrant cannot sell “first ever” streaming. Pricing is a dated competitive observation, not an immutable quote. |
| Hedgey | [Homepage](https://hedgey.finance/) markets employee vesting, investor lockups, cap-table management and recipient portals. It advertises free core onchain tools and states it is part of Anchorage Digital with HedgeyPro. | Free smart contracts are a real competitive baseline. Sell reporting, collaboration and service only when they save operators measurable effort. |
| Superfluid | [Homepage](https://www.superfluid.org/) positions continuous money streaming as infrastructure for recurring onchain payments, rewards and composable applications. | Temvorel's finite, fully funded schedules are a narrower product. Avoid claiming equivalence to an open-ended streaming balance protocol. |
| Unlockle reference | [Reference site](https://unlocklexyz.vercel.app/) combines four modes on Robinhood Chain Testnet. Its copy includes audit and fee-control claims. | It supplies a workflow benchmark, not differentiation or a security audit for this build. Temvorel needs independently tested behavior and a different operational proposition. |

Sablier, Lido and Superfluid display adoption/financial counters. Those numbers were not verified against onchain datasets and are deliberately excluded from the market-sizing model. No customer or partner of those products is represented as a Temvorel customer or partner.

## Commercial interpretation

The initial wedge is English-speaking token operations teams building on Robinhood Chain: teams with recurring contributor, grant or community allocation work, rather than speculative retail token buyers. Their job is to make a funded promise legible, deliver it correctly, and answer “how much can I claim, and when?” without repeated manual support.

The smallest useful loop is **discover → model schedule → connect → approve/fund → share allocation details → recipient claims → operator reconciles → repeats**. It becomes a business only when repeat operators pay for a separate service that reduces their administrative cost. The immutable testnet protocol is free. Paid collaboration, indexer-backed reporting, alerts and integrations are proposed services and must not be represented as already shipped.

## Evidence index

- Raw HTTP responses: `evidence/initial-4.json` (Robinhood overview), `initial-6.json` (Sablier), `initial-7.json` (Uniswap redirect/app shell), `initial-8.json` (Lido), `initial-9.json` (Jupiter).
- Official network and integration responses: `evidence/research-network.json`, `research-deploy.json`, `research-stocktokens.json`, `research-stocks.json`.
- Competitive responses: `evidence/research-sablier-pricing.json`, `research-hedgey.json`, `research-superfluid.json`.
- Name checks and boundaries: [name-availability.md](name-availability.md).
- Business model, experiments and financial assumptions: [business-plan.md](business-plan.md).

Some saved HTML is truncated to a practical evidence size; the dated URLs above remain the primary sources. The business plan uses explicit hypotheses where source data is insufficient.
