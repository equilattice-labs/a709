<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Contract, formatUnits, parseUnits } from 'ethers'
import { Timer, LockKeyhole, Waves, Layers3, ArrowUpRight, Check, LoaderCircle } from 'lucide-vue-next'
import FlowChart from '../components/FlowChart.vue'
import { wallet, network, tokenInfo, tokenAbi, ensureNetwork, readableError, onNetwork } from '../composables/wallet'
import { config, fundSchedule, exactAmount, validRecipient, dateLabel, waitForTransaction } from '../composables/schedules'
const route = useRoute()
const types = [{ id: 'vesting', title: 'Token vesting', sub: 'A cliff. A cadence. A commitment.', icon: Timer }, { id: 'lock', title: 'Token lock', sub: 'One date. The whole amount.', icon: LockKeyhole }, { id: 'stream', title: 'Payment stream', sub: 'A little more, every second.', icon: Waves }, { id: 'airdrop', title: 'Vested airdrop', sub: 'Many wallets. One timeline.', icon: Layers3 }]
const mode = ref(types.some(t => t.id === route.query.mode) ? route.query.mode : 'vesting')
const localDate = date => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
const now = Date.now()
const recipient = ref(''), amount = ref('1000'), batch = ref(''), start = ref(localDate(new Date(now + 15 * 60000))), end = ref(localDate(new Date(now + 30 * 86400000))), cliff = ref(localDate(new Date(now + 7 * 86400000))), hasCliff = ref(true), cadence = ref('86400'), cancelable = ref(false)
const useCustom = ref(false), customAddress = ref(''), token = ref({ address: config.testTokenAddress, symbol: config.tokenSymbol, decimals: config.tokenDecimals }), tokenLoading = ref(false)
const error = ref(''), busy = ref(false), minting = ref(false), reviewed = ref(null), accepted = ref(false), phase = ref(''), message = ref(''), txHash = ref(''), createdIds = ref([]), balanceMessage = ref('')
let tokenRequestId = 0
watch(() => route.query.mode, next => { if (types.some(t => t.id === next)) mode.value = next })
watch([mode, recipient, amount, batch, start, end, cliff, hasCliff, cadence, cancelable, customAddress, useCustom], () => { reviewed.value = null; accepted.value = false; if (!busy.value) { phase.value = ''; createdIds.value = []; txHash.value = '' } })
watch(() => wallet.address, () => { reviewed.value = null; accepted.value = false; balanceMessage.value = '' })
watch(useCustom, custom => { tokenRequestId++; tokenLoading.value = false; token.value = custom ? null : { address: config.testTokenAddress, symbol: config.tokenSymbol, decimals: config.tokenDecimals } })
watch(customAddress, () => { tokenRequestId++; tokenLoading.value = false; if (useCustom.value) token.value = null })
const symbol = computed(() => token.value?.symbol || 'tokens')
const recipientCount = computed(() => mode.value === 'airdrop' ? batch.value.trim().split('\n').filter(line => line.trim()).length : 1)
const previewAmount = computed(() => {
  try {
    if (!token.value) return '—'
    if (mode.value !== 'airdrop') return amount.value || '0'
    return formatUnits(batch.value.trim().split('\n').filter(line => line.trim()).reduce((sum, line) => sum + exactAmount(line.split(',')[1]?.trim() || '', token.value.decimals), 0n), token.value.decimals)
  } catch { return '—' }
})
const selectedType = computed(() => types.find(t => t.id === mode.value))
const previewDate = value => { const date = Date.parse(value); return Number.isFinite(date) ? dateLabel(date / 1000) : 'Choose a date' }
async function loadToken() {
  const requestId = ++tokenRequestId, requestedAddress = customAddress.value.trim()
  error.value = ''; tokenLoading.value = true
  try { const loaded = await tokenInfo(requestedAddress); if (requestId === tokenRequestId && useCustom.value && customAddress.value.trim() === requestedAddress) token.value = loaded }
  catch (e) { if (requestId === tokenRequestId) { error.value = readableError(e); token.value = null } }
  finally { if (requestId === tokenRequestId) tokenLoading.value = false }
}
function review() {
  error.value = ''; reviewed.value = null; accepted.value = false
  try {
    if (!token.value) throw new Error('Load and verify the token before continuing.')
    const tokenDecimals = token.value.decimals
    let recipients, amounts
    if (mode.value === 'airdrop') {
      const lines = batch.value.trim().split('\n').filter(line => line.trim())
      if (!lines.length || lines.length > 100) throw new Error('Add between 1 and 100 recipients, one address,amount pair per line.')
      const rows = lines.map((line, i) => { const columns = line.split(',').map(part => part.trim()); if (columns.length !== 2 || !validRecipient(columns[0])) throw new Error(`Line ${i + 1}: enter a valid recipient address and amount, separated by a comma.`); return columns })
      recipients = rows.map(row => row[0]); amounts = rows.map(row => exactAmount(row[1], tokenDecimals))
      if (new Set(recipients.map(a => a.toLowerCase())).size !== recipients.length) throw new Error('Each recipient must appear only once in this batch.')
    } else {
      if (!validRecipient(recipient.value.trim())) throw new Error('Enter a valid recipient wallet. The zero address and scheduler contract are not allowed.')
      recipients = [recipient.value.trim()]; amounts = [exactAmount(amount.value, tokenDecimals)]
    }
    const ends = Math.floor(Date.parse(end.value) / 1000)
    const starts = mode.value === 'lock' ? ends : Math.floor(Date.parse(start.value) / 1000)
    const cliffs = mode.value === 'lock' ? ends : (hasCliff.value && mode.value !== 'stream' ? Math.floor(Date.parse(cliff.value) / 1000) : starts)
    if (![starts, cliffs, ends].every(Number.isFinite)) throw new Error('Choose valid start, cliff and end dates.')
    if (starts <= Math.floor(Date.now() / 1000) + 60) throw new Error('Choose a start time at least one minute in the future, leaving time for wallet confirmations.')
    if (mode.value !== 'lock' && ends <= starts) throw new Error('The end time must be after the start time.')
    if (cliffs < starts || cliffs > ends) throw new Error('The cliff must be between the start and end times.')
    const interval = mode.value === 'lock' ? 0 : mode.value === 'stream' ? 1 : Number(cadence.value)
    if (mode.value !== 'lock' && (!Number.isSafeInteger(interval) || interval < 1)) throw new Error('Choose a valid release cadence.')
    if (mode.value !== 'lock' && interval > ends - starts) throw new Error('The release cadence must fit within the schedule duration.')
    const totalLabel = formatUnits(amounts.reduce((sum, n) => sum + n, 0n), tokenDecimals)
    reviewed.value = { mode: mode.value, token: { ...token.value }, recipients, amounts, start: starts, cliff: cliffs, end: ends, interval, kind: { vesting: 0, lock: 1, stream: 2, airdrop: 3 }[mode.value], cancelable: cancelable.value, totalLabel }
  } catch (e) { error.value = readableError(e) }
}
async function submit() {
  if (!reviewed.value || !accepted.value || busy.value) return
  if (!wallet.address) { wallet.show = true; return }
  error.value = ''; busy.value = true; createdIds.value = []
  const plan = { ...reviewed.value, token: { ...reviewed.value.token }, amounts: [...reviewed.value.amounts], recipients: [...reviewed.value.recipients] }
  try { createdIds.value = await fundSchedule(plan, (step, text, hash) => { phase.value = step; message.value = text; if (hash) txHash.value = hash }) }
  catch (e) { error.value = readableError(e); phase.value = 'error'; message.value = 'The flow stopped. Review the message and retry. A confirmed approval may remain even if funding was not completed.' }
  finally { busy.value = false }
}
async function mint() {
  if (!wallet.address) { wallet.show = true; return }
  error.value = ''; minting.value = true; balanceMessage.value = ''
  try { const signer = await ensureNetwork(); const tx = await new Contract(config.testTokenAddress, tokenAbi, signer).mint(parseUnits('1000', 6), { chainId: network.id }); await waitForTransaction(tx); balanceMessage.value = '1,000 tUSD minted to your wallet.' }
  catch (e) { error.value = readableError(e) }
  finally { minting.value = false }
}
</script>
<template>
  <div class="container workspace-section">
    <div class="page-intro"><p class="eyebrow">A COMMITMENT WORTH KEEPING</p><h1>Give your tokens a timeline.</h1><p>A person. An amount. A moment in time. Start with the shape of your commitment — we’ll help with the rest.</p></div>
    <div class="application-network"><span class="status-dot"/> Robinhood Chain Testnet · Test tokens only · No protocol fees</div>
    <div class="type-picker" role="group" aria-label="Choose schedule type"><button v-for="type in types" :key="type.id" class="type-option" :class="{ active: mode === type.id }" :aria-pressed="mode === type.id" :disabled="busy" @click="mode = type.id"><component :is="type.icon" :size="22"/><span><strong>{{ type.title }}</strong><small>{{ type.sub }}</small></span></button></div>
    <div class="create-layout">
      <form class="form-panel" @submit.prevent="review">
        <fieldset :disabled="busy" class="form-section"><legend><span>01</span> What are we putting in motion?</legend>
          <div class="token-toggle"><button type="button" :class="{ active: !useCustom }" @click="useCustom = false">tUSD · Test token</button><button type="button" :class="{ active: useCustom }" @click="useCustom = true">Custom ERC-20</button></div>
          <div v-if="useCustom" class="field"><label for="custom-token">Token contract on Robinhood testnet</label><div class="field-inline"><input id="custom-token" v-model="customAddress" placeholder="0x…" spellcheck="false" autocomplete="off"><button type="button" class="button button-outline" :disabled="tokenLoading" @click="loadToken">{{ tokenLoading ? 'Loading…' : 'Load token' }}</button></div><small v-if="token">{{ token.symbol }} · {{ token.decimals }} decimals · Verify the contract independently.</small><small>Standard fixed-balance ERC-20 tokens only. Rebasing and fee-on-transfer tokens are unsupported.</small></div>
          <div v-else class="test-token-row"><span>{{ balanceMessage || 'Need a few tokens to try it out?' }}</span><button type="button" :disabled="minting" @click="mint">{{ minting ? 'Minting…' : 'Mint 1,000 tUSD ↗' }}</button></div>
        </fieldset>
        <fieldset :disabled="busy" class="form-section"><legend><span>02</span> Who’s part of the story?</legend>
          <template v-if="mode !== 'airdrop'"><div class="field"><div class="form-label-line"><label for="recipient">Recipient wallet</label><button type="button" v-if="wallet.address" class="subtle-button" @click="recipient = wallet.address">Use my wallet</button></div><input id="recipient" v-model="recipient" placeholder="0x… recipient address" spellcheck="false" autocomplete="off"/><small>The wallet that can claim unlocked tokens.</small></div><label class="field"><span>Amount ({{ symbol }})</span><input v-model="amount" inputmode="decimal" placeholder="1000" autocomplete="off"/></label></template>
          <label v-else class="field"><span>Recipients and amounts</span><textarea v-model="batch" rows="5" placeholder="0xRecipientAddress,1000&#10;0xAnotherAddress,2500" spellcheck="false"/><small>One address,amount pair per line. Up to 100 unique recipients. No CSV header, commas in amounts, or scientific notation. {{ recipientCount }} recipients entered.</small></label>
        </fieldset>
        <fieldset :disabled="busy" class="form-section"><legend><span>03</span> Set the pace.</legend>
          <div class="field-row"><label class="field" v-if="mode !== 'lock'"><span>Starts at · your local time</span><input type="datetime-local" v-model="start" required/></label><label class="field"><span>{{ mode === 'lock' ? 'Unlocks at' : 'Fully unlocked at' }} · your local time</span><input type="datetime-local" v-model="end" required/></label></div>
          <template v-if="mode === 'vesting' || mode === 'airdrop'"><label class="check-label"><input type="checkbox" v-model="hasCliff"/><span>Add a cliff<small>Tokens accrue from the start, but nothing can be claimed before the cliff.</small></span></label><div class="field-row" style="margin-top:20px"><label v-if="hasCliff" class="field"><span>Cliff ends · your local time</span><input type="datetime-local" v-model="cliff" required/></label><label class="field"><span>Release cadence</span><select v-model="cadence"><option value="1">Every second</option><option value="60">Every minute</option><option value="3600">Every hour</option><option value="86400">Every day (24 hours)</option><option value="604800">Every week (7 days)</option><option value="2592000">Every 30 days</option></select></label></div></template>
          <p v-if="mode === 'stream'" class="form-hint">The full deposit is funded up front. The recipient’s claimable balance then grows every second between the start and end.</p><p v-if="mode === 'lock'" class="form-hint">The entire amount stays locked until the unlock time. For this type, the start and unlock times are the same.</p>
        </fieldset>
        <fieldset :disabled="busy" class="form-section"><legend><span>04</span> Make the terms clear.</legend><label class="check-label"><input type="checkbox" v-model="cancelable"/><span>Allow cancellation before the start<small>The creator can reclaim the full deposit only before the start time (the unlock time for date locks). Once started, the schedule cannot be cancelled. Leave unchecked for an irrevocable commitment.</small></span></label></fieldset>
        <p v-if="error" class="notice error" role="alert">{{ error }}</p>
        <template v-if="phase !== 'complete'"><button type="submit" class="button button-dark full-width" :disabled="busy || tokenLoading">Review your schedule <ArrowUpRight :size="17"/></button><p class="form-hint">Reviewing is free and does not request a signature.</p></template>
        <div v-if="reviewed && phase !== 'complete'" class="review-box"><h3>One last look.</h3><dl><div><dt>Exact deposit</dt><dd>{{ reviewed.totalLabel }} {{ reviewed.token.symbol }}</dd></div><div><dt>Token contract</dt><dd><code>{{ reviewed.token.address }}</code></dd></div><div><dt>Recipients</dt><dd>{{ reviewed.recipients.length }} wallet{{ reviewed.recipients.length === 1 ? '' : 's' }}</dd></div><div v-if="reviewed.recipients.length === 1"><dt>Recipient address</dt><dd><code>{{ reviewed.recipients[0] }}</code></dd></div><div><dt>Schedule starts</dt><dd>{{ dateLabel(reviewed.start) }}</dd></div><div><dt>Fully unlocked</dt><dd>{{ dateLabel(reviewed.end) }}</dd></div><div v-if="reviewed.cliff > reviewed.start"><dt>Cliff</dt><dd>{{ dateLabel(reviewed.cliff) }}</dd></div><div v-if="reviewed.interval"><dt>Release cadence</dt><dd>Every {{ reviewed.interval.toLocaleString() }} seconds</dd></div><div><dt>Cancellation</dt><dd>{{ reviewed.cancelable ? 'Before start only' : 'Never' }}</dd></div></dl><details v-if="reviewed.recipients.length > 1" class="review-recipients"><summary>Review all {{ reviewed.recipients.length }} allocations</summary><ol><li v-for="(address, index) in reviewed.recipients" :key="address"><code>{{ address }}</code><strong>{{ formatUnits(reviewed.amounts[index], reviewed.token.decimals) }} {{ reviewed.token.symbol }}</strong></li></ol></details><label class="check-label"><input type="checkbox" v-model="accepted" :disabled="busy"/><span>I checked the token, recipient{{ reviewed.recipients.length === 1 ? '' : 's' }} and timeline. I understand this is an unaudited testnet release.</span></label><button type="button" class="button button-dark full-width" style="margin-top:18px" :disabled="!accepted || busy" @click="submit"><LoaderCircle v-if="busy" :size="16" class="spin"/>{{ busy ? 'Waiting for your wallet…' : !wallet.address ? 'Connect wallet to continue' : !onNetwork ? 'Switch network & fund' : 'Approve & fund schedule' }}<ArrowUpRight v-if="!busy" :size="16"/></button></div>
        <div v-if="phase" class="transaction-status" role="status" aria-live="polite"><h3>{{ phase === 'complete' ? 'Your next chapter is onchain.' : phase === 'error' ? 'Let’s try that again.' : 'Making it official.' }}</h3><div class="transaction-steps"><span :class="{ done: phase === 'approval' || phase === 'funding' || phase === 'complete' }"/><span :class="{ done: phase === 'funding' || phase === 'complete' }"/><span :class="{ done: phase === 'complete' }"/></div><p>{{ message }}</p><a v-if="txHash" :href="`${network.explorer}/tx/${txHash}`" target="_blank" rel="noopener noreferrer">View latest transaction ↗</a><p v-if="createdIds.length">Schedule ID{{ createdIds.length === 1 ? '' : 's' }}: {{ createdIds.join(', ') }}</p><RouterLink v-if="phase === 'complete'" to="/locks?role=sent" class="button button-dark full-width" style="margin-top:18px">Go to your workspace <ArrowUpRight :size="16"/></RouterLink></div>
      </form>
      <aside class="preview-panel"><p class="eyebrow">THE SHAPE OF YOUR COMMITMENT</p><h2>{{ selectedType.title }}</h2><p>{{ recipientCount }} recipient{{ recipientCount === 1 ? '' : 's' }}. One clear timeline.</p><div class="preview-total">{{ previewAmount }}<span>{{ symbol }}</span></div><FlowChart :mode="mode"/><dl><div><dt>{{ mode === 'lock' ? 'Unlock date' : 'Start' }}</dt><dd>{{ previewDate(mode === 'lock' ? end : start) }}</dd></div><div v-if="mode !== 'lock'"><dt>End</dt><dd>{{ previewDate(end) }}</dd></div><div v-if="hasCliff && (mode === 'vesting' || mode === 'airdrop')"><dt>Cliff</dt><dd>{{ previewDate(cliff) }}</dd></div><div><dt>Protocol fee</dt><dd>0 ETH</dd></div><div><dt>Cancellation</dt><dd>{{ cancelable ? 'Before start only' : 'Not allowed' }}</dd></div></dl><p class="preview-foot">Chart illustrates the schedule type. Exact release amounts follow the dates and cadence you choose. All confirmation times are shown in UTC.</p><p class="notice">Tokens stay in the contract. Only the recipient can claim. Network gas is paid in testnet ETH.</p><a :href="network.faucet" target="_blank" rel="noopener noreferrer" class="text-button">Get testnet ETH <ArrowUpRight :size="14"/></a></aside>
    </div>
  </div>
</template>
