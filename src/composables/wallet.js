import { reactive, computed, markRaw } from 'vue'
import { BrowserProvider, JsonRpcProvider, Contract, isAddress, formatUnits } from 'ethers'

export const network = { id: 46630, hex: '0xb626', name: 'Robinhood Chain Testnet', rpc: 'https://rpc.testnet.chain.robinhood.com', explorer: 'https://explorer.testnet.chain.robinhood.com', faucet: 'https://faucet.testnet.chain.robinhood.com' }
export const wallet = reactive({ address: '', chainId: 0, connecting: false, show: false, error: '', providers: [], selected: null })
export const shortAddress = (address) => address ? `${address.slice(0, 6)}…${address.slice(-4)}` : ''
export const onNetwork = computed(() => wallet.chainId === network.id)
export const publicProvider = new JsonRpcProvider(network.rpc, network.id, { staticNetwork: true })
let activeProvider, wrappedProvider
let activeListener, chainListener

export function discoverWallets() {
  if (typeof window === 'undefined') return
  window.addEventListener('eip6963:announceProvider', event => {
    const { info, provider } = event.detail || {}
    if (provider && info && !wallet.providers.some(p => p.id === info.uuid)) wallet.providers.push({ id: info.uuid, name: info.name, provider: markRaw(provider) })
  })
  window.dispatchEvent(new Event('eip6963:requestProvider'))
  if (window.ethereum && !wallet.providers.length) wallet.providers.push({ id: 'injected', name: window.ethereum.isMetaMask ? 'MetaMask' : 'Browser wallet', provider: markRaw(window.ethereum) })
}
export function readableError(error) {
  if (error?.code === 4001 || error?.code === 'ACTION_REJECTED') return 'Request declined in your wallet. Nothing was submitted. You can try again.'
  if (error?.code === 'INSUFFICIENT_FUNDS') return 'You need testnet ETH for gas. Get some from the official faucet.'
  if (error?.code === -32002) return 'A request is already open. Check your wallet to continue.'
  return error?.shortMessage || error?.reason || error?.message || 'Something went wrong. Please try again.'
}
export async function connectWallet(choice) {
  wallet.error = ''; wallet.connecting = true
  try {
    const selected = choice || wallet.providers[0]
    if (!selected) throw new Error('No browser wallet detected. Install an EVM wallet or open this site in your wallet’s browser.')
    const candidate = selected.provider
    const accounts = await candidate.request({ method: 'eth_requestAccounts' })
    const chainId = Number(await candidate.request({ method: 'eth_chainId' }))
    if (!accounts[0]) throw new Error('No wallet account was selected. Please try again.')
    if (activeProvider?.removeListener) { activeProvider.removeListener('accountsChanged', activeListener); activeProvider.removeListener('chainChanged', chainListener) }
    activeProvider = candidate; wallet.selected = selected.name
    wallet.address = accounts[0] || ''
    wallet.chainId = chainId
    wrappedProvider = new BrowserProvider(activeProvider, 'any')
    activeListener = accounts => { wallet.address = accounts[0] || ''; if (!wallet.address) wallet.selected = null }
    chainListener = chainId => { wallet.chainId = Number(chainId); wrappedProvider = new BrowserProvider(activeProvider, 'any') }
    activeProvider.on?.('accountsChanged', activeListener); activeProvider.on?.('chainChanged', chainListener)
    wallet.show = false
  } catch (error) { wallet.error = readableError(error) } finally { wallet.connecting = false }
}
export function disconnectWallet() {
  activeProvider?.removeListener?.('accountsChanged', activeListener); activeProvider?.removeListener?.('chainChanged', chainListener)
  wallet.address = ''; wallet.chainId = 0; wallet.selected = null; activeProvider = undefined; wrappedProvider = undefined; wallet.show = false
}
export async function ensureNetwork() {
  if (!wallet.address || !activeProvider) throw new Error('Connect your wallet first.')
  const current = Number(await activeProvider.request({ method: 'eth_chainId' }))
  if (current !== network.id) {
    try { await activeProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: network.hex }] }) }
    catch (error) {
      if (error.code !== 4902 && error?.data?.originalError?.code !== 4902) throw error
      await activeProvider.request({ method: 'wallet_addEthereumChain', params: [{ chainId: network.hex, chainName: network.name, nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }, rpcUrls: [network.rpc], blockExplorerUrls: [network.explorer] }] })
      await activeProvider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: network.hex }] })
    }
  }
  wallet.chainId = Number(await activeProvider.request({ method: 'eth_chainId' }))
  if (wallet.chainId !== network.id) throw new Error('Please switch to Robinhood Chain Testnet in your wallet.')
  wrappedProvider = new BrowserProvider(activeProvider, 'any')
  const signer = await wrappedProvider.getSigner()
  if ((await signer.getAddress()).toLowerCase() !== wallet.address.toLowerCase()) throw new Error('Your account changed. Reconnect your wallet and try again.')
  return signer
}
export const tokenAbi = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)', 'function approve(address,uint256) returns (bool)', 'function mint(uint256)']
export async function tokenInfo(address) {
  if (!isAddress(address)) throw new Error('Enter a valid ERC-20 contract address.')
  const token = new Contract(address, tokenAbi, publicProvider)
  const [symbol, decimals] = await Promise.all([token.symbol(), token.decimals()])
  if (Number(decimals) > 36) throw new Error('Tokens with more than 36 decimals are not supported in this interface.')
  return { address, symbol, decimals: Number(decimals) }
}
export const displayAmount = (amount, decimals = 6) => Number(formatUnits(amount || 0n, decimals)).toLocaleString('en-US', { maximumFractionDigits: 6 })
