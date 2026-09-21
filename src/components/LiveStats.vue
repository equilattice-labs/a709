<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { RefreshCw, ArrowUpRight } from "lucide-vue-next";
import { formatUnits } from "ethers";
import { config, scheduler } from "../composables/schedules";
import { network, publicProvider } from "../composables/wallet";
const count = ref(null),
  escrow = ref(null),
  block = ref(null),
  error = ref(false),
  loading = ref(false);
let active = true,
  timer;
async function refresh() {
  if (loading.value) return;
  loading.value = true;
  error.value = false;
  try {
    const [next, held, latest] = await Promise.all([
      scheduler.nextId(),
      scheduler.totalEscrow(config.testTokenAddress),
      publicProvider.getBlockNumber(),
    ]);
    if (!active) return;
    count.value = (next - 1n).toString();
    escrow.value = formatUnits(held, config.tokenDecimals);
    block.value = latest;
  } catch {
    if (active) error.value = true;
  } finally {
    if (active) loading.value = false;
  }
}
onMounted(() => {
  refresh();
  timer = setInterval(refresh, 60000);
});
onUnmounted(() => {
  active = false;
  clearInterval(timer);
});
</script>
<template>
  <section
    class="live-stats-section"
    aria-label="Live testnet protocol activity"
  >
    <div class="container">
      <div class="live-stats-heading">
        <span class="eyebrow"><span class="status-dot" /> READ IT ONCHAIN</span
        ><span v-if="error" role="status" class="live-stats-note"
          >Live data unavailable.
          <button class="subtle-button" @click="refresh">Retry</button></span
        ><span v-else class="live-stats-note"
          >{{
            block
              ? `Testnet block ${block.toLocaleString()}`
              : "Reading the testnet…"
          }}
          <button
            class="icon-button"
            aria-label="Refresh protocol activity"
            @click="refresh"
            :disabled="loading"
          >
            <RefreshCw :size="13" :class="{ spin: loading }" /></button
        ></span>
      </div>
      <div class="live-stats-grid">
        <div>
          <strong>{{ error ? "—" : (count ?? "—") }}</strong
          ><span>Schedules created</span>
        </div>
        <div>
          <strong
            >{{ error ? "—" : (escrow ?? "—") }}<small> tUSD</small></strong
          ><span>Currently in escrow · test token only</span>
        </div>
        <div>
          <strong>0 <small>ETH</small></strong
          ><span>Protocol fee · network gas applies</span>
        </div>
        <a
          :href="`${network.explorer}/address/${config.schedulerAddress}?tab=contract`"
          target="_blank"
          rel="noopener noreferrer"
          ><span>Check the deployed rules</span
          ><span class="live-source-link"
            >Source on the explorer <ArrowUpRight :size="15" /></span
        ></a>
      </div>
      <p class="live-stats-note">
        Actual testnet activity, including development tests. These figures are
        not customers, revenue or asset value. tUSD has no monetary value.
      </p>
    </div>
  </section>
</template>
