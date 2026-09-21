# Temvorel V2 contracts and testnet deployment

Temvorel V2 is an immutable token scheduling contract on **Robinhood Chain Testnet, chain 46630**. It supports explicit cliff allocations, cadence-based vesting, whole-date locks, finite streams, atomic vested batches, optional cancellation that preserves vested value, and recipient transfers. This is an **unaudited testnet release**; source verification and tests are not an independent security audit.

The presentation brand is now **Temvorel**. The already deployed test token keeps its immutable name **Vestlyr Test USD** (`tUSD`); this rebrand does not rename deployed storage, alter addresses, or migrate schedules.

## Current deployment

| Item | Value |
| --- | --- |
| Contract | `TokenSchedulesV2` |
| Scheduler | [`0x8F3027eabC68040Cb7aaBCE052be59962Fbf5870`](https://explorer.testnet.chain.robinhood.com/address/0x8F3027eabC68040Cb7aaBCE052be59962Fbf5870?tab=contract) |
| Deployment transaction | [`0x4d4647e2f3260f2408c3d89784c0b7c8d6252427d8e9ba9ffe5027bda55bbee9`](https://explorer.testnet.chain.robinhood.com/tx/0x4d4647e2f3260f2408c3d89784c0b7c8d6252427d8e9ba9ffe5027bda55bbee9) |
| Deployment block / time | `120697011` / 17 September 2026, 07:31 UTC |
| Test token | [`0x5Da8aFB8aa2335538D0777E07a37fc0d6a4019DC`](https://explorer.testnet.chain.robinhood.com/address/0x5Da8aFB8aa2335538D0777E07a37fc0d6a4019DC?tab=contract) |
| Token identity | Vestlyr Test USD (`tUSD`), 6 decimals |
| RPC | `https://rpc.testnet.chain.robinhood.com` |
| Chain / gas | `46630` / test ETH |
| Compiler | Solidity `0.8.30+commit.73712a01`, optimizer 200 runs, via IR, Shanghai EVM |
| Verification | Official explorer returned `Pass - Verified`, full source match, at 07:31:50 UTC |

The Vue application imports this address and the V2 ABI from `website/src/config/contracts.json`. The manifest is `contracts/deployments/robinhood-testnet-v2.json`; source verification evidence is `contracts/deployments/verification-v2.json`. The test token retains its earlier verified deployment; its verification record is in `contracts/deployments/verification.json`.

Official configuration: [Connecting to Robinhood Chain](https://docs.robinhood.com/chain/connecting). Mainnet is a different network (`4663`); the deployment script rejects any chain other than **46630**. [Official deployment guidance](https://docs.robinhood.com/chain/deploy-smart-contracts) includes mainnet examples and must be configured explicitly for this testnet.

The test token's `mint(uint256 amount)` allows any wallet to mint a positive amount up to **10,000 tUSD per transaction**. tUSD has **no monetary value, reserves, peg, redemption right or connection to a real stablecoin**. Token minting still needs test ETH for gas, available separately through the [official faucet](https://faucet.testnet.chain.robinhood.com).

## Schedule math and fields

Token quantities are unsigned integers in the token's smallest denomination. Timestamps and cadence are Unix seconds. The contract resolves `start = 0` to the funding transaction's timestamp and `cliff = 0` to that resolved start. Explicit historical starts are accepted; they can make some or all of an allocation immediately claimable. The stored record always contains resolved timestamps.

| Mode | Kind | Constraints | Release rule |
| --- | --- | --- | --- |
| Vesting | `0` | `start <= cliff <= end`, `end > start`, `interval > 0`, `0 <= cliffAmount <= amount` | Nothing vests before cliff; explicit cliff amount vests at cliff; the remainder vests between cliff and end on the selected cadence. |
| Date lock | `1` | `start = cliff = end`, `interval = 0`, `cliffAmount = 0` | Full allocation becomes claimable at the unlock timestamp. |
| Stream | `2` | `cliff = start`, `cliffAmount = 0`, `interval = 1`, `end > start` | A fully funded finite amount accrues per second; the recipient submits claims. |
| Vested batch | `3` | Shared dates/cadence, individual recipients, amounts and cliff allocations | All deposits and records are created atomically; each recipient claims independently. |

For a noncancelled vesting or batch schedule between cliff and end:

```text
elapsed = floor((now - cliff) / interval) * interval
vested = cliffAmount + floor((amount - cliffAmount) * elapsed / (end - cliff))
claimable = vested - claimed
```

Before the cliff, vested value is zero. At or after the end, the full amount is vested, including any rounding remainder. If `cliff = end`, the full amount releases at that timestamp; the division above is never reached. An interval longer than the post-cliff duration is allowed: only the cliff allocation is available before the final release. The maximum `end - start` duration is **3,153,600,000 seconds**. No floating-point arithmetic is used onchain.

### Cancellation and retained recipient rights

Only a creator who enabled `cancelable` may cancel, once. Cancellation is permitted before or after the start, including after earlier claims. At the cancellation transaction's timestamp, the contract:

1. Calculates the vested amount and stores it as `vestedAtCancel`.
2. Refunds **`amount - vestedAtCancel`** to the creator.
3. Preserves **`vestedAtCancel - claimed`** as the recipient's remaining claimable entitlement.
4. Stores `cancelledAt`, `refunded`, and `cancelled = true`.

Previously claimed tokens stay with the recipient. Further time does not increase a canceled schedule's vested amount. Canceling before a cliff refunds the full allocation. Canceling exactly at a cliff preserves the cliff allocation; canceling at or after the end refunds zero. Even a fully claimed cancelable schedule may be marked canceled by its creator, without moving funds. The UI may omit this economically empty action.

A noncancelable schedule cannot be revoked by its creator. It is still exposed to token and smart-contract risk; “irrevocable” is not a guarantee of token value or successful transfer under every token behavior.

Only the current recipient can claim or transfer remaining entitlement to a different nonzero wallet other than the scheduler. Recipient transfer is allowed after cancellation if vested, unclaimed value remains. It changes neither the creator nor amounts, prior claims, dates or cancellation terms. Recipient indexes follow the current owner; sender indexes retain the original records. Fully claimed and canceled records remain publicly readable.

### Accounting example from the live V2 smoke

Schedule `1` was funded with **10 tUSD**, including **2 tUSD at the cliff**. The recipient first claimed **2.266666 tUSD**. An ongoing cancellation froze total vested entitlement at **4.266666 tUSD**, refunded **5.733334 tUSD** to the creator, and left **2 tUSD** available to claim. The subsequent claim succeeded. These amounts sum to the original allocation and are recorded in `contracts/deployments/smoke-test-v2.json`.

## Public application detail

`/lock/{id}` is a shareable, public detail page for a record on the **current V2 deployment**. It can be read without connecting a wallet. It exposes the creator, current recipient, token, exact amounts, cliff allocation, cadence, dates and cancellation settlement. Connected authorized wallets can claim, review cancellation, or transfer remaining rights. Transaction links appear for actions performed through the page. Reads refresh every 20 seconds.

`/locks` is the connected wallet's sender/recipient workspace, while `/create` prepares a new schedule. Creation may require an approval transaction before funding; an existing insufficient allowance may first need a reset. Browser wallet connection is not a server login or proof of a legal identity.

IDs are scoped to a contract deployment. V1 record `1` and V2 record `1` are different schedules. The public route uses the address in the current frontend configuration; it does not silently read or migrate an older V1 record.

## ABI surface

```solidity
createSchedule(address token, address recipient, uint256 amount, uint256 cliffAmount,
  uint64 start, uint64 cliff, uint64 end, uint64 interval, uint8 kind, bool cancelable)
createBatch(address token, address[] recipients, uint256[] amounts, uint256[] cliffAmounts,
  uint64 start, uint64 cliff, uint64 end, uint64 interval, bool cancelable)
claim(uint256 id)
cancel(uint256 id)
transferRecipient(uint256 id, address newRecipient)
claimable(uint256 id) returns (uint256)
vestedAmount(uint256 id) returns (uint256)
getSenderIds(address account) returns (uint256[])
getRecipientIds(address account) returns (uint256[])
schedules(uint256 id)
totalEscrow(address token) returns (uint256)
nextId() returns (uint256)
MAX_BATCH() returns (uint256)
MAX_DURATION() returns (uint256)
```

IDs start at `1`. `schedules(id)` returns `sender, recipient, token, amount, claimed, start, cliff, end, interval, kind, cancelable, cancelled, cliffAmount, cancelledAt, vestedAtCancel, refunded` in that order. Creation emits `ScheduleCreated`; lifecycle events are `Claimed`, `Cancelled` and `RecipientTransferred`. `totalEscrow(token)` tracks recorded funded obligations after claims/refunds; unsolicited direct token transfers are not a schedule and can make the actual token balance larger than tracked obligations.

## Security model and limitations

- The contract has **no administrator, upgrade, pause, fee switch, rescue withdrawal or discretionary escrow access**. V2 is a new immutable deployment; it did not upgrade V1.
- OpenZeppelin **5.4.0** provides `SafeERC20`, `ReentrancyGuard` and overflow-safe `Math.mulDiv`. State-changing entry points are reentrancy guarded. Claims update accounting before transfer; a reverted transfer rolls back the entire action.
- Deposits must increase escrow by the exact requested amount. Outgoing transfers must reduce escrow and increase the recipient by the exact amount. This rejects taxed transfers and silent underpayment. No-return ERC-20 transfers are supported through `SafeERC20`.
- Only fixed-balance, ordinary ERC-20 behavior is supported. A creation-time balance check cannot prevent later rebases, token upgrades, dishonest balance reporting, issuer freezes or blacklists. Such behavior may block claims; there is no admin recovery override.
- Batches have at most **100 records**. The contract permits repeated recipients as separate records; the current web form rejects duplicate addresses to reduce operator mistakes. Validations, funding and record creation revert atomically on failure.
- Sender/recipient reads return complete arrays. The frontend displays a bounded page, but the underlying index read is not paginated; large accounts need a future separately reviewed solution.
- The frontend supports token metadata with at most 36 decimals. Contract arithmetic uses base units; frontend support does not establish a token's economic legitimacy.
- Any production use requires independent review, a supported-asset policy, monitoring, incident procedures, appropriate legal scope and a separate release decision. No real-value safety certification is claimed.

## Validation evidence

The V2 local suite passed **16 tests**. Coverage includes explicit cliff amounts and cadence, end rounding, ongoing cancellation after prior claims, before-cliff and exact-cliff cancellation, zero-refund end cancellation, sender/recipient permissions, retained-claim recipient rotation, start-now sentinels, historical starts, long intervals, cliff-equals-end, date locks, individual batch cliffs, atomic malformed inputs, duration bounds, taxed deposits/outgoing transfers, false/no-return tokens and reentrant funding. See `contracts/test/v2.test.mjs`. V1's separate 15-test suite remains historical and is invoked only with `npm run test:v1`.

The confirmed **12-transaction V2 smoke** ran from **07:31:51 to 07:33:39 UTC on 17 September 2026**. It exercised all four modes across schedule IDs **1–5**, explicit cliff allocations, a start-now stream, a date lock, a two-entry batch, a partial claim, cancellation after start, and a retained-vested claim. Final escrow balance, `totalEscrow` and remaining allowance were all **zero**. Recorded gas spend was **0.00002221351 test ETH**. The controlled deployer was also the recipient, including both batch entries; local tests cover distinct recipients and permissions. Evidence: `contracts/deployments/smoke-test-v2.json`.

The actual V2 frontend `fundSchedule` helper also completed an independent live start-now stream flow for **1 tUSD**, schedule **6**: exact approval, simulation, funding, receipt/event parsing, then a final claim. Import resolution and the signer dependency were adapted for Node; the helper logic was exercised directly. Its funding transaction is [`0xa0d6afc99fef1eaca824e4cbb583f0e4f40ad03b8ec03613795b763dd9dc1bd3`](https://explorer.testnet.chain.robinhood.com/tx/0xa0d6afc99fef1eaca824e4cbb583f0e4f40ad03b8ec03613795b763dd9dc1bd3); claim transaction is [`0x43e31a5c113870d679b68f89703b42610aef4ca6c6e98d351c0e72a9857d8981`](https://explorer.testnet.chain.robinhood.com/tx/0x43e31a5c113870d679b68f89703b42610aef4ca6c6e98d351c0e72a9857d8981). Escrow, tracked escrow and allowance ended at zero. Evidence: `contracts/deployments/frontend-helper-smoke-v2.json`. Browser verification and its limits are maintained in [validation.md](validation.md).

## Reproduction

Local compilation and tests do not need a deployer key:

```powershell
Set-Location contracts
npm ci
npm test
npm run compile
```

The following operations use the configured **testnet** deployment and a runtime deployer key; deployment/smoke actions submit transactions and consume test ETH:

```powershell
npm run check-network
npm run deploy
npm run verify
npm run smoke
```

The default deploy, verify and smoke scripts target V2. Deployment recompiles, checks chain ID, resumes a matching existing V2 address when present, and writes the frontend configuration. It reuses the mock-token address from the original manifest. Smoke requires the deployer to hold at least **15 tUSD** and sufficient test ETH; mint tUSD through its bounded faucet first if needed. The testnet private key is read at runtime from `DEPLOYER_PRIVATE_KEY` or the root `key.txt`; it must never be committed, printed, copied to `website/public`, or exposed through a `VITE_` environment variable.

Compiler inputs, ABI and bytecode are in `contracts/artifacts/`. Current receipts are the `*-v2.json` files in `contracts/deployments/`. Publishing the website does not require rerunning deployment or changing the scheduler address.

## Legacy V1 archive

The original immutable V1 scheduler is [`0x112c566163Cd921B454C1AcABffa5160FAeB2CE3`](https://explorer.testnet.chain.robinhood.com/address/0x112c566163Cd921B454C1AcABffa5160FAeB2CE3?tab=contract). It used accrual from the start with a cliff gate and pre-start-only cancellation. Its records were not migrated or changed by V2. Source, scripts, artifacts, receipts and prior documentation are retained under `contracts/legacy-v1/` and the original non-V2 manifests for historical reproduction. These older addresses, 15 tests and 14-transaction smoke must not be presented as evidence for current V2 semantics.
