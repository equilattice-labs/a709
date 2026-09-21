<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import {
  ArrowUpRight,
  Menu,
  X,
  LayoutDashboard,
  Plus,
  Layers3,
  BookOpen,
  ExternalLink,
  Wallet,
  Radio,
} from "lucide-vue-next";
import BrandMark from "./components/BrandMark.vue";
import WalletModal from "./components/WalletModal.vue";
import { brand } from "./config/brand";
import {
  wallet,
  shortAddress,
  discoverWallets,
  network,
} from "./composables/wallet";
const route = useRoute(),
  menu = ref(false);
const pageName = computed(() =>
  route.path === "/"
    ? "Overview"
    : route.path === "/create"
      ? "New schedule"
      : route.path.startsWith("/lock/")
        ? "Schedule details"
        : route.path === "/locks"
          ? "My schedules"
          : route.path === "/docs"
            ? "Documentation"
            : "Terms & privacy",
);
const links = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/create", label: "Create schedule", icon: Plus },
  { path: "/locks", label: "My schedules", icon: Layers3 },
  { path: "/docs", label: "Documentation", icon: BookOpen },
];
onMounted(discoverWallets);
watch(
  () => route.fullPath,
  () => {
    menu.value = false;
  },
);
</script>
<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="app-shell" @keydown.esc="menu = false">
    <button
      v-if="menu"
      class="nav-scrim"
      aria-label="Close navigation"
      @click="menu = false"
    />
    <aside class="side-rail" :class="{ 'is-open': menu }" id="main-navigation">
      <RouterLink to="/" class="brand-home" :aria-label="`${brand.name} home`"
        ><BrandMark
      /></RouterLink>
      <div class="rail-caption">THE TIME LAYER</div>
      <nav class="rail-nav" aria-label="Main navigation">
        <RouterLink
          v-for="link in links"
          :key="link.path"
          :to="link.path"
          :class="{
            selected:
              link.path === '/'
                ? route.path === '/'
                : route.path.startsWith(link.path),
          }"
          ><component :is="link.icon" :size="18" /><span>{{ link.label }}</span
          ><span v-if="link.path === '/create'" class="nav-plus"
            >+</span
          ></RouterLink
        >
      </nav>
      <div class="rail-bottom">
        <div class="rail-note">
          <span class="rail-note-index">01 — GET STARTED</span>
          <p>A clear path from<br />funding to the final claim.</p>
          <RouterLink to="/docs#getting-started"
            >Read the quick start <ArrowUpRight :size="15"
          /></RouterLink>
        </div>
        <a
          :href="network.explorer"
          target="_blank"
          rel="noopener noreferrer"
          class="rail-external"
          >Chain explorer <ExternalLink :size="14"
        /></a>
        <a href="/documents/brand-kit.zip" download class="rail-external"
          >Brand assets <ArrowUpRight :size="14"
        /></a>
        <div class="rail-network">
          <span class="status-dot" /><span
            >Robinhood Chain<small>TESTNET · 46630</small></span
          ><Radio :size="16" />
        </div>
      </div>
    </aside>
    <div class="main-shell">
      <header class="workspace-header">
        <div class="header-location">
          <button
            class="icon-button mobile-menu"
            :aria-expanded="menu"
            aria-controls="main-navigation"
            :aria-label="menu ? 'Close menu' : 'Open menu'"
            @click="menu = !menu"
          >
            <X v-if="menu" :size="20" /><Menu v-else :size="20" /></button
          ><span class="location-brand">{{ brand.name }}</span
          ><span class="breadcrumb-slash">/</span><span>{{ pageName }}</span>
        </div>
        <div class="header-actions">
          <span class="testnet-pill"><span class="status-dot" /> Testnet</span
          ><button
            class="button wallet-button"
            @click="
              wallet.error = '';
              wallet.show = true;
            "
          >
            <Wallet :size="16" /><span>{{
              wallet.address ? shortAddress(wallet.address) : "Connect wallet"
            }}</span>
          </button>
        </div>
      </header>
      <main id="main-content" tabindex="-1"><RouterView /></main>
      <footer class="site-footer">
        <div>
          <BrandMark icon-only /><span
            >{{ brand.name }} © {{ new Date().getFullYear() }}</span
          ><span class="footer-separator">/</span
          ><span>Value, on your terms.</span>
        </div>
        <div>
          <RouterLink to="/legal"
            >Terms & privacy <ArrowUpRight :size="12" /></RouterLink
          ><span>Independent of Robinhood.</span>
        </div>
      </footer>
    </div>
    <WalletModal />
  </div>
</template>
