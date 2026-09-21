<script setup>
import { ArrowUpRight, Download } from "lucide-vue-next";
import { brand } from "../config/brand";
import contracts from "../config/contracts.json";
import { network } from "../composables/wallet";

const sections = [
  ["getting-started", "Your first schedule"],
  ["four-ways", "Four ways to distribute"],
  ["timing", "How time unlocks tokens"],
  ["managing", "Claims & control"],
  ["contracts", "Contracts & network"],
  ["security", "Security & limits"],
  ["downloads", "Further reading"],
];
const explorerContract = (address) =>
  `${network.explorer}/address/${address}?tab=contract`;
</script>

<template>
  <div class="container">
    <header class="page-intro">
      <p class="eyebrow">{{ brand.name.toUpperCase() }} / HANDBOOK</p>
      <h1>Understand every release.</h1>
      <p>
        The practical guide to {{ brand.name }}. Learn the release models, check
        permissions, and verify what happens when you sign.
      </p>
    </header>

    <div class="guide-shortcuts" role="group" aria-label="Quick start paths">
      <RouterLink to="/create"
        ><span>01 / CREATE</span><strong>Build a schedule</strong
        ><ArrowUpRight :size="18" /></RouterLink
      ><RouterLink to="/locks"
        ><span>02 / MANAGE</span><strong>Track or claim tokens</strong
        ><ArrowUpRight :size="18" /></RouterLink
      ><RouterLink to="/docs#contracts"
        ><span>03 / VERIFY</span><strong>Inspect the contracts</strong
        ><ArrowUpRight :size="18"
      /></RouterLink>
    </div>
    <div class="docs-layout">
      <nav class="docs-nav" aria-label="Documentation sections">
        <p class="eyebrow">IN THIS GUIDE</p>
        <RouterLink
          v-for="[id, title] in sections"
          :key="id"
          :to="`/docs#${id}`"
          >{{ title }}</RouterLink
        >
        <RouterLink to="/#faq">Common questions ↗</RouterLink>
      </nav>

      <article class="docs-content">
        <section id="getting-started">
          <div class="notice info">
            This is an experimental testnet release. The contracts have not been
            independently audited. Use test tokens only.
          </div>
          <p class="eyebrow">01 / GETTING STARTED</p>
          <h2>From wallet to funded schedule</h2>
          <ol>
            <li>
              <strong>Connect an EVM wallet.</strong> Select “Connect wallet”
              and choose your browser wallet. On mobile, use your wallet’s
              browser. Connecting shares your public address; it does not
              transfer tokens or authorize a payment.
            </li>
            <li>
              <strong>Switch to {{ network.name }}.</strong> The app requests
              the correct network before a transaction. The chain ID is
              <code>{{ network.id }}</code
              >. Obtain test ETH for gas from the
              <a
                :href="network.faucet"
                target="_blank"
                rel="noopener noreferrer"
                >official testnet faucet</a
              >; its access and rate limits are managed externally.
            </li>
            <li>
              <strong>Mint demonstration tokens.</strong> Open
              <RouterLink to="/create">Create a schedule</RouterLink> and use
              the test-token mint action. {{ contracts.tokenName }} ({{
                contracts.tokenSymbol
              }}) is a freely mintable token with
              {{ contracts.tokenDecimals }} decimals. Its contract permits up to
              10,000 tUSD per mint transaction. Minting also requires test ETH
              for gas. tUSD has no monetary value, backing or redemption right.
            </li>
            <li>
              <strong>Choose a flow and set its terms.</strong> Enter the token,
              recipient, amount, dates and any cliff allocation. “Start now”
              resolves when the creation transaction is mined. A specified past
              start is accepted, so check the release preview carefully: it may
              make tokens immediately claimable. Review the cliff amount,
              cadence and optional cancellation setting.
            </li>
            <li>
              <strong>Approve, then fund.</strong> If your allowance is
              insufficient, first approve the scheduler to spend the required
              token amount. Then confirm the creation transaction. An approval
              alone creates no schedule. The second transaction moves the full
              deposit into the contract and records the schedule; a batch funds
              all its allocations together.
            </li>
            <li>
              <strong>Follow it in your workspace.</strong> Open
              <RouterLink to="/locks">Your workspace</RouterLink> to view sent
              and received schedules. Use the transaction link to confirm its
              onchain status. The current recipient signs a claim transaction
              when tokens become available.
            </li>
          </ol>
        </section>

        <section id="four-ways">
          <p class="eyebrow">02 / DISTRIBUTION MODELS</p>
          <h2>Choose the right release model</h2>
          <div class="small-table-wrap">
            <table aria-label="The four supported token distribution modes">
              <thead>
                <tr>
                  <th scope="col">Flow</th>
                  <th scope="col">Release rule</th>
                  <th scope="col">Typical use</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Token vesting</th>
                  <td>
                    The configured cliff amount unlocks at the cliff. The
                    remainder accrues from the cliff at your chosen cadence; all
                    remaining tokens vest at the end.
                  </td>
                  <td>Team and contributor allocations</td>
                </tr>
                <tr>
                  <th scope="row">Token lock</th>
                  <td>
                    The full amount becomes claimable at one unlock time. Start,
                    cliff and end are that same timestamp.
                  </td>
                  <td>Treasury commitments and reserves</td>
                </tr>
                <tr>
                  <th scope="row">Payment stream</th>
                  <td>
                    A funded balance accrues at a one-second cadence. The stream
                    begins at its start time with no cliff lump sum; recipients
                    claim the accrued amount.
                  </td>
                  <td>Time-based grants and contributor payments</td>
                </tr>
                <tr>
                  <th scope="row">Vested airdrop</th>
                  <td>
                    Create up to 100 separately funded allocations in one atomic
                    batch, with shared dates and cadence and an individual cliff
                    amount for each allocation. Recipients claim independently.
                  </td>
                  <td>Community and ecosystem allocations</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            A vested airdrop creates claimable schedules; it does not
            immediately send the allocations to every wallet. A stream also
            requires recipient claims. Neither mode automatically pushes
            payments over time.
          </p>
        </section>

        <section id="timing">
          <h2>How release timing works</h2>
          <p>
            <strong>An explicit cliff amount. A scheduled remainder.</strong>
            Nothing vests before the cliff. At the cliff, the configured cliff
            allocation becomes claimable. The remaining amount then accrues from
            the cliff to the end, rounded down to completed cadence intervals.
            The cliff amount can be zero; it is not an accrual from the earlier
            start date.
          </p>
          <p>
            For example, a 1,200-token schedule with a 300-token cliff amount
            makes 300 tokens available at the cliff. If nine days remain until
            the end, a daily cadence releases a further 100 tokens per completed
            day. With a zero cliff amount, nothing is available at the cliff
            itself. At or after the end, the entire allocation is vested,
            including any rounding remainder, unless the schedule was canceled.
            If the cliff and end are the same timestamp, the full allocation
            unlocks at that timestamp.
          </p>
          <p>From the cliff until the end, before any cancellation:</p>
          <p>
            <code
              >vested = cliffAmount + floor((amount − cliffAmount) × (floor((now
              − cliff) / interval) × interval) / (end − cliff))</code
            >
          </p>
          <p>
            The amount available to withdraw is vested tokens minus previous
            claims. Dates are stored as Unix timestamps and evaluated using the
            chain’s block timestamp. Token calculations use the token’s smallest
            units; the final unlock releases any rounding remainder. An interval
            longer than the remaining duration creates no intermediate release:
            the cliff amount unlocks at the cliff and the rest at the end.
          </p>
          <p>
            Streams use a one-second interval, a cliff equal to the start and a
            zero cliff amount. A date lock releases the full amount at its
            unlock timestamp. Neither applies a separate initial cliff payout.
          </p>
          <p>
            Amounts, dates, cadence and the cancellation setting cannot be
            edited after funding. Check every field before signing.
          </p>
        </section>

        <section id="managing">
          <h2>Claims, cancellation & transfers</h2>
          <h3>Claim as the recipient</h3>
          <p>
            Only the schedule’s current recipient can claim its unlocked
            balance. Claims require test ETH for gas. Claiming part of an
            allocation leaves the remaining schedule in place. Already claimed
            tokens cannot be claimed again.
          </p>
          <h3>Choose whether future vesting can stop</h3>
          <p>
            If cancellation was enabled at creation, only the original sender
            can cancel, including while a schedule is active. Cancellation
            freezes the vested amount at the transaction’s block time and
            immediately refunds the unvested amount to the sender. The vested
            amount minus previous claims remains available for the recipient to
            claim later. Future vesting stops; already vested rights are not
            clawed back. Before the cliff, nothing is vested and the full
            deposit is refunded. A non-cancelable schedule cannot be canceled.
          </p>
          <h3>Transfer the remaining entitlement</h3>
          <p>
            The current recipient can transfer the entire remaining claim right
            to a different wallet. The sender, dates, amount, previous claims
            and cancellation setting stay the same. The new recipient becomes
            the only wallet able to claim the remaining tokens. This is a
            transfer of rights, not an immediate payout. An unclaimed vested
            entitlement can still be transferred after cancellation. Once no
            entitlement remains, there is nothing to transfer.
          </p>
        </section>

        <section id="contracts">
          <p class="eyebrow">05 / CONTRACT VERIFICATION</p>
          <h2>Verify the deployed contracts</h2>
          <p>
            The addresses below are the same deployment configuration used by
            this app. Both contracts have source code published on the official
            testnet explorer. This guide describes the current scheduler;
            earlier deployments retain their own code and release rules.
          </p>
          <h3>Token scheduler</h3>
          <a
            :href="explorerContract(contracts.schedulerAddress)"
            target="_blank"
            rel="noopener noreferrer"
            ><code class="code-address">{{
              contracts.schedulerAddress
            }}</code></a
          >
          <h3>{{ contracts.tokenName }} · {{ contracts.tokenSymbol }}</h3>
          <a
            :href="explorerContract(contracts.testTokenAddress)"
            target="_blank"
            rel="noopener noreferrer"
            ><code class="code-address">{{
              contracts.testTokenAddress
            }}</code></a
          >
          <div class="small-table-wrap">
            <table>
              <tbody>
                <tr>
                  <th scope="row">Network</th>
                  <td>{{ network.name }}</td>
                </tr>
                <tr>
                  <th scope="row">Chain ID</th>
                  <td>{{ network.id }} · {{ network.hex }}</td>
                </tr>
                <tr>
                  <th scope="row">Gas asset</th>
                  <td>Test ETH</td>
                </tr>
                <tr>
                  <th scope="row">Public RPC</th>
                  <td>
                    <code>{{ network.rpc }}</code>
                  </td>
                </tr>
                <tr>
                  <th scope="row">Deployment date</th>
                  <td>{{ contracts.deployedAt.slice(0, 10) }} UTC</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <a
              :href="explorerContract(contracts.schedulerAddress)"
              target="_blank"
              rel="noopener noreferrer"
              >Read the scheduler on the explorer <ArrowUpRight :size="12"
            /></a>
            or download the source and deployment details below. Source
            verification shows correspondence to deployed code; it is not an
            independent security audit.
          </p>
        </section>

        <section id="security">
          <h2>Security model & limitations</h2>
          <p>
            The deployed scheduler is immutable and has no administrator,
            upgrade mechanism, pause function, protocol fee or administrator
            withdrawal path. Its deployer has no privileged access. There is no
            operator who can edit a schedule or recover tokens by overriding its
            rules.
          </p>
          <p>
            Creation, approvals, claims, cancellation and recipient transfers
            still require network gas. The absence of protocol fees does not
            mean transactions are gas-free.
          </p>
          <p>
            Use standard, fixed-balance ERC-20 test tokens. The contract checks
            exact deposit and withdrawal amounts and rejects taxed or underpaid
            transfers. Rebasing tokens, issuer freezes, blacklists, malicious
            token behavior or future token upgrades can still make funds
            inaccessible. These checks do not establish that any arbitrary token
            is safe.
          </p>
          <div class="notice info">
            This release has not been independently audited and is not ready for
            real funds. Testnet availability and token balances can change. An
            eventual production launch requires a separate security review and
            deployment decision.
          </div>
        </section>

        <section id="downloads">
          <h2>Resources & downloads</h2>
          <div class="download-grid">
            <a class="download-card" href="/documents/contracts.md" download
              ><span>Contract guide & addresses</span><Download :size="17"
            /></a>
            <a
              class="download-card"
              href="/documents/TokenSchedulesV2.sol"
              download
              ><span>Scheduler source · Solidity</span><Download :size="17"
            /></a>
            <a class="download-card" href="/documents/MockUSD.sol" download
              ><span>Test-token source · Solidity</span><Download :size="17"
            /></a>
            <a
              class="download-card"
              href="/documents/business-plan.pdf"
              download
              ><span>Business plan · PDF</span><Download :size="17"
            /></a>
            <a class="download-card" href="/documents/brand-kit.zip" download
              ><span>{{ brand.name }} brand kit</span><Download :size="17"
            /></a>
            <RouterLink class="download-card" to="/#faq"
              ><span>Common questions</span><ArrowUpRight :size="17"
            /></RouterLink>
          </div>
          <p>
            The business plan describes proposed commercial development; its
            targets are planning assumptions, not achieved results. Read the
            <RouterLink to="/legal"
              >testnet terms and privacy information</RouterLink
            >
            before using the app.
          </p>
        </section>
      </article>
    </div>
  </div>
</template>

<style scoped>
.guide-shortcuts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 28px 0 44px;
}
.guide-shortcuts a {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--surface, #fff);
  border: 1px solid var(--line, #dce1e9);
  padding: 23px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
}
.guide-shortcuts a:hover {
  border-color: var(--accent, #355dff);
}
.guide-shortcuts span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  color: var(--muted, #647184);
}
.guide-shortcuts strong {
  font-size: 15px;
  font-weight: 600;
  padding-right: 18px;
}
.guide-shortcuts svg {
  position: absolute;
  right: 20px;
  bottom: 24px;
  color: var(--accent, #355dff);
}
.docs-nav > .eyebrow {
  padding: 0 12px;
  margin-bottom: 14px;
}
.docs-content section {
  scroll-margin-top: 110px;
}
@media (max-width: 680px) {
  .guide-shortcuts {
    grid-template-columns: 1fr;
    gap: 8px;
    margin-bottom: 28px;
  }
  .guide-shortcuts a {
    padding: 18px;
    gap: 8px;
  }
  .guide-shortcuts svg {
    bottom: 20px;
  }
  .docs-nav > .eyebrow {
    display: none;
  }
}
</style>
