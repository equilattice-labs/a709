<script setup>
import { ref, watch, nextTick } from "vue";
import { X, ArrowUpRight, Wallet, Copy, LogOut, Check } from "lucide-vue-next";
import {
  wallet,
  connectWallet,
  disconnectWallet,
  shortAddress,
  network,
  ensureNetwork,
  readableError,
} from "../composables/wallet";
const dialog = ref(null),
  copied = ref(false),
  switching = ref(false);
let previousFocus;
watch(
  () => wallet.address,
  () => {
    copied.value = false;
  },
);
watch(
  () => wallet.show,
  async (open) => {
    if (open) {
      copied.value = false;
      previousFocus = document.activeElement;
      await nextTick();
      dialog.value?.showModal();
    } else {
      dialog.value?.close();
      previousFocus?.focus?.();
    }
  },
);
async function copy() {
  try {
    await navigator.clipboard.writeText(wallet.address);
    copied.value = true;
  } catch {
    wallet.error =
      "Copy is unavailable in this browser. Select the address below to copy it.";
  }
}
async function switchNetwork() {
  if (switching.value) return;
  switching.value = true;
  try {
    await ensureNetwork();
  } catch (e) {
    wallet.error = readableError(e);
  } finally {
    switching.value = false;
  }
}
</script>
<template>
  <dialog
    ref="dialog"
    class="wallet-dialog"
    aria-labelledby="wallet-title"
    @close="wallet.show = false"
    @click="
      (e) => {
        if (e.target === dialog) wallet.show = false;
      }
    "
  >
    <div class="modal-top">
      <span class="eyebrow">WALLET ACCESS</span
      ><button
        class="icon-button"
        aria-label="Close wallet dialog"
        @click="wallet.show = false"
      >
        <X :size="20" />
      </button>
    </div>
    <Wallet class="modal-wallet-icon" :size="32" />
    <h2 id="wallet-title">
      {{ wallet.address ? "Wallet connected" : "Connect your wallet" }}
    </h2>
    <p class="muted">
      {{
        wallet.address
          ? "Your wallet is your account. You control every transaction."
          : "Choose your EVM wallet to fund schedules, claim tokens, or manage your allocations."
      }}
    </p>
    <template v-if="wallet.address">
      <div class="connected-address">
        <code>{{ wallet.address }}</code
        ><button
          class="icon-button"
          @click="copy"
          :aria-label="copied ? 'Address copied' : 'Copy wallet address'"
        >
          <Check v-if="copied" :size="18" /><Copy v-else :size="18" />
        </button>
      </div>
      <button
        v-if="wallet.chainId !== network.id"
        class="button button-dark full-width"
        :disabled="switching"
        @click="switchNetwork"
      >
        {{
          switching ? "Waiting for your wallet…" : "Switch to Robinhood testnet"
        }}
        <ArrowUpRight :size="17" />
      </button>
      <p v-else class="connection-status">
        <span class="status-dot" /> Robinhood Chain Testnet
      </p>
      <button
        class="button button-outline full-width"
        @click="disconnectWallet"
      >
        <LogOut :size="16" /> Disconnect
      </button>
    </template>
    <template v-else>
      <div class="wallet-connection-steps">
        <span><b>01</b> Choose wallet</span
        ><span><b>02</b> Approve connection</span>
      </div>
      <div class="wallet-options" v-if="wallet.providers.length">
        <button
          v-for="provider in wallet.providers"
          :key="provider.id"
          class="wallet-option"
          :disabled="wallet.connecting"
          @click="connectWallet(provider)"
        >
          <span>{{ provider.name }}</span
          ><span>{{ wallet.connecting ? "Connecting…" : "Connect ↗" }}</span>
        </button>
      </div>
      <div v-else class="wallet-empty">
        <strong>No browser wallet detected</strong>
        <p>Install an EVM wallet extension, then reload this page.</p>
        <a
          class="button button-dark full-width"
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          >Get MetaMask <ArrowUpRight :size="17"
        /></a>
        <p class="small muted">
          On mobile, open this website inside your wallet’s browser.
        </p>
      </div>
    </template>
    <p v-if="wallet.error" role="alert" class="notice error">
      {{ wallet.error }}
    </p>
    <p class="modal-foot">Testnet only · Connecting does not move funds.</p>
  </dialog>
</template>

<style scoped>
.wallet-connection-steps {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 17px 0 22px;
  font-size: 11px;
  color: var(--muted, #647184);
}
.wallet-connection-steps span {
  display: flex;
  align-items: center;
  gap: 7px;
}
.wallet-connection-steps b {
  display: inline-grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border-radius: 6px;
  color: var(--accent, #355dff);
  background: var(--brand-soft, #e9eeff);
  font-size: 10px;
}
</style>
