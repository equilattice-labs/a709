<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Wallet, ArrowUpRight, Plus, RefreshCw, Layers3, LoaderCircle, Download } from 'lucide-vue-next'
import { formatUnits } from 'ethers'
import { wallet, network, shortAddress, readableError, ensureNetwork, publicProvider } from '../composables/wallet'
import { loadSchedules, scheduler, modeNames, dateLabel, validRecipient, waitForTransaction } from '../composables/schedules'
const route = useRoute(), role = ref(route.query.role === 'sent' ? 'sent' : 'received'), loading = ref(false), error = ref(''), records = ref([]), total = ref(0), page = ref(0), currentTime = ref(Math.floor(Date.now() / 1000)), lastRead = ref('')
const actionId = ref(''), actionType = ref(''), actionMessage = ref(''), actionHash = ref(''), transferAddresses = ref({}), cancelledConfirmation = ref(null), transferredConfirmation = ref(null)
let generation = 0
const pageSize = 12
const pageCount = computed(() => Math.ceil(total.value / pageSize))
const amountLabel = (amount, token) => token.decimals === null ? `${amount.toString()} base units` : Number(formatUnits(amount, token.decimals)).toLocaleString('en-US', { maximumFractionDigits: 6 })
const isRecipient = record => record.recipient.toLowerCase() === wallet.address.toLowerCase()
const isSender = record => record.sender.toLowerCase() === wallet.address.toLowerCase()
const canCancel = record => isSender(record) && record.cancelable && !record.cancelled && currentTime.value < record.start
function status(record) { if (record.cancelled) return 'Cancelled'; if (record.claimed >= record.amount) return 'Fully claimed'; if (currentTime.value < record.start) return 'Scheduled'; if (currentTime.value >= record.end) return 'Fully unlocked'; if (currentTime.value < record.cliff) return 'Before cliff'; return 'In motion' }
const progress = record => record.cancelled ? 0 : Number((record.claimed + record.claimable) * 10000n / record.amount) / 100
async function refresh(silent = false) {
  const requestId = ++generation
  if (!wallet.address) { records.value = []; total.value = 0; return }
  if (!silent) loading.value = true
  error.value = ''
  const address = wallet.address
  try {
    const [result, block] = await Promise.all([loadSchedules(address, role.value, page.value * pageSize, pageSize), publicProvider.getBlock('latest')])
    if (requestId !== generation || address !== wallet.address) return
    records.value = result.records; total.value = result.total; currentTime.value = block.timestamp; lastRead.value = new Date().toLocaleTimeString('en-GB')
  } catch (e) { if (requestId === generation) error.value = `Could not read your schedules. ${readableError(e)}` }
  finally { if (requestId === generation) loading.value = false }
}
watch([() => wallet.address, role], () => { page.value = 0; records.value = []; cancelledConfirmation.value = null; transferredConfirmation.value = null; refresh() }, { immediate: true })
watch(page, () => refresh())
watch(() => route.query.role, value => { if (value === 'sent' || value === 'received') role.value = value })
const timer = setInterval(() => { if (wallet.address && !loading.value && !actionId.value) refresh(true) }, 20000)
onUnmounted(() => { clearInterval(timer); generation++ })
async function act(record, type) {
  if (actionId.value) return
  error.value = ''; actionId.value = record.id; actionType.value = type; actionHash.value = ''; actionMessage.value = 'Confirm the request in your wallet…'
  const originalAddress = wallet.address
  try {
    const signer = await ensureNetwork()
    if ((await signer.getAddress()).toLowerCase() !== originalAddress.toLowerCase()) throw new Error('Your wallet changed. Refresh before continuing.')
    const contract = scheduler.connect(signer)
    let tx
    if (type === 'claim') { await contract.claim.staticCall(record.id); tx = await contract.claim(record.id, { chainId: network.id }) }
    else if (type === 'cancel') { await contract.cancel.staticCall(record.id); tx = await contract.cancel(record.id, { chainId: network.id }) }
    else {
      const next = transferAddresses.value[record.id]?.trim()
      if (!validRecipient(next) || next.toLowerCase() === record.recipient.toLowerCase()) throw new Error('Enter a different valid recipient wallet address.')
      await contract.transferRecipient.staticCall(record.id, next); tx = await contract.transferRecipient(record.id, next, { chainId: network.id })
    }
    actionHash.value = tx.hash; actionMessage.value = 'Transaction submitted. Waiting for confirmation…'
    const receipt = await waitForTransaction(tx); actionHash.value = receipt.hash
    actionMessage.value = type === 'claim' ? 'Tokens claimed to your wallet.' : type === 'cancel' ? 'Schedule cancelled. The deposit returned to the creator.' : 'Claim rights transferred to the new wallet.'
    cancelledConfirmation.value = null; transferredConfirmation.value = null
    await refresh(true)
  } catch (e) { error.value = readableError(e); actionMessage.value = 'The action was not completed. Check the message and try again.' }
  finally { actionId.value = '' }
}
function exportCsv() {
  const rows = [['id', 'type', 'token', 'sender', 'recipient', 'amount_base_units', 'claimed_base_units', 'claimable_base_units', 'start_utc', 'cliff_utc', 'end_utc', 'cancelable_before_start', 'status'], ...records.value.map(r => [r.id, modeNames[r.kind], r.token.address, r.sender, r.recipient, r.amount.toString(), r.claimed.toString(), r.claimable.toString(), new Date(r.start * 1000).toISOString(), new Date(r.cliff * 1000).toISOString(), new Date(r.end * 1000).toISOString(), r.cancelable, status(r)])]
  const blob = new Blob([rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `vestlyr-${role.value}-page-${page.value + 1}.csv`; link.click(); URL.revokeObjectURL(url)
}
</script>
<template>
  <div class="container workspace-section">
    <div class="page-intro"><p class="eyebrow">YOUR COMMITMENTS, IN ONE PLACE</p><h1>A little more clarity.</h1><p>See what’s on the horizon, claim what’s unlocked, and keep every commitment in view.</p></div>
    <div class="workspace-toolbar"><div class="segmented" role="group" aria-label="Schedule direction"><button :class="{ active: role === 'received' }" :aria-pressed="role === 'received'" @click="role = 'received'">Receiving</button><button :class="{ active: role === 'sent' }" :aria-pressed="role === 'sent'" @click="role = 'sent'">Created by me</button></div><div class="toolbar-actions"><button v-if="records.length" class="icon-button" aria-label="Export current page as CSV" @click="exportCsv"><Download :size="16"/></button><button class="icon-button" aria-label="Refresh schedules" :disabled="loading || !wallet.address" @click="refresh()"><RefreshCw :size="17" :class="{ spin: loading }"/></button><RouterLink to="/create" class="button button-dark"><Plus :size="15"/> New schedule</RouterLink></div></div>
    <p v-if="error" class="notice error" role="alert">{{ error }} <button class="subtle-button" @click="refresh()">Retry loading</button></p>
    <div v-if="actionMessage" class="notice" role="status" aria-live="polite">{{ actionMessage }} <a v-if="actionHash" :href="`${network.explorer}/tx/${actionHash}`" target="_blank" rel="noopener noreferrer">View transaction ↗</a></div>
    <div v-if="!wallet.address" class="empty-state"><Wallet :size="35"/><h2>It all starts with you.</h2><p>Connect the wallet that created or received a schedule. Your workspace reads directly from the chain.</p><button class="button button-dark" @click="wallet.show = true">Connect your wallet <ArrowUpRight :size="16"/></button></div>
    <div v-else-if="loading" class="loading-state" role="status"><LoaderCircle :size="20" class="spin"/> Reading your commitments from the chain…</div>
    <div v-else-if="!records.length && !error" class="empty-state"><Layers3 :size="35"/><h2>A clean slate. An open horizon.</h2><p>{{ role === 'received' ? 'This wallet has no received schedules here yet. When someone makes a commitment to you, it appears here.' : 'Your first commitment is still ahead of you. Create a schedule and follow it here, from funding to the final claim.' }}</p><RouterLink to="/create" class="button button-dark">Create your first schedule <ArrowUpRight :size="16"/></RouterLink></div>
    <template v-else-if="records.length"><p class="application-network"><span class="status-dot"/> Read from Robinhood Chain Testnet · Updated {{ lastRead }} · Refreshes every 20 seconds</p><div class="locks-grid"><article v-for="record in records" :key="record.id" class="lock-card"><div class="lock-card-top"><span class="lock-id">SCHEDULE / {{ record.id.padStart(4, '0') }}</span><span class="badge">{{ status(record) }}</span></div><h3>{{ modeNames[record.kind] }}</h3><p class="lock-counterparty">{{ role === 'sent' ? 'To' : 'From' }} <a :href="`${network.explorer}/address/${role === 'sent' ? record.recipient : record.sender}`" target="_blank" rel="noopener noreferrer">{{ shortAddress(role === 'sent' ? record.recipient : record.sender) }} ↗</a></p><div class="lock-amount">{{ amountLabel(record.amount, record.token) }} <span>{{ record.token.symbol }}</span></div><div class="progress-track" role="progressbar" :aria-valuenow="progress(record)" aria-valuemin="0" aria-valuemax="100" aria-label="Unlocked percentage"><div class="progress-fill" :style="{ width: progress(record) + '%' }"/></div><div class="lock-progress-caption"><span>{{ record.cancelled ? 'Deposit refunded' : progress(record).toFixed(1) + '% unlocked' }}</span><span>{{ amountLabel(record.claimed, record.token) }} claimed</span></div><dl><div><dt>{{ record.kind === 1 ? 'Unlocks' : 'Starts' }}</dt><dd>{{ dateLabel(record.start) }}</dd></div><div v-if="record.kind !== 1"><dt>Fully unlocked</dt><dd>{{ dateLabel(record.end) }}</dd></div><div v-if="record.cliff > record.start"><dt>Cliff</dt><dd>{{ dateLabel(record.cliff) }}</dd></div><div><dt>Available to claim</dt><dd>{{ amountLabel(record.claimable, record.token) }} {{ record.token.symbol }}</dd></div><div><dt>Cancellation</dt><dd>{{ record.cancelable ? 'Before start only' : 'Irrevocable' }}</dd></div></dl><div class="lock-actions"><button v-if="isRecipient(record) && !record.cancelled" class="button button-dark" :disabled="record.claimable === 0n || !!actionId" @click="act(record, 'claim')"><LoaderCircle v-if="actionId === record.id && actionType === 'claim'" :size="14" class="spin"/>{{ record.claimable > 0n ? 'Claim unlocked tokens' : 'Nothing to claim yet' }}<ArrowUpRight :size="14"/></button><button v-if="canCancel(record)" class="button button-outline" :disabled="!!actionId" @click="cancelledConfirmation = cancelledConfirmation === record.id ? null : record.id">Cancel schedule</button><a class="button button-outline" :href="`${network.explorer}/address/${record.token.address}`" target="_blank" rel="noopener noreferrer">Token <ArrowUpRight :size="13"/></a></div>
      <div v-if="cancelledConfirmation === record.id" class="review-box"><p class="small">Cancel this schedule and return {{ amountLabel(record.amount, record.token) }} {{ record.token.symbol }} to the creator? The recipient will receive nothing.</p><button class="button button-dark full-width" :disabled="!!actionId" @click="act(record, 'cancel')">Confirm cancellation</button></div>
      <details v-if="isRecipient(record) && !record.cancelled && record.claimed < record.amount"><summary>Move claim rights to another wallet</summary><div class="transfer-form"><label class="field"><span>New recipient wallet</span><input v-model="transferAddresses[record.id]" placeholder="0x…" autocomplete="off" spellcheck="false" :disabled="!!actionId"/><small>This transfers all remaining claim rights. Your wallet will no longer be able to claim this schedule.</small></label><button v-if="transferredConfirmation !== record.id" class="button button-outline" :disabled="!!actionId || !validRecipient(transferAddresses[record.id] || '')" @click="transferredConfirmation = record.id">Review recipient transfer</button><div v-else class="review-box"><p class="small" style="overflow-wrap:anywhere">Transfer all remaining rights to {{ transferAddresses[record.id] }}? This cannot be undone by your wallet.</p><button class="button button-dark" :disabled="!!actionId" @click="act(record, 'transfer')">Confirm transfer</button></div></div></details>
    </article></div><div v-if="pageCount > 1" class="pagination-row"><button class="button button-outline" :disabled="page === 0" @click="page--">Previous</button><span>{{ page + 1 }} / {{ pageCount }}</span><button class="button button-outline" :disabled="page + 1 >= pageCount" @click="page++">Next</button></div></template>
    <p class="form-hint" style="margin-top:24px">Schedule data is public. Displayed amounts are rounded to six decimals; CSV exports preserve exact base units. Claims always use the contract’s exact balance.</p>
  </div>
</template>
