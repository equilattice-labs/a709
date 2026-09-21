<script setup>
import { brand } from "../config/brand";
import { network } from "../composables/wallet";
</script>

<template>
  <div class="container">
    <header class="page-intro">
      <p class="eyebrow">PRODUCT TERMS / PRIVACY</p>
      <h1>Know the terms.</h1>
      <p>
        How to use this experimental release, and what information is involved
        when you do. Updated September 17, 2026.
      </p>
    </header>

    <div class="legal-summary" role="group" aria-label="Key facts">
      <div><span>Environment</span><strong>Testnet tokens only</strong></div>
      <div>
        <span>Authorization</span><strong>Your wallet, your signatures</strong>
      </div>
      <div><span>Records</span><strong>Public onchain data</strong></div>
    </div>
    <article class="legal-copy">
      <div class="notice info">
        {{ brand.name }} currently runs on {{ network.name }}. Use test tokens
        only. The contracts have not been independently audited.
      </div>

      <h2>An experimental product</h2>
      <p>
        {{ brand.name }} provides an interface for creating and managing token
        schedules on a public test network. This release is provided for
        evaluation, without a guarantee of uninterrupted access, correctness or
        token recovery. Network resets, software defects and third-party service
        failures may affect it.
      </p>
      <p>
        Test ETH and the freely mintable tUSD demonstration token have no
        monetary value. tUSD is not a dollar deposit, a backed stablecoin, a
        redemption claim or an investment. Nothing on this site promises returns
        or constitutes financial, investment or legal advice.
      </p>

      <h2>Your wallet and transactions</h2>
      <p>
        Your wallet controls transaction authorization. Check the network, token
        address, recipient, allowance, amount and timing before signing.
        Connecting a wallet does not itself transfer assets. A token approval
        grants the specified contract permission to spend tokens; funding a
        schedule is a separate transaction.
      </p>
      <p>
        The scheduler holds funded tokens under immutable rules. There is no
        administrator override or recovery function. When enabled at creation,
        the sender can cancel before or during the schedule. Cancellation stops
        future vesting and refunds the unvested amount; vested tokens remain
        claimable by the recipient after subtracting previous claims.
        Noncancelable schedules cannot be canceled. Recipient transfers move the
        remaining entitlement to the new wallet, including an unclaimed vested
        entitlement after cancellation. Transactions confirmed by the network
        cannot be reversed through this website.
      </p>
      <p>
        The testnet scheduler charges no protocol fee. Network transactions
        still require test ETH for gas. This release is not an independently
        audited production service and must not be used with real funds.
      </p>

      <h2>Public blockchain information</h2>
      <p>
        Wallet addresses, balances, allowances, schedule details and submitted
        transactions are public blockchain information. The app reads this
        information to display your workspace and transaction status. Other
        people can inspect it through the network or a block explorer. A wallet
        address is not an anonymous identity guarantee.
      </p>
      <p>
        The app does not ask for your seed phrase or private key. Wallet
        approval and signing take place in your wallet. Disconnecting the
        interface does not revoke existing token allowances or remove records
        from the blockchain; use your wallet’s tools to manage permissions.
      </p>

      <h2>Browser data and external services</h2>
      <p>
        This version does not include application analytics, advertising
        trackers, an email signup database or a user-account system. The
        connected-wallet state is used in the browser to operate the interface.
        Your wallet manages its own account access, permissions and storage.
      </p>
      <p>
        The site uses a public RPC endpoint to read blockchain data and submit
        wallet-authorized transactions. RPC providers may receive your IP
        address, requested wallet addresses and other request metadata. Site
        hosting, wallet providers, the external block explorer and faucet may
        also process technical information under their own policies.
      </p>
      <p>
        External links open services with their own privacy practices;
        {{ brand.name }} does not control those services. This interface uses
        self-hosted Manrope with a system-font fallback and does not request
        fonts from a third-party font provider.
      </p>

      <h2>An independent project</h2>
      <p>
        {{ brand.name }} is an independent project built for Robinhood Chain. It
        is not affiliated with, sponsored by or endorsed by Robinhood. Network
        and third-party names identify compatible infrastructure; they do not
        imply a partnership.
      </p>
      <p>
        The business plan includes future product ideas and planning
        assumptions. It does not establish current customers, revenues, security
        certification or a commitment to launch a financial product.
      </p>

      <h2>Read the rules before you sign</h2>
      <p>
        The
        <RouterLink class="inline-link" to="/docs">handbook</RouterLink>
        explains the four flows, exact release rules, permissions and deployed
        contract addresses. Consult it before creating a schedule. These pages
        may change as the testnet product evolves; the deployed contract’s rules
        remain those of its published code.
      </p>
    </article>
  </div>
</template>

<style scoped>
.legal-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border: 1px solid var(--line, #dce1e9);
  border-radius: 10px;
  overflow: hidden;
  background: var(--surface, #fff);
  margin: 28px 0 36px;
}
.legal-summary > div {
  padding: 22px;
  border-right: 1px solid var(--line, #dce1e9);
}
.legal-summary > div:last-child {
  border-right: 0;
}
.legal-summary span {
  display: block;
  font-size: 11px;
  color: var(--muted, #647184);
  margin-bottom: 9px;
}
.legal-summary strong {
  font-size: 14px;
  font-weight: 600;
}
@media (max-width: 680px) {
  .legal-summary {
    grid-template-columns: 1fr;
  }
  .legal-summary > div {
    padding: 17px 20px;
    border-right: 0;
    border-bottom: 1px solid var(--line, #dce1e9);
  }
  .legal-summary > div:last-child {
    border-bottom: 0;
  }
}
</style>
