<script setup>
import { ArrowUpRight, Download } from 'lucide-vue-next'
import { brand } from '../config/brand'
import contracts from '../config/contracts.json'
import { network } from '../composables/wallet'

const sections = [
  ['getting-started', 'Your first schedule'],
  ['four-ways', 'Four ways to distribute'],
  ['timing', 'How time unlocks tokens'],
  ['managing', 'Claims & control'],
  ['contracts', 'Contracts & network'],
  ['security', 'Security & limits'],
  ['downloads', 'Further reading'],
]
const explorerContract = address => `${network.explorer}/address/${address}?tab=contract`
</script>

<template>
  <div class="container">
    <header class="page-intro">
      <p class="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p>
      <h1>Your field guide.</h1>
      <p>From your first funded schedule to your final claim. Understand how {{ brand.name }} works, what you control, and where to check the details.</p>
    </header>

    <div class="docs-layout">
      <nav class="docs-nav" aria-label="Documentation sections">
        <RouterLink v-for="[id, title] in sections" :key="id" :to="`/docs#${id}`">{{ title }}</RouterLink>
        <RouterLink to="/#faq">Common questions ↗</RouterLink>
      </nav>

      <article class="docs-content">
        <section id="getting-started">
          <div class="notice info">This is an experimental testnet release. The contracts have not been independently audited. Use test tokens only.</div>
          <h2>Your first schedule.</h2>
          <ol>
            <li><strong>Connect an EVM wallet.</strong> Select “Connect wallet” and choose your browser wallet. On mobile, use your wallet’s browser. Connecting shares your public address; it does not transfer tokens or authorize a payment.</li>
            <li><strong>Switch to {{ network.name }}.</strong> The app requests the correct network before a transaction. The chain ID is <code>{{ network.id }}</code>. Obtain test ETH for gas from the <a :href="network.faucet" target="_blank" rel="noopener noreferrer">official testnet faucet</a>; its access and rate limits are managed externally.</li>
            <li><strong>Mint demonstration tokens.</strong> Open <RouterLink to="/create">Create a schedule</RouterLink> and use the test-token mint action. {{ contracts.tokenName }} ({{ contracts.tokenSymbol }}) is a freely mintable token with {{ contracts.tokenDecimals }} decimals. Its contract permits up to 10,000 tUSD per mint transaction. Minting also requires test ETH for gas. tUSD has no monetary value, backing or redemption right.</li>
            <li><strong>Choose a flow and set its terms.</strong> Enter the token, recipient, amount and dates. Give a future start enough room for wallet confirmation. A start in the past when the transaction executes is rejected. Review the cliff, cadence and optional cancellation setting.</li>
            <li><strong>Approve, then fund.</strong> If your allowance is insufficient, first approve the scheduler to spend the required token amount. Then confirm the creation transaction. An approval alone creates no schedule. The second transaction moves the full deposit into the contract and records the schedule; a batch funds all its allocations together.</li>
            <li><strong>Follow it in your workspace.</strong> Open <RouterLink to="/locks">Your workspace</RouterLink> to view sent and received schedules. Use the transaction link to confirm its onchain status. The current recipient signs a claim transaction when tokens become available.</li>
          </ol>
        </section>

        <section id="four-ways">
          <p class="eyebrow">SAME COMMITMENT. DIFFERENT RHYTHMS.</p>
          <h2>Four ways to distribute.</h2>
          <div class="small-table-wrap">
            <table aria-label="The four supported token distribution modes">
              <thead><tr><th scope="col">Flow</th><th scope="col">Release rule</th><th scope="col">Typical use</th></tr></thead>
              <tbody>
                <tr><th scope="row">Token vesting</th><td>Accrues from the start at your chosen cadence. Claims open at the cliff; all remaining tokens vest at the end.</td><td>Team and contributor allocations</td></tr>
                <tr><th scope="row">Token lock</th><td>The full amount becomes claimable at one unlock time. Start, cliff and end are that same timestamp.</td><td>Treasury commitments and reserves</td></tr>
                <tr><th scope="row">Payment stream</th><td>A funded balance accrues at a one-second cadence between start and end. A configured cliff still gates claims.</td><td>Time-based grants and contributor payments</td></tr>
                <tr><th scope="row">Vested airdrop</th><td>Create up to 100 separately funded allocations in one atomic batch, with shared dates and cadence. Recipients claim independently.</td><td>Community and ecosystem allocations</td></tr>
              </tbody>
            </table>
          </div>
          <p>A vested airdrop creates claimable schedules; it does not immediately send the allocations to every wallet. A stream also requires recipient claims. Neither mode automatically pushes payments over time.</p>
        </section>

        <section id="timing">
          <h2>Time, without the guesswork.</h2>
          <p><strong>The start begins accrual. The cliff opens claims.</strong> A cliff is a gate, not an extra allocation. Until it arrives, the claimable amount is zero. Once it passes, the amount already accrued from the start can be claimed, rounded down to the last completed cadence interval.</p>
          <p>For example, 1,200 tokens over 12 days, with a daily cadence and a three-day cliff, make 300 tokens available at the cliff. A further 100 tokens vest at each completed day. If the cliff falls between cadence ticks, only completed ticks count. At or after the end, the entire allocation is vested, including any rounding remainder.</p>
          <p>Before the end, the calculation is:</p>
          <p><code>vested = floor(amount × (floor((now − start) / interval) × interval) / (end − start))</code></p>
          <p>The amount available to withdraw is vested tokens minus previous claims. Dates are stored as Unix timestamps and evaluated using the chain’s block timestamp. Token calculations use the token’s smallest units; the final unlock releases any rounding remainder.</p>
          <p>Amounts, dates, cadence and the cancellation setting cannot be edited after funding. Check every field before signing.</p>
        </section>

        <section id="managing">
          <h2>Know what you control.</h2>
          <h3>Claim as the recipient</h3>
          <p>Only the schedule’s current recipient can claim its unlocked balance. Claims require test ETH for gas. Claiming part of an allocation leaves the remaining schedule in place. Already claimed tokens cannot be claimed again.</p>
          <h3>Cancel only before the start</h3>
          <p>If cancellation was enabled at creation, only the original sender can cancel, strictly before the stored start time. Cancellation refunds the entire deposit to the sender. At the start and afterwards, cancellation is unavailable, even before the cliff. For a date lock, the stored start is its unlock time. A non-cancelable schedule cannot be canceled at any time.</p>
          <h3>Transfer the remaining entitlement</h3>
          <p>The current recipient can transfer the entire remaining claim right to a different wallet. The sender, dates, amount, previous claims and cancellation setting stay the same. The new recipient becomes the only wallet able to claim the remaining tokens. This is a transfer of rights, not an immediate payout. Canceled or fully claimed schedules cannot be transferred.</p>
        </section>

        <section id="contracts">
          <p class="eyebrow">OUT IN THE OPEN</p>
          <h2>Check the contract yourself.</h2>
          <p>The addresses below are the same deployment configuration used by this app. Both contracts have source code published on the official testnet explorer.</p>
          <h3>Token scheduler</h3>
          <a :href="explorerContract(contracts.schedulerAddress)" target="_blank" rel="noopener noreferrer"><code class="code-address">{{ contracts.schedulerAddress }}</code></a>
          <h3>{{ contracts.tokenName }} · {{ contracts.tokenSymbol }}</h3>
          <a :href="explorerContract(contracts.testTokenAddress)" target="_blank" rel="noopener noreferrer"><code class="code-address">{{ contracts.testTokenAddress }}</code></a>
          <div class="small-table-wrap">
            <table>
              <tbody>
                <tr><th scope="row">Network</th><td>{{ network.name }}</td></tr>
                <tr><th scope="row">Chain ID</th><td>{{ network.id }} · {{ network.hex }}</td></tr>
                <tr><th scope="row">Gas asset</th><td>Test ETH</td></tr>
                <tr><th scope="row">Public RPC</th><td><code>{{ network.rpc }}</code></td></tr>
                <tr><th scope="row">Deployment date</th><td>{{ contracts.deployedAt.slice(0, 10) }} UTC</td></tr>
              </tbody>
            </table>
          </div>
          <p><a :href="explorerContract(contracts.schedulerAddress)" target="_blank" rel="noopener noreferrer">Read the scheduler on the explorer <ArrowUpRight :size="12" /></a> or download the source and deployment details below. Source verification shows correspondence to deployed code; it is not an independent security audit.</p>
        </section>

        <section id="security">
          <h2>Simple rules. Real limits.</h2>
          <p>The deployed scheduler is immutable and has no administrator, upgrade mechanism, pause function, protocol fee or administrator withdrawal path. Its deployer has no privileged access. There is no operator who can edit a schedule or recover tokens by overriding its rules.</p>
          <p>Creation, approvals, claims, cancellation and recipient transfers still require network gas. The absence of protocol fees does not mean transactions are gas-free.</p>
          <p>Use standard, fixed-balance ERC-20 test tokens. The contract checks exact deposit and withdrawal amounts and rejects taxed or underpaid transfers. Rebasing tokens, issuer freezes, blacklists, malicious token behavior or future token upgrades can still make funds inaccessible. These checks do not establish that any arbitrary token is safe.</p>
          <div class="notice info">This release has not been independently audited and is not ready for real funds. Testnet availability and token balances can change. An eventual production launch requires a separate security review and deployment decision.</div>
        </section>

        <section id="downloads">
          <h2>A little more detail.</h2>
          <div class="download-grid">
            <a class="download-card" href="/documents/contracts.md" download><span>Contract guide & addresses</span><Download :size="17" /></a>
            <a class="download-card" href="/documents/TokenSchedules.sol" download><span>Scheduler source · Solidity</span><Download :size="17" /></a>
            <a class="download-card" href="/documents/MockUSD.sol" download><span>Test-token source · Solidity</span><Download :size="17" /></a>
            <a class="download-card" href="/documents/business-plan.md" download><span>Business plan</span><Download :size="17" /></a>
            <a class="download-card" href="/documents/brand-kit.zip" download><span>{{ brand.name }} brand kit</span><Download :size="17" /></a>
            <RouterLink class="download-card" to="/#faq"><span>Common questions</span><ArrowUpRight :size="17" /></RouterLink>
          </div>
          <p>The business plan describes proposed commercial development; its targets are planning assumptions, not achieved results. Read the <RouterLink to="/legal">testnet terms and privacy information</RouterLink> before using the app.</p>
        </section>
      </article>
    </div>
  </div>
</template>
