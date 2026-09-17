# Vestlyr — name and availability record

Checked on **17 September 2026**, approximately **06:24 UTC / 14:24 China Standard Time**. This is a point-in-time research record, not a reservation.

## One selected identity

| Item | Selected value | Meaning / status |
| --- | --- | --- |
| Project | **Vestlyr** | A blend of **vest** and **layer**: the release layer for token commitments. Pronounced **VEST-leer**. |
| Domain | **vestlyr.xyz** | No registered domain object returned by the authoritative `.xyz` RDAP service at the check time. |
| X handle | **@vestlyr** | No public profile found. X registration eligibility remains unverified. |
| Exact shared string | `vestlyr` | Seven lowercase letters; no numbers, underscores or suffixes. |

No project token or token sale is proposed. A ticker is unnecessary for this product and is not reserved by this name check.

## Evidence and interpretation

1. **Domain registration:** `GET https://rdap.centralnic.com/xyz/domain/vestlyr.xyz` returned HTTP **404** with a valid RDAP error object: `errorCode: 404`, `title: "Object not found"`, `description: ["Object not found"]`. This supports **unregistered at query time**, rather than an inference from an empty website or DNS failure. It does not establish a registrar's checkout price, premium status, reservation policy, or future availability. [Saved response](evidence/name-vestlyr-rdap.json).
2. **X public profile:** `GET https://x.com/vestlyr` returned HTTP **404** and the title **“User Profile Not Found - X | 404 Error”**. This establishes **no public profile found**, not a guarantee that X will permit this username at signup. Suspended, deactivated, reserved or newly claimed usernames can remain unavailable. [Saved response](evidence/name-vestlyr-x.json).
3. **Existing projects — public web:** a rendered Google exact-phrase search for [`"Vestlyr"`](https://www.google.com/search?q=%22Vestlyr%22) was inspected. Results included incidental text and a personal forum username; no same-name software, token or crypto project was identified in the results returned. This is a preliminary screen, not an assertion that the string has never been used by anyone. [Observation record](evidence/brand-search-observation.md).
4. **GitHub:** the public repository search [`q=vestlyr`](https://api.github.com/search/repositories?q=vestlyr) returned `total_count: 0`, `incomplete_results: false`. This covers publicly indexed matching repositories, not private projects or all registered organizations. [Saved response](evidence/name-vestlyr-github.json).
5. **CoinGecko:** the public [search endpoint](https://api.coingecko.com/api/v3/search?query=vestlyr) returned empty coins, exchanges, ICOs, categories and NFT arrays. This is a catalog check, not proof of all-chain token-name exclusivity. [Saved response](evidence/name-vestlyr-coingecko.json).
6. **DefiLlama:** none of the **8,271 protocol names** in the [protocol catalog](https://api.llama.fi/protocols) contained `vestlyr` in a case-insensitive comparison. [Saved result and timestamp](evidence/name-vestlyr-defillama.json).

Trademark registries, company registries in every jurisdiction, unindexed projects and private teams were not exhaustively searched. Before spending materially on launch, commission a legal clearance search in the intended operating markets. The same-name project screen found no relevant conflict in the sources above; it cannot prove universal uniqueness.

## Why the supplied Outrive identity was not used

The preferred `outrive.xyz` already returned a registered domain object, handle `D631044162-CNIC`, from [authoritative RDAP](https://rdap.centralnic.com/xyz/domain/outrive.xyz). The X page at [x.com/outrive](https://x.com/outrive) returned HTTP 200 with the title **“vernon ren (@outrive) / X”**. These concrete conflicts prevent meeting the requested matching, unregistered identity with Outrive. The record does not establish whether either existing asset belongs to the requester. [Domain evidence](evidence/initial-0.json), [X evidence](evidence/initial-1.json).

## Registration handoff

Use **Vestlyr / vestlyr.xyz / @vestlyr** as the single prepared identity. Recheck the domain at registrar checkout and the handle in X's own username selection before committing brand spend. Confirm both first; secure them in the same session if possible. No domain purchase, account creation, credentials, public post or DNS change was performed during this research. Availability can change immediately.

**Completion boundary:** the live domain and public-profile checks are complete. Successful registration of both identifiers, X username eligibility, ownership, and legal name clearance are not established. No public-facing material should describe either identifier as already owned until that changes.

## Additional X eligibility attempt

At **06:44–06:46 UTC on 17 September 2026**, an additional read-only check attempted to obtain an actual availability decision from X. Requests to `https://api.x.com/1.1/users/username_available.json?username=vestlyr` and the historical `api.twitter.com` equivalent both returned **HTTP 404 with empty bodies**. Neither returned an availability boolean or a recognized username validation result. These responses therefore add **no affirmative registration evidence**. [X-host response](evidence/name-vestlyr-x-username-endpoint.json), [historical-host response](evidence/name-vestlyr-x-legacy-endpoint.json).

The public signup URL `https://x.com/i/flow/signup` was also inspected in a browser. It redirected to `https://x.com/i/jf/onboarding/web?mode=signup` and showed an identification/sign-in screen with an **“Email or username”** field and provider/phone options. No standalone new-username selector or availability indicator was visible. The page said that continuing agrees to its Terms of Service. The inspection stopped before submitting identification, choosing a provider, accepting terms, or entering an account-creation flow. No credentials were accessed, no authentication was bypassed, and no account/profile was created or changed.

**Exact remaining blocker:** X did not expose a usable unauthenticated availability response through the attempted endpoint or a standalone username-selection screen. Verifying `@vestlyr` registration eligibility requires access to X's legitimate username selection/registration flow with the intended account owner. It cannot be inferred from a missing public profile, and no such inference is made here.
