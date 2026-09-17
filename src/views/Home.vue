<script setup>
import { ref } from 'vue'
import { ArrowUpRight, ArrowRight, Plus, Check, ShieldCheck, Timer, LockKeyhole, Waves, Layers3, MoveUpRight } from 'lucide-vue-next'
import BrandMark from '../components/BrandMark.vue'
import FlowChart from '../components/FlowChart.vue'
import { brand } from '../config/brand'
const activeMode = ref('vesting')
function tabKey(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const current = products.findIndex(product => product.id === activeMode.value)
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? products.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + products.length) % products.length
  activeMode.value = products[next].id
  document.getElementById(`tab-${activeMode.value}`)?.focus()
}
const products = [
  { id: 'vesting', index: '01', title: 'Grow together.', name: 'Token vesting', icon: Timer, description: 'Give long-term believers a timeline they can believe in. Set a cliff, choose a cadence, and let commitment compound.', tag: 'TEAMS & CONTRIBUTORS', example: 'One team. A shared horizon.' },
  { id: 'lock', index: '02', title: 'Make time count.', name: 'Token locks', icon: LockKeyhole, description: 'Some things are worth waiting for. Keep tokens locked until one exact date, with the terms visible to everyone.', tag: 'TREASURIES & RESERVES', example: 'Set the date. Keep the promise.' },
  { id: 'stream', index: '03', title: 'Find your flow.', name: 'Payment streams', icon: Waves, description: 'Work happens every day. Payments can, too. Let a funded balance accrue by the second, ready whenever it’s claimed.', tag: 'PAYROLL & GRANTS', example: 'Good work deserves a steady flow.' },
  { id: 'airdrop', index: '04', title: 'Bring everyone.', name: 'Vested airdrops', icon: Layers3, description: 'A hundred wallets. One shared timeline. Distribute individual allocations in a single batch and build a community that stays.', tag: 'COMMUNITIES & ECOSYSTEMS', example: 'Many people. One beginning.' },
]
const faqs = [
  ['What is Vestlyr?', 'Vestlyr is a token scheduling protocol on Robinhood Chain Testnet. Create token vesting schedules, date locks, per-second payment streams, or batch distributions. Funds are held by a non-upgradeable smart contract and recipients claim according to its rules.'],
  ['Who controls the tokens?', 'The contract holds funded tokens. Recipients can claim unlocked amounts, and creators can cancel only before a schedule starts if cancellation was enabled when creating it. There is no administrator withdrawal function. This does not eliminate smart-contract or token risk.'],
  ['What does it cost?', 'The testnet deployment has no protocol fees. Creation, token approvals and claims require testnet ETH for network gas. Test tokens have no monetary value. Any future paid workspace would be a separate product with its own published pricing.'],
  ['Can I change a schedule later?', 'Amounts and timing cannot be edited after funding. If enabled, the creator can cancel before the start time and recover the deposit. Once the schedule starts, cancellation is unavailable. Recipients can transfer their claim rights to another wallet.'],
  ['Is this ready for real funds?', 'This release is a testnet pilot, not an independently audited production release. Use test tokens only. Production availability depends on independent security review, operational readiness, and clear token support.'],
]
</script>
<template>
  <section class="hero">
    <div class="container hero-grid">
      <div class="hero-copy">
        <div class="hero-eyebrow"><span class="status-dot"/> A NEW CHAPTER FOR ONCHAIN COMMITMENTS</div>
        <h1>Good things.<br><span>On schedule.</span></h1>
        <p>From the first believer to the next big milestone.<br class="desktop-break"> Give your tokens a timeline. And your people<br class="desktop-break"> something to count on.</p>
        <div class="hero-buttons"><RouterLink to="/create" class="button button-lime">Create a schedule <ArrowUpRight :size="18"/></RouterLink><RouterLink to="/#products" class="text-button">Find your flow <ArrowRight :size="17"/></RouterLink></div>
        <div class="hero-assurance"><span><ShieldCheck :size="15"/> Non-custodial by design</span><span class="tiny-separator"/><span>Built on Robinhood Chain</span></div>
      </div>
      <div class="hero-art">
        <div class="orbital-guide guide-one"/><div class="orbital-guide guide-two"/>
        <div class="art-top-label"><span class="mini-cross">+</span> VALUE, WITH A SENSE OF DIRECTION <span class="mini-cross">+</span></div>
        <img src="/brand/hero-sculpture.webp" width="1328" height="1115" class="hero-sculpture" alt="A luminous lime ribbon rising through an open loop, a symbol of value moving through time" fetchpriority="high"/>
        <div class="floating-label label-commit"><span class="small-icon"><LockKeyhole :size="15"/></span><div><span class="float-caption">THE COMMITMENT</span><strong>Set in motion.</strong></div><Check :size="15" class="lime-text"/></div>
        <div class="floating-label label-flow"><span class="pulsing-ring"/><div><span class="float-caption">THE POSSIBILITY</span><strong>Always moving forward.</strong></div></div>
        <div class="art-bottom-label"><span>01 — FUND</span><span class="dotted-line"/><span>02 — FLOW</span><span class="dotted-line"/><span>03 — GROW</span></div>
      </div>
    </div>
    <div class="hero-bottom container"><p>Less coordination.<br><strong>More conviction.</strong></p><div><span>04</span><p>ways to<br>move value</p></div><div><span>0</span><p>protocol fees<br>on testnet</p></div><div><span>100%</span><p>of the schedule<br>visible onchain</p></div><RouterLink to="/docs" class="hero-bottom-link">Get to know the protocol <ArrowUpRight :size="19"/></RouterLink></div>
  </section>
  <div class="principles-strip"><div class="container"><span><span class="small-star">✳</span> YOUR TOKENS. YOUR TIMELINE.</span><span>NO INTERMEDIARIES</span><span>NO MOVING GOALPOSTS</span><span>JUST THE COMMITMENT</span><span class="small-star">✳</span></div></div>
  <section id="products" class="products-section section-space">
    <div class="container">
      <div class="section-heading"><div><p class="eyebrow"><span class="section-index">01 /</span> THE PROTOCOL</p><h2>Every promise has<br>its own <span class="serif-word">pace.</span></h2></div><p>One simple foundation. Four ways to put it to work.<br>Choose the rhythm that fits what you’re building.</p></div>
      <div class="product-tabs" role="tablist" aria-label="Schedule types" @keydown="tabKey"><button v-for="product in products" :id="`tab-${product.id}`" :key="product.id" role="tab" :aria-selected="activeMode === product.id" :tabindex="activeMode === product.id ? 0 : -1" aria-controls="product-panel" :class="{ active: activeMode === product.id }" @click="activeMode = product.id"><component :is="product.icon" :size="19"/><span>{{ product.name }}</span><span class="tab-index">{{ product.index }}</span></button></div>
      <template v-for="product in products" :key="product.id"><div v-if="activeMode === product.id" id="product-panel" class="product-detail" role="tabpanel" tabindex="0" :aria-labelledby="`tab-${product.id}`">
        <div class="product-copy"><p class="eyebrow muted">{{ product.tag }}</p><h3>{{ product.title }}</h3><p>{{ product.description }}</p><RouterLink :to="`/create?mode=${product.id}`" class="button button-dark">Explore {{ product.name.toLowerCase() }} <ArrowUpRight :size="17"/></RouterLink><span class="product-bottom-note"><Check :size="14"/> Transparent terms from day one.</span></div>
        <div class="product-illustration"><div class="schedule-mock"><div class="mock-top"><span class="mock-icon"><component :is="product.icon" :size="19"/></span><div><strong>{{ product.name }}</strong><span>YOUR NEXT CHAPTER</span></div><span class="mock-pill">Illustration</span></div><div class="mock-amount">100,000<span>tokens</span></div><FlowChart :mode="product.id"/><div class="mock-bottom"><span>{{ product.id === 'lock' ? 'One unlock date' : product.id === 'stream' ? 'Every second counts' : 'A clear path ahead' }}</span><span>Built for the long run <MoveUpRight :size="12"/></span></div></div><span class="product-art-note">{{ product.example }}</span></div>
      </div></template>
    </div>
  </section>
  <section id="how-it-works" class="how-section section-space"><div class="container"><div class="section-heading"><div><p class="eyebrow"><span class="section-index">02 /</span> FROM INTENT TO IMPACT</p><h2>A little setup.<br>A lot of <span class="serif-word">follow-through.</span></h2></div><RouterLink to="/docs" class="text-button dark-text">The complete field guide <ArrowUpRight :size="17"/></RouterLink></div><div class="steps-grid"><article><div class="step-top"><span>01</span><div class="step-drawing wallet-drawing"><div/><div/><Plus :size="17"/></div></div><h3>Make the connection.</h3><p>Bring your EVM wallet. Switch to Robinhood Chain Testnet and choose the token you want to put to work.</p></article><article><div class="step-top"><span>02</span><div class="step-drawing timeline-drawing"><i/><i/><i/><i/><i/></div></div><h3>Give it a timeline.</h3><p>Set the people, the amount and the rhythm. Preview every detail, approve the tokens, then fund your schedule.</p></article><article><div class="step-top"><span>03</span><div class="step-drawing grow-drawing"><ArrowUpRight :size="46"/></div></div><h3>Let the good things flow.</h3><p>Recipients claim as tokens unlock. Every schedule is readable onchain. No follow-up email required.</p></article></div></div></section>
  <section class="trust-section"><div class="container trust-grid"><div class="trust-symbol"><BrandMark icon-only/><div class="trust-orbit"/><span class="orbit-point"/></div><div><p class="eyebrow">BUILT AROUND THE COMMITMENT</p><h2>Trust the terms.<br><span>Verify everything.</span></h2><p>Your timeline belongs to the contract. No admin wallet can rewrite it, upgrade its logic or withdraw the escrow.</p><div class="trust-checks"><span><Check :size="17"/> Non-upgradeable contracts</span><span><Check :size="17"/> Exact token accounting</span><span><Check :size="17"/> Onchain claim history</span><span><Check :size="17"/> Wallet-to-wallet ownership</span></div><RouterLink to="/docs#security" class="text-button">Understand the mechanics <ArrowUpRight :size="16"/></RouterLink><p class="trust-disclaimer">Testnet release. Independent audit pending. Use test tokens only.</p></div></div></section>
  <section id="pricing" class="pricing-section section-space"><div class="container pricing-grid"><div><p class="eyebrow"><span class="section-index">03 /</span> ROOM TO EXPERIMENT</p><h2>Big ideas.<br><span class="serif-word">Small beginnings.</span></h2><p>Explore the whole protocol on testnet.<br>The only thing between you and your first schedule<br class="desktop-break"> is a little testnet gas.</p><a href="https://faucet.testnet.chain.robinhood.com" class="text-button dark-text" target="_blank" rel="noopener noreferrer">Get testnet ETH <ArrowUpRight :size="16"/></a></div><div class="pricing-card"><div class="pricing-title"><span>THE TESTNET EDITION</span><span class="badge">OPEN TO EVERYONE</span></div><div class="price">0 <span>protocol fees</span></div><p>All four schedule types. No subscription.</p><div class="price-divider"/><ul><li><Check :size="17"/> Create, claim and manage your schedules</li><li><Check :size="17"/> Batch up to 100 recipients</li><li><Check :size="17"/> Read every commitment onchain</li></ul><RouterLink to="/create" class="button button-dark full-width">Try your first schedule <ArrowUpRight :size="17"/></RouterLink><small>Network gas applies. Test tokens have no monetary value.</small></div></div></section>
  <section id="faq" class="faq-section section-space"><div class="container faq-grid"><div><p class="eyebrow"><span class="section-index">04 /</span> A FEW THINGS TO KNOW</p><h2>Clear terms.<br><span class="serif-word">Clear answers.</span></h2><p>Good commitments start with<br>the right questions.</p></div><div class="faq-list"><details v-for="(faq, index) in faqs" :key="faq[0]"><summary><span class="faq-number">0{{ index + 1 }}</span>{{ faq[0] }}<Plus :size="18"/></summary><p>{{ faq[1] }}</p></details></div></div></section>
  <section class="closing-section"><div class="container closing-inner"><p class="eyebrow">THE FUTURE DOESN’T BUILD ITSELF.</p><h2>Put your next chapter<br><span>in motion.</span></h2><RouterLink to="/create" class="button button-lime">Create a schedule <ArrowUpRight :size="18"/></RouterLink><div class="closing-line"><span/><BrandMark icon-only/><span/></div></div></section>
</template>
