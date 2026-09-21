<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { brand } from "../config/brand";
import {
  Wallet,
  ArrowUpRight,
  Plus,
  RefreshCw,
  Layers3,
  LoaderCircle,
  Download,
} from "lucide-vue-next";
import { formatUnits } from "ethers";
import {
  wallet,
  network,
  shortAddress,
  readableError,
  ensureNetwork,
  publicProvider,
} from "../composables/wallet";
import {
  loadSchedules,
  scheduler,
  modeNames,
  dateLabel,
  validRecipient,
  waitForTransaction,
} from "../composables/schedules";
const router = useRouter();
const search = ref(""),
  statusFilter = ref("all"),
  lookupId = ref(""),
  lookupError = ref("");
function openSchedule() {
  const value = lookupId.value.trim().replace(/^#/, "");
  if (!/^[1-9]\d*$/.test(value) || BigInt(value) >= 2n ** 256n) {
    lookupError.value = "Enter a positive schedule ID, such as 12.";
    return;
  }
  lookupError.value = "";
  router.push(`/lock/${value}`);
}
const route = useRoute(),
  role = ref(route.query.role === "sent" ? "sent" : "received"),
  loading = ref(false),
  error = ref(""),
  records = ref([]),
  total = ref(0),
  page = ref(0),
  currentTime = ref(Math.floor(Date.now() / 1000)),
  lastRead = ref("");
const actionId = ref(""),
  actionType = ref(""),
  actionMessage = ref(""),
  actionHash = ref(""),
  transferAddresses = ref({}),
  cancelledConfirmation = ref(null),
  transferredConfirmation = ref(null);
let generation = 0;
let actionGeneration = 0;
let unmounted = false;
const pageSize = 12;
const visibleRecords = computed(() => {
  const query = search.value.trim().toLowerCase().replace(/^#/, "");
  return records.value.filter((record) => {
    const matchesText =
      !query ||
      [
        record.id,
        record.token.symbol,
        record.token.address,
        record.sender,
        record.recipient,
        modeNames[record.kind],
      ].some((value) => String(value).toLowerCase().includes(query));
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "claimable" && record.claimable > 0n) ||
      (statusFilter.value === "cancelled" && record.cancelled) ||
      (statusFilter.value === "active" &&
        !record.cancelled &&
        record.claimed < record.amount);
    return matchesText && matchesStatus;
  });
});
const claimableCount = computed(
  () => records.value.filter((record) => record.claimable > 0n).length,
);
function clearFilters() {
  search.value = "";
  statusFilter.value = "all";
}
const pageCount = computed(() => Math.ceil(total.value / pageSize));
const amountLabel = (amount, token) =>
  token.decimals === null
    ? `${amount.toString()} base units`
    : Number(formatUnits(amount, token.decimals)).toLocaleString("en-US", {
        maximumFractionDigits: 6,
      });
const isRecipient = (record) =>
  record.recipient.toLowerCase() === wallet.address.toLowerCase();
const isSender = (record) =>
  record.sender.toLowerCase() === wallet.address.toLowerCase();
const canCancel = (record) =>
  isSender(record) &&
  record.cancelable &&
  !record.cancelled &&
  record.claimed < record.amount;
function status(record) {
  if (record.cancelled)
    return record.claimable > 0n
      ? "Cancelled · claim available"
      : "Cancelled · settled";
  if (record.claimed >= record.amount) return "Fully claimed";
  if (currentTime.value < record.start) return "Scheduled";
  if (currentTime.value >= record.end) return "Fully unlocked";
  if (currentTime.value < record.cliff) return "Before cliff";
  return "In motion";
}
const progress = (record) =>
  Number(((record.claimed + record.claimable) * 10000n) / record.amount) / 100;
async function refresh(silent = false) {
  const requestId = ++generation;
  if (!wallet.address) {
    records.value = [];
    total.value = 0;
    return;
  }
  if (!silent) loading.value = true;
  error.value = "";
  const address = wallet.address;
  try {
    const [result, block] = await Promise.all([
      loadSchedules(address, role.value, page.value * pageSize, pageSize),
      publicProvider.getBlock("latest"),
    ]);
    if (requestId !== generation || address !== wallet.address) return;
    records.value = result.records;
    total.value = result.total;
    currentTime.value = block.timestamp;
    lastRead.value = new Date().toLocaleTimeString("en-GB");
  } catch (e) {
    if (requestId === generation)
      error.value = `Could not read your schedules. ${readableError(e)}`;
  } finally {
    if (requestId === generation) loading.value = false;
  }
}
watch(
  [() => wallet.address, role],
  () => {
    page.value = 0;
    clearFilters();
    records.value = [];
    cancelledConfirmation.value = null;
    transferredConfirmation.value = null;
    refresh();
  },
  { immediate: true },
);
watch(page, () => refresh());
watch(
  () => wallet.address,
  () => {
    actionGeneration++;
    actionId.value = "";
    actionType.value = "";
    actionMessage.value = "";
    actionHash.value = "";
    cancelledConfirmation.value = null;
    transferredConfirmation.value = null;
  },
  { flush: "sync" },
);
watch(
  () => route.query.role,
  (value) => {
    if (value === "sent" || value === "received") role.value = value;
  },
);
const timer = setInterval(() => {
  if (wallet.address && !loading.value && !actionId.value) refresh(true);
}, 20000);
onUnmounted(() => {
  clearInterval(timer);
  generation++;
  actionGeneration++;
  unmounted = true;
});
async function act(record, type) {
  if (actionId.value || unmounted) return;
  if (!wallet.address) {
    wallet.show = true;
    return;
  }
  const originalAddress = wallet.address;
  const currentId = record.id;
  const currentRecipient = record.recipient;
  const target = transferAddresses.value[currentId]?.trim() || "";
  const operation = ++actionGeneration;
  const isCurrent = () =>
    !unmounted &&
    operation === actionGeneration &&
    originalAddress.toLowerCase() === wallet.address.toLowerCase();
  const assertCurrent = () => {
    if (!isCurrent())
      throw new Error("Your wallet changed. Refresh before continuing.");
  };
  error.value = "";
  actionId.value = currentId;
  actionType.value = type;
  actionHash.value = "";
  actionMessage.value = "Confirm the request in your wallet…";
  try {
    if (
      type === "transfer" &&
      (!validRecipient(target) ||
        target.toLowerCase() === currentRecipient.toLowerCase())
    )
      throw new Error("Enter a different valid recipient wallet address.");
    const signer = await ensureNetwork();
    assertCurrent();
    if (
      (await signer.getAddress()).toLowerCase() !==
      originalAddress.toLowerCase()
    )
      throw new Error("Your wallet changed. Refresh before continuing.");
    assertCurrent();
    const contract = scheduler.connect(signer);
    const method =
      type === "claim"
        ? contract.claim
        : type === "cancel"
          ? contract.cancel
          : contract.transferRecipient;
    const args = type === "transfer" ? [currentId, target] : [currentId];
    await method.staticCall(...args);
    assertCurrent();
    const tx = await method(...args, { chainId: network.id });
    if (isCurrent()) {
      actionHash.value = tx.hash;
      actionMessage.value = "Transaction submitted. Waiting for confirmation…";
    }
    const receipt = await waitForTransaction(tx);
    if (!isCurrent()) return;
    actionHash.value = receipt.hash;
    actionMessage.value =
      type === "claim"
        ? "Tokens claimed to your wallet."
        : type === "cancel"
          ? "Schedule cancelled. Unvested tokens returned to the creator; vested tokens remain claimable by the recipient."
          : "Claim rights transferred to the new wallet.";
    cancelledConfirmation.value = null;
    transferredConfirmation.value = null;
    await refresh(true);
  } catch (e) {
    if (isCurrent()) {
      error.value = readableError(e);
      actionMessage.value =
        "The action was not completed. Check the message and try again.";
    }
  } finally {
    if (isCurrent()) actionId.value = "";
  }
}
function exportCsv() {
  const rows = [
    [
      "id",
      "type",
      "token",
      "sender",
      "recipient",
      "amount_base_units",
      "claimed_base_units",
      "claimable_base_units",
      "start_utc",
      "cliff_utc",
      "end_utc",
      "cliff_amount_base_units",
      "refunded_base_units",
      "vested_at_cancel_base_units",
      "cancelled_at_utc",
      "cancelable",
      "status",
    ],
    ...records.value.map((r) => [
      r.id,
      modeNames[r.kind],
      r.token.address,
      r.sender,
      r.recipient,
      r.amount.toString(),
      r.claimed.toString(),
      r.claimable.toString(),
      new Date(r.start * 1000).toISOString(),
      new Date(r.cliff * 1000).toISOString(),
      new Date(r.end * 1000).toISOString(),
      r.cliffAmount.toString(),
      r.refunded.toString(),
      r.vestedAtCancel.toString(),
      r.cancelledAt ? new Date(r.cancelledAt * 1000).toISOString() : "",
      r.cancelable,
      status(r),
    ]),
  ];
  const blob = new Blob(
    [
      rows
        .map((row) =>
          row
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(","),
        )
        .join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = `${brand.handle}-${role.value}-page-${page.value + 1}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
</script>
<template>
  <div class="container workspace-section">
    <div class="page-intro">
      <p class="eyebrow">DISTRIBUTION WORKSPACE</p>
      <h1>Your schedules.</h1>
      <p>
        Track funded allocations, collect available tokens, and manage each
        release from one workspace.
      </p>
    </div>
    <form class="schedule-lookup" @submit.prevent="openSchedule">
      <div>
        <strong>Have a schedule ID?</strong
        ><span>Open any public schedule without connecting a wallet.</span>
      </div>
      <label class="lookup-input"
        ><span class="sr-only">Schedule ID</span
        ><input
          v-model="lookupId"
          inputmode="numeric"
          placeholder="Schedule ID, e.g. 12"
          :aria-describedby="lookupError ? 'lookup-error' : undefined"
      /></label>
      <button type="submit" class="button button-outline">
        Open schedule <ArrowUpRight :size="15" />
      </button>
      <p v-if="lookupError" id="lookup-error" class="lookup-error" role="alert">
        {{ lookupError }}
      </p>
    </form>
    <div
      v-if="wallet.address"
      class="workspace-summary"
      aria-label="Workspace overview"
    >
      <div>
        <span>{{
          role === "sent" ? "Created schedules" : "Received schedules"
        }}</span
        ><strong>{{ total }}</strong>
      </div>
      <div>
        <span>On this page</span><strong>{{ records.length }}</strong>
      </div>
      <div>
        <span>With tokens to claim · this page</span
        ><strong>{{ claimableCount }}</strong>
      </div>
    </div>
    <div class="workspace-toolbar">
      <div class="segmented" role="group" aria-label="Schedule direction">
        <button
          :class="{ active: role === 'received' }"
          :aria-pressed="role === 'received'"
          @click="role = 'received'"
        >
          Receiving</button
        ><button
          :class="{ active: role === 'sent' }"
          :aria-pressed="role === 'sent'"
          @click="role = 'sent'"
        >
          Created by me
        </button>
      </div>
      <div class="toolbar-actions">
        <button
          v-if="records.length"
          class="icon-button"
          aria-label="Export current page as CSV"
          @click="exportCsv"
        >
          <Download :size="16" /></button
        ><button
          class="icon-button"
          aria-label="Refresh schedules"
          :disabled="loading || !wallet.address"
          @click="refresh()"
        >
          <RefreshCw :size="17" :class="{ spin: loading }" /></button
        ><RouterLink to="/create" class="button button-dark"
          ><Plus :size="15" /> New schedule</RouterLink
        >
      </div>
    </div>
    <p v-if="error" class="notice error" role="alert">
      {{ error }}
      <button class="subtle-button" @click="refresh()">Retry loading</button>
    </p>
    <div v-if="actionMessage" class="notice" role="status" aria-live="polite">
      {{ actionMessage }}
      <a
        v-if="actionHash"
        :href="`${network.explorer}/tx/${actionHash}`"
        target="_blank"
        rel="noopener noreferrer"
        >View transaction ↗</a
      >
    </div>
    <div v-if="!wallet.address" class="empty-state">
      <Wallet :size="35" />
      <h2>Connect to see your schedules</h2>
      <p>
        Use the wallet that created or received an allocation. Your schedules
        and available claims are read directly from Robinhood Chain Testnet.
      </p>
      <div class="empty-workflow" role="group" aria-label="What you can do">
        <span><span>01</span> Track releases</span
        ><span><span>02</span> Claim tokens</span
        ><span><span>03</span> Manage rights</span>
      </div>
      <button class="button button-dark" @click="wallet.show = true">
        Connect your wallet <ArrowUpRight :size="16" />
      </button>
    </div>
    <div v-else-if="loading" class="loading-state" role="status">
      <LoaderCircle :size="20" class="spin" /> Reading your commitments from the
      chain…
    </div>
    <div v-else-if="!records.length && !error" class="empty-state">
      <Layers3 :size="35" />
      <h2>
        {{
          role === "received"
            ? "No received schedules yet"
            : "Create your first release"
        }}
      </h2>
      <p>
        {{
          role === "received"
            ? "Allocations sent to this wallet will appear here. You can also open a public schedule using its ID above."
            : "Choose a distribution model and fund an allocation. Every schedule you create will be tracked here."
        }}
      </p>
      <RouterLink to="/create" class="button button-dark"
        >Create your first schedule <ArrowUpRight :size="16"
      /></RouterLink>
    </div>
    <template v-else-if="records.length"
      ><p class="application-network">
        <span class="status-dot" /> Read from Robinhood Chain Testnet · Updated
        {{ lastRead }} · Refreshes every 20 seconds
      </p>
      <div class="workspace-filters">
        <label class="workspace-search"
          ><span class="sr-only">Search schedules on this page</span
          ><input
            v-model="search"
            type="search"
            placeholder="Search this page by ID, token or wallet" /></label
        ><label
          ><span class="sr-only">Filter schedules on this page</span
          ><select v-model="statusFilter">
            <option value="all">All statuses</option>
            <option value="claimable">Available to claim</option>
            <option value="active">Active schedules</option>
            <option value="cancelled">Cancelled</option>
          </select></label
        ><span
          >{{ visibleRecords.length }} of {{ records.length }} on this
          page</span
        >
      </div>
      <div v-if="!visibleRecords.length" class="empty-state filter-empty">
        <h2>No matching schedules</h2>
        <p>Search and filters apply to the current page.</p>
        <button class="button button-outline" @click="clearFilters">
          Clear filters
        </button>
      </div>
      <div class="locks-grid">
        <article
          v-for="record in visibleRecords"
          :key="record.id"
          class="lock-card"
        >
          <div class="lock-card-top">
            <span class="lock-id"
              >SCHEDULE / {{ record.id.padStart(4, "0") }}</span
            ><span class="badge">{{ status(record) }}</span>
          </div>
          <h3>
            <RouterLink :to="`/lock/${record.id}`">{{
              modeNames[record.kind]
            }}</RouterLink>
          </h3>
          <p class="lock-counterparty">
            {{ role === "sent" ? "To" : "From" }}
            <a
              :href="`${network.explorer}/address/${role === 'sent' ? record.recipient : record.sender}`"
              target="_blank"
              rel="noopener noreferrer"
              >{{
                shortAddress(role === "sent" ? record.recipient : record.sender)
              }}
              ↗</a
            >
          </p>
          <div class="lock-amount">
            {{ amountLabel(record.amount, record.token) }}
            <span>{{ record.token.symbol }}</span>
          </div>
          <div
            class="progress-track"
            role="progressbar"
            :aria-valuenow="progress(record)"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Unlocked percentage"
          >
            <div
              class="progress-fill"
              :style="{ width: progress(record) + '%' }"
            />
          </div>
          <div class="lock-progress-caption">
            <span>{{
              record.cancelled
                ? progress(record).toFixed(1) + "% vested at cancellation"
                : progress(record).toFixed(1) + "% unlocked"
            }}</span
            ><span
              >{{ amountLabel(record.claimed, record.token) }} claimed</span
            >
          </div>
          <dl>
            <div>
              <dt>{{ record.kind === 1 ? "Unlocks" : "Starts" }}</dt>
              <dd>{{ dateLabel(record.start) }}</dd>
            </div>
            <div v-if="record.kind !== 1">
              <dt>Fully unlocked</dt>
              <dd>{{ dateLabel(record.end) }}</dd>
            </div>
            <div v-if="record.cliff > record.start">
              <dt>Cliff</dt>
              <dd>{{ dateLabel(record.cliff) }}</dd>
            </div>
            <div v-if="record.cliffAmount > 0n">
              <dt>Cliff unlock</dt>
              <dd>
                {{ amountLabel(record.cliffAmount, record.token) }}
                {{ record.token.symbol }}
              </dd>
            </div>
            <div v-if="record.cancelled">
              <dt>Cancelled</dt>
              <dd>{{ dateLabel(record.cancelledAt) }}</dd>
            </div>
            <div v-if="record.cancelled">
              <dt>Refunded to creator</dt>
              <dd>
                {{ amountLabel(record.refunded, record.token) }}
                {{ record.token.symbol }}
              </dd>
            </div>
            <div v-if="record.cancelled">
              <dt>Total recipient entitlement</dt>
              <dd>
                {{ amountLabel(record.vestedAtCancel, record.token) }}
                {{ record.token.symbol }}
              </dd>
            </div>
            <div>
              <dt>Available to claim</dt>
              <dd>
                {{ amountLabel(record.claimable, record.token) }}
                {{ record.token.symbol }}
              </dd>
            </div>
            <div>
              <dt>Cancellation</dt>
              <dd>
                {{
                  record.cancelable ? "Vested tokens protected" : "Irrevocable"
                }}
              </dd>
            </div>
          </dl>
          <div class="lock-actions">
            <RouterLink class="button button-outline" :to="`/lock/${record.id}`"
              >View schedule <ArrowUpRight :size="13"
            /></RouterLink>
            <button
              v-if="isRecipient(record)"
              class="button button-dark"
              :disabled="record.claimable === 0n || !!actionId"
              @click="act(record, 'claim')"
            >
              <LoaderCircle
                v-if="actionId === record.id && actionType === 'claim'"
                :size="14"
                class="spin"
              />{{
                record.claimable > 0n
                  ? "Claim unlocked tokens"
                  : "Nothing to claim yet"
              }}<ArrowUpRight :size="14" /></button
            ><button
              v-if="canCancel(record)"
              class="button button-outline"
              :disabled="!!actionId"
              @click="
                cancelledConfirmation =
                  cancelledConfirmation === record.id ? null : record.id
              "
            >
              Cancel schedule</button
            ><a
              class="button button-outline"
              :href="`${network.explorer}/address/${record.token.address}`"
              target="_blank"
              rel="noopener noreferrer"
              >Token <ArrowUpRight :size="13"
            /></a>
          </div>
          <div v-if="cancelledConfirmation === record.id" class="review-box">
            <p class="small">
              End this schedule now? Approximately
              {{
                amountLabel(
                  record.amount - record.claimed - record.claimable,
                  record.token,
                )
              }}
              {{ record.token.symbol }} will return to the creator.
              Approximately {{ amountLabel(record.claimable, record.token) }}
              {{ record.token.symbol }} will remain claimable by the recipient.
              Exact settlement uses the transaction’s block time; previously
              claimed tokens stay with the recipient.
            </p>
            <button
              class="button button-dark full-width"
              :disabled="!!actionId"
              @click="act(record, 'cancel')"
            >
              Confirm cancellation</button
            ><button
              class="button button-outline full-width"
              :disabled="!!actionId"
              @click="cancelledConfirmation = null"
            >
              Keep schedule
            </button>
          </div>
          <details
            v-if="
              isRecipient(record) &&
              record.claimed <
                (record.cancelled ? record.vestedAtCancel : record.amount)
            "
          >
            <summary>Move claim rights to another wallet</summary>
            <div class="transfer-form">
              <label class="field"
                ><span>New recipient wallet</span
                ><input
                  v-model="transferAddresses[record.id]"
                  @input="transferredConfirmation = null"
                  placeholder="0x…"
                  autocomplete="off"
                  spellcheck="false"
                  :disabled="!!actionId"
                /><small
                  >This transfers all remaining claim rights. Your wallet will
                  no longer be able to claim this schedule.</small
                ></label
              ><button
                v-if="transferredConfirmation !== record.id"
                class="button button-outline"
                :disabled="
                  !!actionId ||
                  !validRecipient(transferAddresses[record.id] || '')
                "
                @click="transferredConfirmation = record.id"
              >
                Review recipient transfer
              </button>
              <div v-else class="review-box">
                <p class="small" style="overflow-wrap: anywhere">
                  Transfer all remaining rights to
                  {{ transferAddresses[record.id] }}? This cannot be undone by
                  your wallet.
                </p>
                <button
                  class="button button-dark"
                  :disabled="!!actionId"
                  @click="act(record, 'transfer')"
                >
                  Confirm transfer</button
                ><button
                  class="button button-outline"
                  :disabled="!!actionId"
                  @click="transferredConfirmation = null"
                >
                  Back to editing
                </button>
              </div>
            </div>
          </details>
        </article>
      </div>
      <div v-if="pageCount > 1" class="pagination-row">
        <button
          class="button button-outline"
          :disabled="page === 0"
          @click="page--"
        >
          Previous</button
        ><span>{{ page + 1 }} / {{ pageCount }}</span
        ><button
          class="button button-outline"
          :disabled="page + 1 >= pageCount"
          @click="page++"
        >
          Next
        </button>
      </div></template
    >
    <p class="form-hint" style="margin-top: 24px">
      Schedule data is public. Displayed amounts are rounded to six decimals;
      CSV exports preserve exact base units. Claims always use the contract’s
      exact balance.
    </p>
  </div>
</template>

<style scoped>
.schedule-lookup {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 20px 24px;
  background: var(--surface, #fff);
  border: 1px solid var(--line, #dce1e9);
  border-radius: 10px;
  margin: 28px 0;
}
.schedule-lookup > div {
  margin-right: auto;
}
.schedule-lookup strong {
  display: block;
  font-size: 13px;
}
.schedule-lookup span:not(.sr-only) {
  display: block;
  font-size: 12px;
  color: var(--muted, #647184);
  margin-top: 4px;
}
.lookup-input {
  width: 190px;
}
.lookup-input input {
  width: 100%;
}
.lookup-error {
  flex-basis: 100%;
  color: var(--error, #ba3934);
  margin: 0;
  font-size: 12px;
}
.workspace-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.workspace-summary > div {
  background: var(--surface, #fff);
  border: 1px solid var(--line, #dce1e9);
  border-radius: 10px;
  padding: 20px 24px;
}
.workspace-summary span {
  display: block;
  color: var(--muted, #647184);
  font-size: 12px;
}
.workspace-summary strong {
  display: block;
  margin-top: 12px;
  font-size: 34px;
  font-weight: 600;
  line-height: 1;
}
.workspace-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}
.workspace-search {
  flex: 1;
  min-width: 220px;
}
.workspace-search input {
  width: 100%;
}
.workspace-filters select {
  min-width: 170px;
}
.workspace-filters > span {
  font-size: 11px;
  color: var(--muted, #647184);
}
.empty-workflow {
  display: flex;
  gap: 22px;
  margin: 22px 0 26px;
  font-size: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
.empty-workflow > span {
  display: flex;
  align-items: center;
  gap: 7px;
}
.empty-workflow > span > span {
  color: var(--accent, #355dff);
  font-size: 10px;
  font-weight: 700;
  background: var(--brand-soft, #e9eeff);
  border-radius: 5px;
  padding: 7px;
}
.review-box > .button + .button {
  margin-top: 10px;
}
.filter-empty {
  padding: 35px 24px;
}
@media (max-width: 680px) {
  .schedule-lookup {
    padding: 18px;
  }
  .schedule-lookup > div {
    flex-basis: 100%;
  }
  .lookup-input {
    flex: 1;
    min-width: 130px;
  }
  .schedule-lookup > .button {
    padding-inline: 12px;
  }
  .workspace-summary {
    gap: 8px;
  }
  .workspace-summary > div {
    padding: 14px 12px;
  }
  .workspace-summary span {
    font-size: 10px;
    line-height: 1.5;
  }
  .workspace-summary strong {
    font-size: 25px;
  }
  .workspace-filters > label {
    flex: 1;
  }
  .workspace-filters select {
    width: 100%;
  }
  .empty-workflow {
    gap: 12px;
  }
}
</style>
