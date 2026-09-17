# Vestlyr contracts and testnet deployment

Vestlyr has a working, immutable token scheduling contract on Robinhood Chain Testnet. It supports vesting with a cliff and release cadence, whole-date locks, per-second streams, and atomic vested airdrops for up to 100 recipients. This is a testnet release, not an audited production deployment.

## Deployment

| Item | Value |
| --- | --- |
| Network | Robinhood Chain Testnet |
| Chain ID | 46630 |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Native gas asset | Test ETH |
| Scheduler | [`0x112c566163Cd921B454C1AcABffa5160FAeB2CE3`](https://explorer.testnet.chain.robinhood.com/address/0x112c566163Cd921B454C1AcABffa5160FAeB2CE3?tab=contract) |
| Demonstration token | [`0x5Da8aFB8aa2335538D0777E07a37fc0d6a4019DC`](https://explorer.testnet.chain.robinhood.com/address/0x5Da8aFB8aa2335538D0777E07a37fc0d6a4019DC?tab=contract) |
| Token | Vestlyr Test USD (`tUSD`), 6 decimals |
| Deployer | `0x8b3283a9291373069f79508da59001e807bB394F` |
| Scheduler deployment transaction | [`0x1c4ad9da1ddbd931c420a99bfdab6cff17320121590c133e228a990e5f96ff4e`](https://explorer.testnet.chain.robinhood.com/tx/0x1c4ad9da1ddbd931c420a99bfdab6cff17320121590c133e228a990e5f96ff4e) |
| Token deployment transaction | [`0x8954fc420f1c74c5b99683f5f4055e4b2331f2f10f3aded5f57435ae2999ade5`](https://explorer.testnet.chain.robinhood.com/tx/0x8954fc420f1c74c5b99683f5f4055e4b2331f2f10f3aded5f57435ae2999ade5) |
| Compiler | Solidity `0.8.30+commit.73712a01`, optimizer 200 runs, via IR, Shanghai EVM |
| Source verification | Both contracts verified on the official explorer |

Official network settings were checked against Robinhood's [connecting documentation](https://docs.robinhood.com/chain/connecting) and [wallet network documentation](https://docs.robinhood.com/chain/add-network-to-wallet), then against the live RPC `eth_chainId`. Deployment guidance is published at [Deploy smart contracts](https://docs.robinhood.com/chain/deploy-smart-contracts). The deployment script refuses any chain ID other than 46630.

The token faucet is `mint(uint256 amount)`: anyone may mint between 1 base unit and 10,000 tUSD per transaction. tUSD is a freely mintable demonstration asset with no monetary value, reserves, peg, redemption rights, or connection to a real stablecoin. Test ETH is obtained separately from the [Robinhood testnet faucet](https://faucet.testnet.chain.robinhood.com); external faucet rate limits may apply.

## Schedule semantics

All token quantities are integers in the token's smallest denomination; all timestamps and intervals are Unix seconds. A start must not be in the past when its transaction executes. The interface should reserve a time buffer for wallet signing.

| Mode | Kind | Required fields | Release rule |
| --- | --- | --- | --- |
| Vesting | 0 | `start <= cliff <= end`, `end > start`, `1 <= interval <= end-start` | Accrues from start; claims open at cliff; elapsed time is rounded down to the interval |
| Date lock | 1 | `start = cliff = end`, `interval = 0` | Entire amount unlocks at the stored timestamp |
| Stream | 2 | `start <= cliff <= end`, `end > start`, `interval = 1` | Same vesting calculation at one-second cadence |
| Batch vested airdrop | 3 | Shared vesting timestamps/cadence; independent recipients and amounts | All deposits and records are created atomically; each recipient claims independently |

Before the cliff, the claimable amount is zero. From the cliff until the end, vested value is `floor(amount * (floor((now-start)/interval)*interval) / (end-start))`. At or after the end, the full amount is vested, including any rounding remainder. The cliff is a claim gate, not a separate cliff allocation. Withdrawable value is vested value minus already claimed value.

The sender chooses whether a schedule is cancelable. If enabled, only that sender can cancel, strictly before `start`; the entire original deposit is refunded. At `start` and afterwards, cancellation is impossible. A canceled schedule cannot be claimed or transferred. This consistent rule is also shown in the interface; the reference project's conflicting cancellation descriptions were not carried over.

Only the current recipient may claim. The current recipient may call `transferRecipient` to move the entire remaining entitlement to a different nonzero wallet. Its amount, claimed amount, sender, dates and cancellation flag do not change. Recipient indexes are updated in place; sender indexes remain historical. Fully claimed and canceled schedules remain readable.

## Interface

```solidity
createSchedule(address token, address recipient, uint256 amount,
  uint64 start, uint64 cliff, uint64 end, uint64 interval, uint8 kind, bool cancelable)
createBatch(address token, address[] recipients, uint256[] amounts,
  uint64 start, uint64 cliff, uint64 end, uint64 interval, bool cancelable)
claim(uint256 id)
cancel(uint256 id)
transferRecipient(uint256 id, address newRecipient)
claimable(uint256 id) returns (uint256)
vestedAmount(uint256 id) returns (uint256)
getSenderIds(address account) returns (uint256[])
getRecipientIds(address account) returns (uint256[])
schedules(uint256 id)
nextId() returns (uint256)
```

IDs start at 1. The `schedules` getter returns `sender, recipient, token, amount, claimed, start, cliff, end, interval, kind, cancelable, cancelled` in that order. Creation emits `ScheduleCreated`; state changes emit `Claimed`, `Cancelled`, and `RecipientTransferred`. The Vue app imports the deployed addresses and complete ABIs from `website/src/config/contracts.json`.

## Security model and limits

- The deployed contract has no administrator, upgrade mechanism, pause mechanism, protocol fee, rescue withdrawal, or third-party escrow drain. Its deployer has no privileged access.
- Funds are held by the smart contract and released only under its stored rules. Wallet signatures authorize each creation, approval, claim, cancellation, or transfer. Wallet connection itself is not a transaction or an identity attestation.
- OpenZeppelin 5.4.0 supplies `SafeERC20`, `ReentrancyGuard`, and overflow-safe `Math.mulDiv`. State-changing public entry points are guarded against reentrancy; claims update accounting before transfer.
- Incoming deposits must increase escrow balance by exactly the requested amount. Outgoing transfers must reduce escrow and increase the recipient by exactly the requested amount. This rejects taxed transfers and silent underpayments; tokens returning no transfer data are supported.
- Fixed-balance, standard ERC-20s are the supported asset class. Future token rebases, malicious balance reporting, issuer freezes, blacklists, and token upgrades cannot be ruled out when creating a schedule. Balance checks do not prove that an arbitrary token is trustworthy. Such behavior can freeze a schedule; no administrator can override it.
- A batch is limited to 100 entries. Repeated recipient addresses are allowed and create separate independent records. Arithmetic, validations, token funding, and schedule creation all revert together on failure.
- The testnet application is not an audit, insurance product, legal vesting agreement, or custody service. Production launch requires independent review, an asset allowlist and token-risk policy, monitoring, incident procedures, load testing and an explicit deployment decision. Full-array indexes are suitable for this release; large accounts should gain paginated reads in a future separately deployed version.

## Validation and reproduction

The local suite passed all 15 tests: cliff gating, intermediate and final accounting, repeated claims and double-claim rejection, cadence rounding, exact lock deadline, second-by-second streaming, optional cancellation permissions and boundary, batch accounting and indexes, atomic invalid batches, recipient rotation permissions/indexes, malformed inputs/unknown IDs, taxed incoming tokens, taxed outgoing tokens, false-return tokens, no-return tokens, malicious reentrancy, and the bounded test faucet. Ganache falls back to its JavaScript transport on Node 24 for Windows; this affected performance only and all tests completed.

The live testnet smoke run completed successfully on 2026-09-17 at 06:36:54 UTC with process exit code 0. Its 14 successful transactions exercised minting, approval, a cancellable lock/refund, vesting, streaming, an unlocking date lock, an atomic two-entry vested airdrop, five final claims and allowance reset. Schedule IDs 7–12 contain this run. The controlled deployer was also the recipient (including both batch entries); the local tests separately validate distinct recipients and permissions. The final escrow balance was 0 tUSD, the remaining approval was reset to zero, and this run used 0.00002258684 test ETH. Transaction receipts and per-schedule claimed quantities are retained in `contracts/deployments/smoke-test.json`.

```powershell
cd contracts
npm ci
npm test
npm run compile
npm run check-network
npm run deploy
npm run verify
npm run smoke
```

`npm test` compiles fixtures for the local chain. `npm run deploy` recompiles production contracts, checks the chain, resumes existing deployed addresses instead of redeploying, and writes the website configuration. The deployment key is read only at runtime from `DEPLOYER_PRIVATE_KEY` or the workspace's `key.txt`; the frontend, ABI files, build and deployment manifests never contain the key. Do not publish the workspace key file.

Deployment receipts are in `contracts/deployments/robinhood-testnet.json`. Explorer verification responses are in `contracts/deployments/verification.json`. The reproducible compiler input, bytecode and ABIs are in `contracts/artifacts/`. The live smoke script records every transaction and its result in `contracts/deployments/smoke-test.json`.
