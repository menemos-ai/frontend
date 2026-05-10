# CLAUDE.md — Mnemos frontend

The marketplace UI for Mnemos. This is the *reference* marketplace — Mnemos is a protocol, not a platform, so anyone can build a different UI on top of the same contracts. This one is the canonical example shipped with the protocol.

## Multi-repo context

Mnemos is split across three repos:

- **`mnemos-contract`** — Solidity contracts (the on-chain layer)
- **`mnemos-backend`** — TypeScript SDK + reference agent
- **`mnemos-frontend`** (this repo) — Next.js marketplace UI

This repo depends on:

- `mnemos-contract` for deployed addresses (env vars at runtime) and ABIs (literal in `src/lib/contracts.ts`).
- `mnemos-backend` for two things:
  - The published `@mnemos/sdk` package (types only in the frontend — auto-snapshot logic runs in the agent, not here).
  - The `apps/api` NestJS REST API (port 3001) for agent-side operations that require a server wallet (snapshot, mint, load/decrypt memory).

When the contract changes, this repo's ABI in `src/lib/contracts.ts` has to update to match. There is no automatic ABI sync — stale ABIs cause silent encoder failures.

## What this app does

Three core pages plus a landing page:

- `/` — landing. Pitch the protocol, link to marketplace and dashboard.
- `/marketplace` — browse all active listings. Scans `Listed` events from the marketplace contract, filters to currently active, renders cards with prices for all three paths.
- `/listing/[id]` — listing detail. Shows on-chain provenance (content hash, storage URI, lineage ancestors, creator, timestamp) plus the three action panels (buy / rent / fork).
- `/dashboard` — producer view. Lists tokens minted by the connected wallet and provides a form to set listing terms.

Chain reads and user-signed writes go directly through wagmi/viem in the browser. Agent-side operations are delegated to the `mnemos-backend` REST API — the frontend never holds a private key. There's no database and no API routes inside this repo. The app's core browsing and buying flows still work without the backend API running (they read chain directly); the API is only required for memory load/decrypt and agent snapshot features.

## Tech stack

Next.js 14 App Router. `wagmi` + `viem` for chain I/O. `@tanstack/react-query` for caching (provided automatically by wagmi). Tailwind CSS for styling.

All chain-reading pages are client components (`"use client"`) because wagmi hooks are client-only. If a page is purely informational (like the landing), keep it as a server component.

The chain configuration lives in `src/lib/wagmi.ts`. Contract addresses + ABIs in `src/lib/contracts.ts`. These two files are the only places that should know about chain specifics — everything else just imports from them.

### Backend API integration

The `mnemos-backend` REST API runs at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`). The frontend calls it for:

| Endpoint | Used by |
|---|---|
| `GET /api/memory/:tokenId/info` | Listing detail page — provenance info |
| `GET /api/memory/:tokenId` | Listing detail page — decrypt + load bundle |
| `GET /api/marketplace/listings/:tokenId` | Listing detail page — price/terms |
| `POST /api/memory/snapshot` | Reference agent only (not called from UI) |
| `POST /api/marketplace/list` | Dashboard (alternative to wagmi flow) |

User-signed actions (buy, rent, fork) bypass the API entirely and go straight to the chain via `useWriteContract` — the backend API uses the server wallet, not the user's wallet.

All `tokenId`, `price`, and `amount` values the API returns are **decimal strings** (not numbers) to avoid JavaScript `BigInt` precision loss. Parse them with `BigInt(value)` before passing to wagmi or viem.

## Conventions

Component organization: only generic primitives go in `components/` (e.g., `connect-wallet`, `providers`). Page-specific components live next to their page (e.g., `ListingCard` is defined in the same file as the marketplace page). Don't create `components/listing/` subfolders prematurely — let things stay co-located until duplication actually happens.

Styling: Tailwind utility classes inline. The two semantic colors are `ink` (dark) and `paper` (light) — defined in `tailwind.config.ts`. Use `text-ink/70` and `border-ink/10` for muted text and borders. Keep the visual language tight — no shadow stacks, no gradients, no decorative effects. The aesthetic is editorial / archive, not Web3-flashy.

The aesthetic is intentional and not negotiable for this codebase. If you want a different aesthetic, fork this app — don't drift this one.

Reading from chain: use `usePublicClient()` and call `getLogs` / `readContract` directly. Don't reach for an indexer (Subgraph, Goldsky, etc.) until events become too numerous to scan in real time. For hackathon scale, scanning events from `fromBlock: 0n` is fine — for production, set `fromBlock` to the deployment block (recorded in `deployments/<network>.json` of the contract repo).

Writing to chain: use `useWriteContract` from wagmi. The pattern is: call `writeContractAsync`, then `await publicClient.waitForTransactionReceipt({ hash })` if you need confirmation before navigating. The current pages don't wait — they fire-and-forget and let the user reload to see updated state. This is acceptable for the MVP; add optimistic UI or proper reload triggers in v2.

State: prefer URL state + chain state over component state. `[id]` in the route IS the state for the listing page. Don't add `useState` for filters when query params would do the job. The marketplace page should accept `?category=trading` etc. when filters are added.

## Known gaps in the current MVP

The marketplace page reads `Listed` events from `fromBlock: 0n` to `latest` on every mount. This will get slower as block count grows. Replace with a `fromBlock` set to the deployment block — copy it from the contract repo's `deployments/latest.json` and put it in an env var (`NEXT_PUBLIC_DEPLOYMENT_BLOCK`).

The listing detail page calls three `readContract` requests in parallel on mount but doesn't show partial data — it waits for all three. If `getLineage` is slow on a deep tree, this delays the whole page. Acceptable for now; future work is to render basic info immediately and lazy-load the lineage tree.

The dashboard "List on marketplace" button doesn't first call `setApprovalForAll(marketplaceAddress, true)`. Without that approval, the buy transaction will revert at execution time. **Add the approval step** (one-time per wallet) before the demo, either as a dedicated button or as part of the listing flow.

The fork action is shown in the listing detail page but the fork button is disabled — actually executing a fork requires the buyer's agent to upload its child memory bundle first via the SDK, which is a runtime operation, not a UI operation. The fork flow is therefore pitched as "use the SDK" in the UI. This is correct for now; an in-browser fork flow would need the buyer's agent memory to live in the browser, which isn't realistic.

## Common commands

```bash
pnpm dev                     # next dev on localhost:3000
pnpm build                   # production build
pnpm start                   # serve production build
pnpm lint                    # next lint
```

Environment variables (read from `.env.local`):

- `NEXT_PUBLIC_REGISTRY_ADDRESS` — populated after contract deploy
- `NEXT_PUBLIC_MARKETPLACE_ADDRESS` — populated after contract deploy
- `NEXT_PUBLIC_OG_RPC_URL` — 0G Chain RPC
- `NEXT_PUBLIC_OG_CHAIN_ID` — 0G Chain numeric ID
- `NEXT_PUBLIC_API_URL` — base URL of the mnemos-backend REST API (e.g. `http://localhost:3001/api`)

Anything prefixed `NEXT_PUBLIC_` is exposed to the browser; everything else is server-only. Never put a private key in `NEXT_PUBLIC_*`.

## Cross-repo workflow

When iterating on contract changes:

1. Make change in `mnemos-contract`, redeploy (local anvil or a fresh chain deployment).
2. Update `NEXT_PUBLIC_REGISTRY_ADDRESS` / `NEXT_PUBLIC_MARKETPLACE_ADDRESS` in `.env.local`.
3. If the function signature, args, or events changed: update the corresponding ABI entry in `src/lib/contracts.ts`. The ABIs there are minimal — only what the UI actually calls.
4. Restart `pnpm dev` so the env vars reload.

When iterating on SDK changes: nothing to do here unless you're using `@mnemos/sdk` types. The frontend talks to chain directly through wagmi, not through the SDK.

When iterating on backend API changes:
1. If a response shape changes (added/removed field), update the fetch call and any TypeScript interface in the frontend.
2. If the API moves or the port changes, update `NEXT_PUBLIC_API_URL` in `.env.local`.
3. The API must be running for memory-load and provenance-detail features to work — add a graceful fallback or error state if `NEXT_PUBLIC_API_URL` is unset.

## When extending

Adding a new page? Drop it into `src/app/<segment>/page.tsx`. Use `"use client"` if it reads from chain. Add a link in `layout.tsx` if it should appear in the header.

Adding a new chain function call? First add the function to the relevant ABI in `src/lib/contracts.ts`, then call it via `usePublicClient` (read) or `useWriteContract` (write). Keep the ABIs *additive* — don't remove entries even if you stop using them, because deployed contracts at older addresses might still have the older shape.

Adding a filter or sort to the marketplace? Add it as a URL query param, parse it in the page component, and apply it to the listings array client-side. Don't reach for `useState` until you have a real reason.

## Hackathon scope discipline

The frontend is where it's tempting to over-invest. Resist:

- No animation library. Tailwind transitions are enough.
- No design system / shadcn-ui. Plain elements with utility classes.
- No mobile-first redesign. Desktop-first is fine; the demo will be recorded on desktop.
- No real-time updates via websocket / event subscription. A page reload after a transaction is acceptable for the demo.
- No SEO meta / OG image work. Judges click through, they don't share to Twitter.

Do invest in:

- The listing detail page being **information-dense and visually clean**. This is what judges see in the demo video pause-frame.
- The dashboard "List" form being obviously functional.
- The empty state copy. "No listings yet" with a clear CTA reads more confidently than a broken table.
- One distinctive typographic moment on the landing page — a strong headline, decent type pairing, generous whitespace.

If a feature isn't visible in the 3-minute demo video, it doesn't exist for the hackathon.