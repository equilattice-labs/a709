<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowUpRight, Menu, X, ArrowRight } from 'lucide-vue-next'
import BrandMark from './components/BrandMark.vue'
import WalletModal from './components/WalletModal.vue'
import { brand } from './config/brand'
import { wallet, shortAddress, discoverWallets, network } from './composables/wallet'
const route = useRoute(), menu = ref(false)
onMounted(discoverWallets)
watch(() => route.fullPath, () => { menu.value = false })
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="announcement">A little more certainty. Now on Robinhood Chain Testnet. <RouterLink to="/docs">Meet {{ brand.name }} <ArrowUpRight :size="12"/></RouterLink></div>
  <header class="site-header" :class="{ 'home-header': route.path === '/' }">
    <div class="header-inner container">
      <RouterLink to="/" class="brand-home" :aria-label="`${brand.name} home`"><BrandMark/></RouterLink>
      <nav class="desktop-nav" aria-label="Main navigation"><RouterLink to="/#products">The protocol</RouterLink><RouterLink to="/#how-it-works">How it works</RouterLink><RouterLink to="/docs">Resources <ArrowUpRight :size="12"/></RouterLink></nav>
      <div class="header-actions"><RouterLink to="/locks" class="workspace-link">Workspace</RouterLink><button class="button wallet-button" @click="wallet.error = ''; wallet.show = true"><span class="status-dot" v-if="wallet.address"/>{{ wallet.address ? shortAddress(wallet.address) : 'Connect wallet' }}<ArrowUpRight :size="15"/></button><button class="icon-button mobile-menu" :aria-expanded="menu" aria-controls="mobile-nav" :aria-label="menu ? 'Close menu' : 'Open menu'" @click="menu = !menu"><X v-if="menu"/><Menu v-else/></button></div>
    </div>
    <nav v-if="menu" id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation"><RouterLink to="/#products">The protocol</RouterLink><RouterLink to="/#how-it-works">How it works</RouterLink><RouterLink to="/locks">Workspace</RouterLink><RouterLink to="/docs">Resources</RouterLink></nav>
  </header>
  <main id="main-content"><RouterView/></main>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-brand"><RouterLink to="/" :aria-label="`${brand.name} home`"><BrandMark/></RouterLink><p>Keep your commitments.<br>Let the schedule do the rest.</p><span class="network-tag"><span class="status-dot"/> Robinhood Chain Testnet</span></div>
      <div><h3>Make it happen</h3><RouterLink to="/create">Create a schedule <ArrowUpRight :size="13"/></RouterLink><RouterLink to="/locks">Your workspace</RouterLink><RouterLink to="/#products">Explore the protocol</RouterLink></div>
      <div><h3>Get acquainted</h3><RouterLink to="/docs">Documentation</RouterLink><a href="/documents/business-plan.pdf" download>Business plan <ArrowUpRight :size="13"/></a><RouterLink to="/#faq">Common questions</RouterLink></div>
      <div><h3>Out in the open</h3><a :href="network.explorer" target="_blank" rel="noopener noreferrer">Chain explorer <ArrowUpRight :size="13"/></a><a :href="network.faucet" target="_blank" rel="noopener noreferrer">Testnet faucet <ArrowUpRight :size="13"/></a><a href="/documents/brand-kit.zip" download>Brand kit <ArrowUpRight :size="13"/></a></div>
    </div>
    <div class="container footer-bottom"><span>© {{ new Date().getFullYear() }} {{ brand.name }}. Built for the long run.</span><span>Independent project. Not affiliated with Robinhood.</span><RouterLink to="/legal">Terms & privacy</RouterLink></div>
  </footer>
  <WalletModal/>
</template>
