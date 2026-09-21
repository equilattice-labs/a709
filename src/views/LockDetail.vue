<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { brand } from "../config/brand";
import { formatUnits, ZeroAddress } from "ethers";
import {
  ArrowUpRight,
  Copy,
  RefreshCw,
  LoaderCircle,
  ArrowLeft,
} from "lucide-vue-next";
import {
  scheduler,
  config,
  dateLabel,
  modeNames,
  validRecipient,
  waitForTransaction,
} from "../composables/schedules";
import {
  wallet,
  network,
  publicProvider,
  tokenInfo,
  ensureNetwork,
  readableError,
} from "../composables/wallet";
const route = useRoute(),
  record = ref(null),
  token = ref(null),
  claimable = ref(0n),
  error = ref(""),
  loading = ref(true),
  busy = ref(false),
  notice = ref(""),
  txHash = ref(""),
  confirmation = ref(""),
  newRecipient = ref(""),
  copied = ref(false),
  readAt = ref("");
let requestGeneration = 0,
  actionGeneration = 0;
const id = computed(() => String(route.params.id));
const entitled = computed(() =>
  record.value?.cancelled
    ? record.value.vestedAtCancel
    : (record.value?.amount ?? 0n),
);
const isRecipient = computed(
  () =>
    !!wallet.address &&
    record.value?.recipient.toLowerCase() === wallet.address.toLowerCase(),
);
const isCreator = computed(
  () =>
    !!wallet.address &&
    record.value?.sender.toLowerCase() === wallet.address.toLowerCase(),
);
const remaining = computed(() =>
  record.value ? entitled.value - record.value.claimed : 0n,
);
const refundEstimate = computed(() =>
  record.value
    ? record.value.amount - record.value.claimed - claimable.value
    : 0n,
);
const amount = (value) =>
  token.value?.decimals == null
    ? `${value?.toString() ?? "0"} base units`
    : `${formatUnits(value ?? 0n, token.value.decimals)} ${token.value.symbol}`;
const addressUrl = (address) => `${network.explorer}/address/${address}`;
async function refresh(silent = false) {
  const generation = ++requestGeneration;
  if (!silent) loading.value = true;
  error.value = "";
  try {
    if (!/^[1-9]\d*$/.test(id.value) || BigInt(id.value) >= 2n ** 256n)
      throw new Error("Enter a valid positive schedule ID.");
    const currentId = id.value;
    const blockTag = await publicProvider.getBlockNumber();
    const found = await scheduler.schedules(currentId, { blockTag });
    if (found.sender === ZeroAddress)
      throw new Error(
        `This schedule does not exist on the current ${brand.name} deployment.`,
      );
    const [available, metadata] = await Promise.all([
      scheduler.claimable(currentId, { blockTag }),
      tokenInfo(found.token).catch(() => ({
        address: found.token,
        symbol: "TOKEN",
        decimals: null,
      })),
    ]);
    if (generation !== requestGeneration) return;
    record.value = found;
    claimable.value = available;
    token.value = metadata;
    readAt.value = new Date().toLocaleTimeString("en-GB");
  } catch (e) {
    if (generation === requestGeneration) {
      error.value = readableError(e);
      if (!silent) record.value = null;
    }
  } finally {
    if (generation === requestGeneration) loading.value = false;
  }
}
watch(
  id,
  () => {
    actionGeneration++;
    busy.value = false;
    copied.value = false;
    newRecipient.value = "";
    record.value = null;
    confirmation.value = "";
    notice.value = "";
    txHash.value = "";
    refresh();
  },
  { immediate: true },
);
watch(
  () => wallet.address,
  () => {
    actionGeneration++;
    busy.value = false;
    confirmation.value = "";
    notice.value = "";
    txHash.value = "";
  },
);
watch(newRecipient, () => {
  if (confirmation.value === "transfer") confirmation.value = "";
});
const timer = setInterval(() => {
  if (!loading.value && !busy.value) refresh(true);
}, 20000);
onUnmounted(() => {
  clearInterval(timer);
  requestGeneration++;
  actionGeneration++;
});
async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
  } catch {
    notice.value =
      "Copy this page’s address from your browser to share the schedule.";
  }
}
async function act(kind) {
  if (busy.value || !record.value) return;
  if (!wallet.address) {
    wallet.show = true;
    return;
  }
  busy.value = true;
  error.value = "";
  notice.value = "Confirm the request in your wallet…";
  txHash.value = "";
  const currentId = id.value,
    account = wallet.address,
    target = newRecipient.value.trim(),
    operation = ++actionGeneration;
  const isCurrent = () =>
    operation === actionGeneration &&
    currentId === id.value &&
    account.toLowerCase() === wallet.address.toLowerCase();
  const assertCurrent = () => {
    if (!isCurrent())
      throw new Error(
        "The schedule or account changed. Review the current page again.",
      );
  };
  try {
    const signer = await ensureNetwork();
    assertCurrent();
    if ((await signer.getAddress()).toLowerCase() !== account.toLowerCase())
      throw new Error(
        "Your wallet account changed. Review this schedule again.",
      );
    const contract = scheduler.connect(signer);
    const args = kind === "transfer" ? [currentId, target] : [currentId];
    if (
      kind === "transfer" &&
      (!validRecipient(args[1]) ||
        args[1].toLowerCase() === account.toLowerCase())
    )
      throw new Error("Enter a different valid recipient address.");
    const method =
      kind === "claim"
        ? contract.claim
        : kind === "cancel"
          ? contract.cancel
          : contract.transferRecipient;
    await method.staticCall(...args);
    assertCurrent();
    const tx = await method(...args, { chainId: network.id });
    if (isCurrent()) {
      txHash.value = tx.hash;
      notice.value = "Submitted. Waiting for onchain confirmation…";
    }
    const receipt = await waitForTransaction(tx);
    if (!isCurrent()) return;
    txHash.value = receipt.hash;
    notice.value =
      kind === "claim"
        ? "Unlocked tokens claimed to the recipient wallet."
        : kind === "cancel"
          ? "The schedule has ended. Unvested tokens were refunded; vested tokens remain claimable."
          : "Remaining claim rights transferred to the new recipient.";
    confirmation.value = "";
    await refresh(true);
  } catch (e) {
    if (isCurrent()) {
      error.value = readableError(e);
      notice.value =
        "The action did not complete. Check the message and try again.";
    }
  } finally {
    if (isCurrent()) busy.value = false;
  }
}
</script>
<template>
  <div class="container workspace-section">
    <header class="page-intro">
      <RouterLink to="/locks" class="text-button"
        ><ArrowLeft :size="15" /> Back to workspace</RouterLink
      >
      <p class="eyebrow">PUBLIC SCHEDULE / ONCHAIN RECORD</p>
      <h1>Schedule #{{ id }}</h1>
      <p>
        Inspect the allocation, follow its release, and manage the rights held
        by your wallet.
      </p>
    </header>
    <div class="workspace-toolbar">
      <span class="application-network"
        ><span class="status-dot" /> Robinhood Chain Testnet ·
        {{ record?.cancelled ? "Cancelled" : "Public record" }}</span
      >
      <div class="toolbar-actions">
        <button class="button button-outline" @click="copyLink">
          <Copy :size="15" />{{
            copied ? "Link copied" : "Share schedule"
          }}</button
        ><button
          class="icon-button"
          :disabled="loading"
          aria-label="Refresh schedule"
          @click="refresh()"
        >
          <RefreshCw :size="17" :class="{ spin: loading }" />
        </button>
      </div>
    </div>
    <p v-if="error" class="notice error" role="alert">
      {{ error }}
      <button class="subtle-button" :disabled="loading" @click="refresh()">
        Retry
      </button>
    </p>
    <p v-if="notice" class="notice" role="status" aria-live="polite">
      {{ notice }}
      <a
        v-if="txHash"
        :href="`${network.explorer}/tx/${txHash}`"
        target="_blank"
        rel="noopener noreferrer"
        >View transaction ↗</a
      >
    </p>
    <div v-if="loading" class="loading-state" role="status">
      <LoaderCircle :size="20" class="spin" /> Reading schedule terms and
      available balance…
    </div>
    <div v-else-if="!record" class="empty-state">
      <h2>Schedule unavailable</h2>
      <p>
        Check the ID and network, or return to your workspace. Older V1 records
        use the earlier deployment listed in the contract guide.
      </p>
      <RouterLink to="/locks" class="button button-dark"
        >Open workspace <ArrowUpRight :size="16"
      /></RouterLink>
    </div>
    <template v-else>
      <div class="detail-overview" role="group" aria-label="Allocation overview">
        <div>
          <span>Original allocation</span
          ><strong>{{ amount(record.amount) }}</strong>
        </div>
        <div>
          <span>Claimed by recipients</span
          ><strong>{{ amount(record.claimed) }}</strong>
        </div>
        <div>
          <span>Remaining entitlement</span
          ><strong>{{ amount(remaining) }}</strong>
        </div>
      </div>
      <div class="create-layout">
        <section class="form-panel schedule-detail">
          <div class="detail-section-heading">
            <span class="detail-number">01</span>
            <div>
              <p class="eyebrow">{{ modeNames[Number(record.kind)] }}</p>
              <h2>Release terms</h2>
            </div>
            <span class="badge">{{
              record.cancelled
                ? "Cancelled"
                : record.cancelable
                  ? "Cancelable"
                  : "Irrevocable"
            }}</span>
          </div>
          <dl class="detail-terms">
            <div>
              <dt>
                {{
                  Number(record.kind) === 1 ? "Unlock date" : "Baseline start"
                }}
              </dt>
              <dd>{{ dateLabel(record.start) }}</dd>
            </div>
            <div v-if="Number(record.kind) !== 1">
              <dt>Cliff / release start</dt>
              <dd>{{ dateLabel(record.cliff) }}</dd>
            </div>
            <div v-if="Number(record.kind) !== 1">
              <dt>Cliff allocation</dt>
              <dd>{{ amount(record.cliffAmount) }}</dd>
            </div>
            <div v-if="Number(record.kind) !== 1">
              <dt>Fully unlocked</dt>
              <dd>{{ dateLabel(record.end) }}</dd>
            </div>
            <div>
              <dt>Release cadence</dt>
              <dd>
                {{
                  Number(record.kind) === 1
                    ? "One complete unlock"
                    : `Every ${record.interval.toString()} seconds`
                }}
              </dd>
            </div>
            <div>
              <dt>Cancellation setting</dt>
              <dd>
                {{
                  record.cancelable
                    ? "Creator may stop future vesting"
                    : "Cancellation not permitted"
                }}
              </dd>
            </div>
            <template v-if="record.cancelled"
              ><div>
                <dt>Cancelled at</dt>
                <dd>{{ dateLabel(record.cancelledAt) }}</dd>
              </div>
              <div>
                <dt>Returned to creator</dt>
                <dd>{{ amount(record.refunded) }}</dd>
              </div>
              <div>
                <dt>Final vested entitlement</dt>
                <dd>{{ amount(record.vestedAtCancel) }}</dd>
              </div></template
            >
          </dl>
          <div class="detail-section-heading address-heading">
            <span class="detail-number">02</span>
            <div>
              <p class="eyebrow">WALLETS & ASSET</p>
              <h2>Participants</h2>
            </div>
          </div>
          <dl class="detail-terms address-terms">
            <div>
              <dt>Creator</dt>
              <dd>
                <a
                  :href="addressUrl(record.sender)"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ record.sender }} ↗</a
                >
              </dd>
            </div>
            <div>
              <dt>Current recipient</dt>
              <dd>
                <a
                  :href="addressUrl(record.recipient)"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ record.recipient }} ↗</a
                >
              </dd>
            </div>
            <div>
              <dt>Token contract</dt>
              <dd>
                <a
                  :href="addressUrl(record.token)"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ record.token }} ↗</a
                >
              </dd>
            </div>
          </dl>
          <p class="form-hint">
            Read at {{ readAt }} · Auto-refresh every 20 seconds · Exact token
            decimals · All dates in UTC
          </p>
          <a
            :href="`${addressUrl(config.schedulerAddress)}?tab=contract`"
            target="_blank"
            rel="noopener noreferrer"
            class="text-button"
            >Verify contract rules <ArrowUpRight :size="15"
          /></a>
        </section>
        <aside class="preview-panel detail-management">
          <p class="eyebrow">AVAILABLE TO CLAIM</p>
          <h2 class="detail-claimable">{{ amount(claimable) }}</h2>
          <p>
            {{
              record.cancelled
                ? "This vested balance remains claimable after cancellation."
                : "The recipient can claim unlocked tokens. The contract calculates the exact balance when the transaction executes."
            }}
          </p>
          <button
            v-if="!wallet.address"
            class="button button-dark full-width"
            @click="wallet.show = true"
          >
            Connect wallet to manage <ArrowUpRight :size="16" />
          </button>
          <button
            v-if="isRecipient"
            class="button button-dark full-width"
            :disabled="busy || claimable === 0n"
            @click="act('claim')"
          >
            <LoaderCircle v-if="busy" :size="16" class="spin" />{{
              busy
                ? "Waiting for confirmation…"
                : claimable > 0n
                  ? "Claim unlocked tokens"
                  : "Nothing to claim yet"
            }}
          </button>
          <p v-if="wallet.address" class="management-role">
            Your access:
            <strong>{{
              isRecipient && isCreator
                ? "Recipient & creator"
                : isRecipient
                  ? "Recipient"
                  : isCreator
                    ? "Creator"
                    : "Observer"
            }}</strong>
          </p>
          <p
            v-if="wallet.address && !isRecipient && !isCreator"
            class="preview-foot"
          >
            Only the current recipient can claim or transfer rights. Only the
            creator can cancel when cancellation was enabled.
          </p>
          <div
            v-if="isCreator && record.cancelable && !record.cancelled"
            class="detail-action"
          >
            <h3>Stop future vesting</h3>
            <p>
              Unvested tokens return to the creator. Vested tokens remain
              claimable by the recipient.
            </p>
            <button
              v-if="confirmation !== 'cancel'"
              class="button button-outline full-width"
              :disabled="busy"
              @click="confirmation = 'cancel'"
            >
              Review cancellation
            </button>
            <div
              v-else
              class="action-confirmation"
              role="region"
              aria-label="Cancellation confirmation"
            >
              <p>
                Estimated refund: <strong>{{ amount(refundEstimate) }}</strong
                >. The recipient retains approximately
                <strong>{{ amount(claimable) }}</strong> unclaimed, plus tokens
                already claimed. Exact settlement uses the transaction block.
              </p>
              <button
                class="button button-dark full-width"
                :disabled="busy"
                @click="act('cancel')"
              >
                Confirm cancellation</button
              ><button
                class="button button-outline full-width"
                :disabled="busy"
                @click="confirmation = ''"
              >
                Keep schedule
              </button>
            </div>
          </div>
          <div v-if="isRecipient && remaining > 0n" class="detail-action">
            <h3>Transfer claim rights</h3>
            <p>Assign the entire remaining entitlement to another wallet.</p>
            <label class="field"
              ><span>New recipient wallet</span
              ><input
                v-model="newRecipient"
                placeholder="0x…"
                spellcheck="false"
                autocomplete="off"
                :disabled="busy"
            /></label>
            <button
              v-if="confirmation !== 'transfer'"
              class="button button-outline full-width"
              :disabled="
                busy ||
                !validRecipient(newRecipient) ||
                newRecipient.toLowerCase() === wallet.address.toLowerCase()
              "
              @click="confirmation = 'transfer'"
            >
              Review recipient transfer
            </button>
            <div
              v-else
              class="action-confirmation"
              role="region"
              aria-label="Recipient transfer confirmation"
            >
              <p class="break-address">
                Transfer all remaining rights to
                <strong>{{ newRecipient }}</strong
                >? Your wallet cannot reverse this action.
              </p>
              <button
                class="button button-dark full-width"
                :disabled="busy"
                @click="act('transfer')"
              >
                Confirm transfer</button
              ><button
                class="button button-outline full-width"
                :disabled="busy"
                @click="confirmation = ''"
              >
                Back to editing
              </button>
            </div>
          </div>
          <p class="preview-foot">
            Test tokens only. Network gas is paid in testnet ETH. Connection
            alone does not authorize a transaction.
          </p>
        </aside>
      </div>
    </template>
  </div>
</template>
<style scoped>
.detail-overview {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 24px 0;
}
.detail-overview > div {
  padding: 22px;
  border: 1px solid var(--line, #dce1e9);
  border-radius: 10px;
  background: var(--surface, #fff);
}
.detail-overview span {
  display: block;
  font-size: 12px;
  color: var(--muted, #647184);
}
.detail-overview strong {
  display: block;
  margin-top: 12px;
  font-size: 22px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.detail-section-heading {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 0 0 22px;
}
.detail-section-heading .eyebrow {
  margin: 0 0 4px;
}
.detail-section-heading h2 {
  margin: 0;
  font-size: 22px;
}
.detail-section-heading .badge {
  margin-left: auto;
}
.detail-number {
  font-size: 11px;
  color: var(--accent, #355dff);
  border: 1px solid var(--line, #dce1e9);
  border-radius: 7px;
  padding: 12px;
}
.address-heading {
  margin-top: 38px;
}
.address-terms a {
  font-family: monospace;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.management-role {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid var(--line, #dce1e9);
  padding-top: 18px;
  font-size: 12px;
}
.action-confirmation {
  padding: 15px;
  border: 1px solid #e4c9b9;
  border-radius: 8px;
  background: #fff8f3;
}
.action-confirmation .button + .button {
  margin-top: 10px;
}
@media (max-width: 680px) {
  .detail-overview {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .detail-overview > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 16px;
  }
  .detail-overview strong {
    margin: 0;
    font-size: 17px;
    text-align: right;
  }
  .detail-overview span {
    font-size: 11px;
  }
  .detail-section-heading {
    gap: 10px;
  }
  .detail-section-heading h2 {
    font-size: 19px;
  }
}
</style>
