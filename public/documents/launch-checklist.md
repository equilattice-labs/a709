# Temvorel — deployment and launch checklist

Prepared 17 September 2026. This is an operational handoff for the **Robinhood Chain Testnet** release. It does not claim that `temvorel.xyz` is owned, that `@temvorel` is registered, or that the website has been published to either identifier.

## Current package and deployment facts

| Item | Location / evidence |
| --- | --- |
| Vue 3 + Vite website | `website/` |
| Website package lock | `website/package-lock.json` |
| SPA routes | `/`, `/create`, `/locks`, `/lock/{id}`, `/docs`, `/legal` |
| Static documents and artwork | `website/public/documents/`, `website/public/brand/` |
| Testnet contract addresses and ABIs | `website/src/config/contracts.json` |
| Scheduler V2 | `0x8F3027eabC68040Cb7aaBCE052be59962Fbf5870` |
| Test token | `0x5Da8aFB8aa2335538D0777E07a37fc0d6a4019DC` |
| Network | Robinhood Chain Testnet, **46630**, ETH gas |
| Onchain deployment, verification and smoke receipts | `contracts/deployments/*-v2.json` and [contracts.md](contracts.md); 16 local V2 tests, a 12-transaction smoke, and the independent V2 frontend-helper flow |
| Business plan | [business-plan.md](business-plan.md) |
| Domain / handle checks and uncertainty | [name-availability.md](name-availability.md) |

The website reads public chain data and submits wallet-approved transactions; it does not require the deployment private key. The mock token is **tUSD**, a freely mintable test asset without monetary value, reserves, a peg or redemption rights. Source verification and successful tests are not an independent security audit.

## 1. Reproduce a production build locally

Use **Node.js 22.12 or later in the Node 22 LTS line** and npm. Vite 7 also supports newer compatible Node versions; use a consistent Node version in development and hosting. From the project root in PowerShell:

```powershell
Set-Location -LiteralPath 'E:\workspace\chuangye\709\website'
node --version
npm --version
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173`. The production artifact is **`website/dist/`**. Stop the preview with Ctrl+C when finished. The working development session may separately use `http://127.0.0.1:4179`; a local port is not a published URL.

Check `/create`, `/locks`, `/lock/1`, `/docs` and `/legal` both through navigation and by pasting the URL into a fresh tab. Read `/lock/1` with the wallet disconnected, including its canceled settlement; test an invalid/nonexistent ID and copy-link behavior. Open at least one downloaded document and an image under `/brand/`. Inspect mobile width, keyboard focus, reduced motion, empty wallet state and transaction error feedback. A successful build alone does not verify the wallet workflow.

No backend secret or private key is needed as a Vite environment variable. Vite variables prefixed `VITE_` are public in the browser bundle. **Never put `key.txt`, `DEPLOYER_PRIVATE_KEY`, seed phrases or authentication tokens into `website/public/`, the website configuration, environment variables exposed to Vite, or a public repository.** Public contract addresses and ABIs are expected in the bundle.

## 2. Deploy to Vercel

### Git-based deployment

Create/import a repository using the intended owner's Git and Vercel accounts. Review the file list before pushing: the root `.gitignore` excludes `key.txt`, `.env*`, `node_modules/` and `dist/`. A `.gitignore` does not remove a secret already tracked in Git. Publish only reviewed source; do not upload the entire unfiltered workspace archive.

In **Vercel → Add New Project → Import**, use:

| Setting | Value |
| --- | --- |
| Root Directory | **`website`** |
| Framework Preset | **Vite** |
| Node.js Version | **22.x** |
| Install Command | **`npm ci`** |
| Build Command | **`npm run build`** |
| Output Directory | **`dist`** |
| Environment variables | None required for the current public-RPC testnet configuration. |

Deploy a preview first. Open its actual `*.vercel.app` URL and run the smoke checks below before promoting a production deployment.

### Optional Vercel CLI route

The following commands use Vercel's official npm package and the intended owner's authenticated hosting account. They create external deployments when run. From the project root:

```powershell
Set-Location -LiteralPath 'E:\workspace\chuangye\709'
npx --yes vercel@latest --cwd website
```

Follow the normal account/project prompts. Confirm that the linked project uses the `website` directory as the source, `npm ci`, `npm run build`, and `dist`. The command prints a preview URL. After reviewing that concrete deployment, publish with:

```powershell
npx --yes vercel@latest --cwd website --prod
```

Do not add `--yes` to Vercel's project prompts until the linked account, project and source directory are known. The `--yes` shown before `vercel@latest` belongs to **npx package execution**, not to Vercel account or project selection. These commands are a handoff, not evidence that a hosting account is connected or a deployment has already occurred.

### SPA history fallback

The repository already includes `website/vercel.json`. Its rewrite sends frontend paths to `index.html` while keeping `brand/`, `documents/` and built `assets/` paths distinct:

```json
{
  "rewrites": [
    {
      "source": "/((?!brand/|documents/|assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

Preserve the existing security headers in that file. Do not replace it with this excerpt merely to add the same rewrite. If deploying to another static host, configure equivalent history fallback while serving static files normally; refreshing `/create` must not produce a 404, and a JPG download must not return HTML. Serve over HTTPS.

## 3. Verify the hosted preview

- [ ] The homepage loads at the actual preview URL with Temvorel branding, readable English text and original artwork.
- [ ] Direct requests and refreshes on `/create`, `/locks`, `/lock/1`, `/docs` and `/legal` load correctly. Public schedule details load without a connected wallet; IDs refer to the current V2 deployment.
- [ ] `/documents/business-plan.md`, the contract guide, brand-kit download and `/brand/` artwork return the correct file types.
- [ ] The network indicator and transaction gate use **46630**, never Robinhood mainnet `4663`.
- [ ] An installed EVM wallet connects; account changes and disconnects update the page. Declining a signature produces a useful message.
- [ ] With a test wallet and test ETH, mint tUSD, approve a small amount, create a short schedule, inspect its receipt, and claim after the correct time. Include an explicit cliff amount and an ongoing cancellation that preserves vested claims. Record the transaction hashes and reset any unused approval if appropriate.
- [ ] Wrong recipient, malformed address, invalid dates, insufficient balance and wrong-network states are handled before misleading success feedback.
- [ ] Sender and recipient views match the deployed contract revision, including a recipient transfer and cancellation that refunds only unvested value while preserving vested claims.
- [ ] No real-value asset, independently audited status, official Robinhood affiliation, acquired domain or acquired X handle is implied.
- [ ] Browser console and network errors have been reviewed. Public-RPC rate limits show an explicit retry/error state.
- [ ] Mobile layout, keyboard navigation, contrast and reduced-motion behavior are usable.

Use fresh, bounded test schedules. In the revised contract, a cancelable schedule can be canceled after starting; cancellation preserves already vested claims and refunds only unvested value. The recipient can still claim or transfer remaining entitlement after cancellation. Verify these rules against the exact address/ABI in the deployment manifest. Fully funded schedules and claims are public transactions even on testnet. Existing local and live smoke results in `contracts/deployments/` remain useful evidence, but a new hosting environment should also be checked for asset routing, HTTPS, wallet origin behavior and RPC access.

## 4. Secure the matching domain and X identity

The prepared identity is **Temvorel / temvorel.xyz / @temvorel**. Consult the current dated [name-availability.md](name-availability.md) record and its primary evidence before registration. Availability checks do not reserve or acquire either identifier.

- [ ] Verify registrar checkout availability and renewal price for `temvorel.xyz`.
- [ ] Recheck `@temvorel` in the intended owner's legitimate X username-selection flow before acquisition. The official preflight is positive point-in-time evidence, not a reservation or a guarantee of final registration.
- [ ] Secure both identifiers through the intended owner's accounts. Record owner, recovery contact, renewal date and access policy without putting credentials in this repository.
- [ ] After domain ownership exists, add `temvorel.xyz` under **Vercel Project → Settings → Domains**. Use the DNS records Vercel displays for that exact project; do not rely on a guessed historic A/CNAME value.
- [ ] Wait for Vercel to confirm DNS and issue HTTPS. Choose the canonical apex or `www` hostname and configure the alternate to redirect.
- [ ] Confirm the custom-domain site, deep links, downloads, canonical metadata and social-preview image.

Do not point the domain at localhost. Domain ownership and a Vercel deployment are separate from contract deployment; publishing the frontend does not require redeploying the verified testnet contracts.

## 5. Publish the launch materials

Only after the intended X account exists and the hosted site has passed review:

- [ ] Set the X name, bio, avatar and banner from the prepared English launch package.
- [ ] Preview banner cropping on desktop/mobile and ensure the avatar does not cover essential text.
- [ ] Check each of the three prepared posts against its matching JPG. Add descriptive alt text.
- [ ] Use the actual live domain only after it resolves and HTTPS is valid; otherwise use the verified preview URL and state that it is a preview.
- [ ] Recheck every feature claim against the shipped guide, especially explicit cliff allocation, cancellation/refund accounting and test-only tUSD.
- [ ] Publish only through an account the owner has authorized. Record post URLs after publication rather than treating draft copy as posted.

The recommended cadence is introduction → four schedule patterns → short testnet walkthrough. No future airdrop reward, token price or investment return should be implied. The public calls to action should lead to a working page or explain exactly how to access the testnet.

## 6. Milestones and release gates

| Milestone | Completion evidence | Release gate |
| --- | --- | --- |
| Testnet implementation | Source, tests, deployment/verification receipts and demonstrated create → claim flow. | Zero known critical correctness issue; product copy matches contract behavior. |
| Hosted preview | Vercel deployment URL plus routing/wallet/asset checks. | No secret exposure; correct network and errors; English content and responsive UI. |
| Public brand launch | Domain ownership, working HTTPS site, confirmed X account and recorded published posts. | Both identifiers actually controlled; claims accurate; social links functional. |
| Five design partners | Consent-based sessions, feedback notes and repeated independent test workflows. | At least three repeat users and understandable cliff/cancellation rules. |
| Paid workspace experiment | Shipped paid capability, commercial terms, hosted payment and tested cancel/export path. | Concrete willingness to pay; claims/escrow remain accessible without subscription. |
| Any real-value launch | Independent security review, remediation evidence, token policy, legal scope, monitoring and incident runbook. | Separate explicit production decision; do not equate testnet success with production approval. |

Business targets, budgets and stop criteria are detailed in [business-plan.md](business-plan.md). A static pricing section is not a functioning payment business; a local development server is not a public website; a missing social profile is not a registered handle.

## 7. Recovery and maintenance

Keep the prior known-good Vercel deployment available for rollback. If a new website release fails, use Vercel's deployment rollback rather than modifying contract addresses as an emergency workaround. Verify deep links and wallet reads again after rollback.

An immutable contract cannot be rolled back with the website. If a contract issue is suspected, stop promoting new deposits, show a factual network/address-specific notice, retain direct source/explorer references, and follow the incident procedure in the business plan. Never promise administrative reversal or fund recovery that the contract does not support.

Monitor HTTPS, domain renewal, basic page uptime and RPC read failures. Before updating dependencies, rebuild and repeat relevant wallet/route checks. For sustained public traffic, replace reliance on a single rate-limited public RPC with an appropriately provisioned provider and fallback strategy; any browser-exposed provider key must be scoped as public and restricted by the provider's supported origin/quota controls.
