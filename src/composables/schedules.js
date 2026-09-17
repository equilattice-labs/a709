import { Contract, parseUnits, isAddress, ZeroAddress } from 'ethers'
import config from '../config/contracts.json'
import { publicProvider, ensureNetwork, tokenAbi, tokenInfo, network } from './wallet'

export { config }
export const scheduler = new Contract(config.schedulerAddress, config.schedulerAbi, publicProvider)
export const dateLabel = seconds => new Date(Number(seconds) * 1000).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
export const modeNames = ['Token vesting', 'Token lock', 'Payment stream', 'Vested airdrop']
export function validRecipient(address) { return isAddress(address) && address.toLowerCase() !== ZeroAddress && address.toLowerCase() !== config.schedulerAddress.toLowerCase() }
export function exactAmount(value, decimals) {
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(String(value).trim())) throw new Error('Use a positive amount without commas or scientific notation.')
  let amount
  try { amount = parseUnits(String(value).trim(), decimals) } catch { throw new Error(`This token supports at most ${decimals} decimal places. Reduce the precision and try again.`) }
  if (amount <= 0n) throw new Error('Every token amount must be greater than zero.')
  if (amount >= 2n ** 256n) throw new Error('That token amount is too large.')
  return amount
}
export async function waitForTransaction(tx) {
  try {
    const receipt = await tx.wait()
    if (receipt.status !== 1) throw new Error('The transaction reverted. Your schedule was not changed.')
    return receipt
  } catch (error) {
    if (error.code === 'TRANSACTION_REPLACED' && !error.cancelled && error.receipt?.status === 1) return error.receipt
    throw error
  }
}
export async function fundSchedule(plan, progress) {
  if (!config.deployed) throw new Error('The testnet deployment is not configured yet.')
  const signer = await ensureNetwork()
  const address = await signer.getAddress()
  const token = new Contract(plan.token.address, tokenAbi, signer)
  const total = plan.amounts.reduce((sum, amount) => sum + amount, 0n)
  const balance = await token.balanceOf(address)
  if (balance < total) throw new Error(`Insufficient ${plan.token.symbol} balance. Mint test tokens or reduce the amount.`)
  const latestBlock = await publicProvider.getBlock('latest')
  if (plan.start <= latestBlock.timestamp + 15) throw new Error('The start time is too close or has passed. Set a later start and review again.')
  let allowance = await token.allowance(address, config.schedulerAddress)
  if (allowance < total) {
    if (allowance > 0n) {
      progress('approval', 'Reset the existing token allowance to zero in your wallet.')
      await waitForTransaction(await token.approve(config.schedulerAddress, 0n, { chainId: network.id }))
    }
    progress('approval', `Approve exactly ${plan.totalLabel} ${plan.token.symbol} in your wallet.`)
    const approveTx = await token.approve(config.schedulerAddress, total, { chainId: network.id })
    progress('approval', 'Token approval submitted. Waiting for confirmation…', approveTx.hash)
    await waitForTransaction(approveTx)
  }
  // Recheck time and account after the approval, which may take several minutes.
  const currentSigner = await ensureNetwork()
  if ((await currentSigner.getAddress()).toLowerCase() !== address.toLowerCase()) throw new Error('Your wallet account changed after approval. Review again from the new account.')
  const currentBlock = await publicProvider.getBlock('latest')
  if (plan.start <= currentBlock.timestamp) throw new Error('The start time passed during approval. Tokens were not funded; set a later start. Your token allowance may remain.')
  const contract = scheduler.connect(currentSigner)
  const args = plan.mode === 'airdrop'
    ? [plan.token.address, plan.recipients, plan.amounts, plan.start, plan.cliff, plan.end, plan.interval, plan.cancelable]
    : [plan.token.address, plan.recipients[0], plan.amounts[0], plan.start, plan.cliff, plan.end, plan.interval, plan.kind, plan.cancelable]
  const method = plan.mode === 'airdrop' ? contract.createBatch : contract.createSchedule
  await method.staticCall(...args)
  progress('funding', 'Confirm funding in your wallet. This sets the schedule onchain.')
  const tx = await method(...args, { chainId: network.id })
  progress('funding', 'Schedule submitted. Waiting for onchain confirmation…', tx.hash)
  const receipt = await waitForTransaction(tx)
  const ids = receipt.logs.filter(log => log.address.toLowerCase() === config.schedulerAddress.toLowerCase()).map(log => { try { const parsed = scheduler.interface.parseLog(log); return parsed?.name === 'ScheduleCreated' ? parsed.args.id.toString() : null } catch { return null } }).filter(Boolean)
  progress('complete', ids.length === plan.recipients.length ? `Your ${ids.length === 1 ? 'schedule is' : `${ids.length} schedules are`} onchain.` : 'The transaction is confirmed. Open your workspace or the explorer to verify the schedule IDs.', receipt.hash)
  return ids
}
const tokenCache = new Map()
export async function loadSchedules(address, role, offset = 0, limit = 12) {
  const ids = role === 'sent' ? await scheduler.getSenderIds(address) : await scheduler.getRecipientIds(address)
  const ordered = [...new Set(ids.map(id => id.toString()))].reverse()
  const selected = ordered.slice(offset, offset + limit)
  const records = await Promise.all(selected.map(async id => {
    const [record, claimable] = await Promise.all([scheduler.schedules(id), scheduler.claimable(id)])
    const tokenKey = record.token.toLowerCase()
    if (!tokenCache.has(tokenKey)) tokenCache.set(tokenKey, tokenInfo(record.token).catch(() => { tokenCache.delete(tokenKey); return { address: record.token, symbol: 'TOKEN', decimals: null } }))
    const token = await tokenCache.get(tokenKey)
    return { id, sender: record.sender, recipient: record.recipient, token, amount: record.amount, claimed: record.claimed, start: Number(record.start), cliff: Number(record.cliff), end: Number(record.end), interval: Number(record.interval), kind: Number(record.kind), cancelable: record.cancelable, cancelled: record.cancelled, claimable }
  }))
  return { records: records.filter(record => role === 'sent' || record.recipient.toLowerCase() === address.toLowerCase()), total: ordered.length }
}
