---
title: "feat: Build Mnemos Frontend from Scratch"
type: feat
status: active
date: 2026-05-07
origin: docs/brainstorms/2026-05-07-001-frontend-rebuild-requirements.md
---

# feat: Build Mnemos Frontend from Scratch

## Overview

Build the complete Mnemos marketplace UI from an empty repository. The current state is a single `package.json` with only `shadcn` as a dev dependency — no Next.js app, no pages, no source files. This plan produces four pages (`/`, `/marketplace`, `/listing/[id]`, `/dashboard`), a typed backend API client, a tested utility layer, and a Vitest test suite — all conforming to the design system and integration contracts defined in the requirements document.

---

## Problem Frame

The frontend repo is a stub. The hackathon demo requires a working marketplace that reads live chain state, lets users connect wallets, and surfaces buy/rent/fork actions backed by real on-chain transactions. The backend NestJS API (port 3001) is already running and provides memory info, bundle decryption, and listing terms; the frontend must integrate against it without duplicating chain-read logic that wagmi already handles.

See origin: `docs/brainstorms/2026-05-07-001-frontend-rebuild-requirements.md`

---

## Requirements Trace

- R1. Marketplace page reads `Listed` events from chain and renders listing cards.
- R2. Listing detail shows provenance info (from backend API) + buy/rent/fork action panels.
- R3. Dashboard shows wallet-owned tokens (from chain events) and a listing form with the `setApprovalForAll` approval step.
- R4. Landing page is visually presentable for demo screenshots.
- R5. `pnpm build` passes clean — no TypeScript errors, no unresolved imports.
- R6. Unit and integration tests cover API parsing, BigInt conversion, and critical UI interactions.
- R7. No duplicate or redundant code — each concern has one canonical home.

---

## Scope Boundaries

- No mobile layout — desktop-first only.
- No light/dark toggle — dark theme locked via `forcedTheme="dark"`.
- No SEO meta tags or OG images.
- No real-time updates — user reloads after transaction.
- No fork transaction flow — Fork panel is disabled with "use the SDK" copy.
- No `fromBlock` optimization — scan from `0n` (acceptable for testnet).
- No authentication or rate-limiting on the backend — out of scope.

### Deferred to Follow-Up Work

- `fromBlock` env-var optimization: separate task once deployment block is known.
- Optimistic UI after transactions: v2 iteration.
- Playwright e2e tests against a live testnet: separate task.

---

## Context & Research

### Relevant Patterns

- Backend API shape: `apps/api/src/marketplace/marketplace.controller.ts`, `apps/api/src/memory/memory.controller.ts` — all BigInt values returned as decimal strings.
- SDK types: `packages/sdk/src/types.ts` — `MemoryBundle`, `MemoryInfo`, `ListingTerms`.
- Backend env: viem v2.9.0 is the peer version — frontend should use `viem ^2.9.0` or later.

### External Research Findings

**wagmi v2 + RainbowKit v2 (critical):**
- Use `getDefaultConfig` from `@rainbow-me/rainbowkit` — wraps wagmi config + includes wallet connectors in one call.
- SSR pattern: `ssr: true` + `cookieStorage` + `cookieToInitialState` in `layout.tsx` to avoid hydration mismatch.
- Provider nesting order is mandatory: `WagmiProvider` → `QueryClientProvider` → `RainbowKitProvider`.
- `QueryClient` and `getConfig()` must be created inside `useState()` — never at module scope.
- **Disable Turbopack**: known init-order bug with wagmi/RainbowKit. Use `next dev` (not `--turbopack`).

**wagmi v2 hook renames (v1 names will not compile):**

| v1 | v2 |
|---|---|
| `useContractRead` | `useReadContract` |
| `useContractWrite` | `useWriteContract` |
| `usePrepareContractWrite` | `useSimulateContract` |
| `useWaitForTransaction` | `useWaitForTransactionReceipt` |
| `useNetwork` | `useAccount` (chain on account object) |
| `WagmiConfig` | `WagmiProvider` |

**getLogs pattern:**
- Use `parseAbiItem` from viem to define the event; pass `strict: true` so `log.args` is fully typed.
- Filter indexed topics via `args` field; non-indexed fields must be filtered client-side.

**Approval flow:**
- `isApprovedForAll` reads from the NFT (registry) contract, not the marketplace.
- Must call `waitForTransactionReceipt` after the approval tx before submitting the list tx — chaining without awaiting will revert.

**Next.js 15 + shadcn:**
- `next-themes` with `forcedTheme="dark"` locks the theme. No toggle.
- `useSearchParams` in App Router **requires a `<Suspense>` boundary** in production — without it, `pnpm build` fails.
- shadcn components.json: `style: "new-york"`, `baseColor: "zinc"`, `cssVariables: true`.

**Testing:**
- wagmi's `mock` connector from `wagmi/connectors` allows unit testing without a live RPC.
- MSW v2: `setupServer` from `msw/node`, handlers use `http.get`/`http.post` + `HttpResponse.json`.
- Custom render wrapper with `WagmiProvider` + `QueryClientProvider` (no RainbowKit in tests — not needed).

---

## Key Technical Decisions

- **`getDefaultConfig` over manual `createConfig`**: includes RainbowKit wallet connectors automatically; no extra wiring needed. (see origin: tech stack)
- **Single `src/lib/api.ts` for all backend fetch calls**: avoids duplicating base URL + BigInt parsing logic across pages. Each page imports typed helpers, not raw `fetch`.
- **Single `src/lib/contracts.ts` for all ABIs + addresses**: pages import constants from here; no ABI literals in page files.
- **`useSimulateContract` before `useWriteContract`**: pre-validates buy/rent calls client-side and disables the button if simulation fails — better UX than letting the wallet popup then revert.
- **`strict: true` in `getLogs`**: guarantees `log.args` is typed; avoids undefined-guard boilerplate across pages.
- **Vitest over Jest**: SDK already uses Vitest; aligns test infrastructure. `@vitejs/plugin-react` handles JSX.
- **MSW v2 (not polled fetch mocking)**: intercepts fetch at the service worker/Node level — components call real `fetch`, tests don't need `vi.mock('node:fetch')`.
- **No barrel `index.ts` files**: direct imports (`@/lib/api`, `@/lib/contracts`) are explicit and tree-shakable; barrels add indirection without benefit here.
- **Co-location**: page-specific components (ListingCard, BuyPanel, etc.) live in their page file. Only shared primitives (`providers.tsx`, `connect-wallet.tsx`) go in `src/components/`.

---

## Open Questions

### Resolved During Planning

- **Which wallet connection UI?** → RainbowKit `ConnectButton` (see brainstorm decision).
- **Dark mode approach?** → `next-themes` `forcedTheme="dark"` + shadcn CSS variables. No toggle.
- **Turbopack in dev?** → Disabled. Known compatibility bug with wagmi/RainbowKit.
- **Which test runner?** → Vitest (matches SDK, faster than Jest for ESM).
- **API base URL fallback?** → `process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'`. If API is down, pages show a graceful error state rather than crashing.

### Deferred to Implementation

- **Exact ABI entries for the contracts**: the SDK's `client.ts` has minimal ABIs; they should be copied verbatim to `src/lib/contracts.ts`. Verify field names and types match deployed contracts at implementation time.
- **0G Chain ID value**: `NEXT_PUBLIC_OG_CHAIN_ID` must be set at runtime. The chain definition in wagmi.ts reads from env — no hardcoded fallback for chain ID.
- **`Listed` event exact signature**: confirm the indexed fields match what the deployed marketplace contract emits. The plan assumes `(uint256 indexed tokenId, address indexed seller, ...)` — verify against the Solidity ABI.

---

## Output Structure

```
src/
├── app/
│   ├── page.tsx                          # Landing (server component)
│   ├── layout.tsx                        # Root layout — SSR cookie + nav
│   ├── globals.css                       # Tailwind base + shadcn CSS vars (dark)
│   ├── marketplace/
│   │   └── page.tsx                      # Browse listings ("use client")
│   ├── listing/
│   │   └── [id]/
│   │       └── page.tsx                  # Listing detail ("use client")
│   └── dashboard/
│       └── page.tsx                      # Producer dashboard ("use client")
├── components/
│   ├── ui/                               # shadcn generated components (Button, Card, …)
│   ├── providers.tsx                     # All client providers ("use client")
│   └── connect-wallet.tsx               # ConnectButton wrapper ("use client")
├── lib/
│   ├── wagmi.ts                          # ogGalileo chain + getDefaultConfig factory
│   ├── contracts.ts                      # ABIs (registry + marketplace) + env addresses
│   └── api.ts                            # Typed fetch helpers for backend REST API
└── test/
    ├── setup.ts                          # Vitest globalSetup — MSW server + jest-dom matchers
    ├── render.tsx                        # Custom renderWithWagmi wrapper
    ├── wagmi-config.ts                   # Test config with mock connector (no live RPC)
    └── handlers.ts                       # MSW route handlers (memory info, listing, bundle)
```

Config files at root: `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `components.json`, `.env.example`, `package.json`.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Provider tree (runtime)

```
RootLayout (server component)
  reads cookie → cookieToInitialState
  └── Providers (client component, "use client")
        ThemeProvider forcedTheme="dark"
          WagmiProvider config={getConfig()} initialState={...}
            QueryClientProvider client={queryClient}
              RainbowKitProvider
                {children}
```

### Data flow per page

```
/marketplace
  usePublicClient → getLogs(Listed, fromBlock:0n) → parse args
  useSearchParams → filter by category (client-side)
  render ListingCard grid

/listing/[id]
  parallel:
    fetch(API /memory/:id/info)     → provenance section
    fetch(API /marketplace/:id)     → price / terms
  (optional) fetch(API /memory/:id) → bundle preview
  useWriteContract → buy() / rent() (with useSimulateContract guard)

/dashboard
  useAccount → address
  usePublicClient → getLogs(MemoryMinted, args.creator=address)
  useReadContract → isApprovedForAll(address, marketplaceAddress)
  useWriteContract → setApprovalForAll then list()
```

### BigInt boundary rule

```
chain / wagmi  →  bigint  →  .toString()  →  display / URL state
API response   →  string  →  BigInt(x)    →  wagmi args / math
```

---

## Implementation Units

- U1. **Project scaffold & toolchain**

**Goal:** Create a working Next.js 15 application with all dependencies installed, TypeScript configured, shadcn dark theme initialized, and Vitest test runner set up.

**Requirements:** R5 (clean build), R6 (test runner exists)

**Dependencies:** None

**Files:**
- Create: `package.json` (full, replacing the stub)
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `components.json` (shadcn config)
- Create: `vitest.config.ts`
- Create: `.env.example`
- Create: `src/app/globals.css`
- Create: `src/test/setup.ts`
- Create: `src/test/handlers.ts`
- Create: `src/test/wagmi-config.ts`
- Create: `src/test/render.tsx`

**Approach:**
- Run `pnpm dlx create-next-app@latest` with `--typescript --tailwind --app --src-dir --import-alias "@/*"` flags. Accept no ESLint (will use TypeScript strict mode).
- Install runtime deps: `wagmi viem @rainbow-me/rainbowkit @tanstack/react-query next-themes`.
- Install dev deps: `vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw`.
- Run `pnpm dlx shadcn@latest init` with `style: new-york`, `baseColor: zinc`, `cssVariables: true`, output to `src/components/ui/`.
- Add shadcn components: `button card badge input label checkbox slider table separator skeleton`.
- `next.config.ts`: no Turbopack flag, no special config needed beyond defaults.
- `tailwind.config.ts`: extend colors with `violet` accent tokens matching the design system. The shadcn zinc base already provides the background tokens; only add the violet-500/400/30 accent overrides.
- `tsconfig.json`: `"strict": true`, path alias `"@/*": ["./src/*"]`.
- `vitest.config.ts`: `environment: "jsdom"`, `setupFiles: ["./src/test/setup.ts"]`, `globals: true`, resolve `@` alias.
- `globals.css`: override shadcn's generated `.dark` block to use zinc-950 as `--background` and violet-500 range as `--primary`/`--accent`.
- `src/test/setup.ts`: `import "@testing-library/jest-dom"`, MSW server `beforeAll`/`afterEach`/`afterAll`.
- `src/test/handlers.ts`: MSW handlers for `GET /api/memory/:id/info`, `GET /api/memory/:id`, `GET /api/marketplace/listings/:id` — return realistic fixture data.
- `src/test/wagmi-config.ts`: `createConfig` with `mock` connector, `defaultConnected: true`.
- `src/test/render.tsx`: `renderWithWagmi` — wraps with `WagmiProvider` + `QueryClientProvider` using the test config.

**Patterns to follow:**
- SDK's `vitest.config.ts` at `packages/sdk/vitest.config.ts` for baseline config shape.

**Test scenarios:**
- Test expectation: none — pure scaffolding/config unit. Verified by `pnpm build` and `pnpm test` running without error.

**Verification:**
- `pnpm build` exits 0 with an empty page.tsx.
- `pnpm test` discovers and runs test files without "cannot find module" errors.
- `pnpm dlx shadcn@latest add button` idempotently adds `src/components/ui/button.tsx`.

---

- U2. **Chain config, contract ABIs, and API client**

**Goal:** Define the single source of truth for (a) the 0G chain + wagmi config factory, (b) contract addresses and minimal ABIs, and (c) typed async helpers that call the backend REST API.

**Requirements:** R1, R2, R3, R7 (no duplication)

**Dependencies:** U1

**Files:**
- Create: `src/lib/wagmi.ts`
- Create: `src/lib/contracts.ts`
- Create: `src/lib/api.ts`
- Test: `src/lib/__tests__/api.test.ts`

**Approach:**

`src/lib/wagmi.ts`:
- Define `ogGalileo` chain using `defineChain` (viem) with chain ID from `NEXT_PUBLIC_OG_CHAIN_ID` and RPC from `NEXT_PUBLIC_OG_RPC_URL`. Include block explorer URL for 0G Galileo testnet.
- Export `getConfig()` factory using `getDefaultConfig` from RainbowKit. Call this inside `useState()` at the provider level — never call it at module scope.
- Export `ogGalileo` chain object so providers.tsx and tests can reference it.

`src/lib/contracts.ts`:
- Export `REGISTRY_ADDRESS` and `MARKETPLACE_ADDRESS` (from `process.env.NEXT_PUBLIC_*`).
- Export `REGISTRY_ABI` — copy the minimal ABI from `packages/sdk/src/client.ts` (`MEMORY_REGISTRY_ABI`): `mintRoot`, `getMemoryInfo`, `MemoryMinted` event, plus `isApprovedForAll` and `setApprovalForAll` (ERC-721 standard — not in SDK ABI but needed by dashboard).
- Export `MARKETPLACE_ABI` — copy from `packages/sdk/src/client.ts` (`MEMORY_MARKETPLACE_ABI`): `list`, `buy`, `rent`, `fork`, `payRoyalty`, `getListing`. **Also add the `Listed` event entry** — the SDK's minimal ABI omits it, but the marketplace page needs it for `getLogs`. The event signature must be verified against the deployed contract (see Open Questions); a reasonable assumption is `Listed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 rentalPricePerDay, bool isForSale, bool isForRent, bool isForFork, uint16 forkRoyaltyBps)`.
- All ABI entries `as const` for full wagmi type inference.

`src/lib/api.ts`:
- Export `API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'`.
- Export three typed async functions:
  - `getMemoryInfo(tokenId: string): Promise<MemoryInfoResponse>` — calls `GET /api/memory/:tokenId/info`
  - `getMemoryBundle(tokenId: string): Promise<MemoryBundleResponse>` — calls `GET /api/memory/:tokenId`
  - `getMarketplaceListing(tokenId: string): Promise<ListingResponse>` — calls `GET /api/marketplace/listings/:tokenId`
- Each function: `fetch → if !ok throw ApiError → return json`. No BigInt in the response types — all numeric fields are typed as `string` to match the API contract.
- Export a type `ApiError extends Error` with `status: number` so callers can distinguish 404 from 500.
- `tokenId` is always `string` in API calls (converted from `bigint` by callers using `.toString()`).

**Patterns to follow:**
- ABI shape from `packages/sdk/src/client.ts` — copy verbatim; do not rewrite.
- Response types should mirror the Swagger examples in `apps/api/src/marketplace/marketplace.controller.ts` and `apps/api/src/memory/memory.controller.ts`.

**Test scenarios:**
- Happy path: `getMemoryInfo('1')` with MSW returning `{ tokenId: '1', contentHash: '0xabc', ... }` → resolves to typed object.
- Happy path: `getMarketplaceListing('1')` returns listing with `price: '1000000000000000000'` as string (not number, not bigint).
- Edge case: `getMemoryInfo('999')` with MSW returning 404 → throws `ApiError` with `status: 404`.
- Edge case: `getMemoryBundle` with API unreachable (MSW network error) → throws error; caller can catch and show fallback.
- Error path: response body is valid JSON but missing `tokenId` field — function still returns without crashing (types are not runtime-enforced; Zod is out of scope).
- Unit: `API_BASE` falls back to `'http://localhost:3001/api'` when `NEXT_PUBLIC_API_URL` is not set.

**Verification:**
- `pnpm test src/lib/__tests__/api.test.ts` passes.
- TypeScript: `tsc --noEmit` reports no errors in `src/lib/`.
- Importing `REGISTRY_ABI` in a wagmi `useReadContract` call infers the correct return type without casting.

---

- U3. **Providers, root layout, and navigation**

**Goal:** Set up the provider tree with SSR-safe wagmi hydration, forced dark theme, root navigation bar, and wallet connect button.

**Requirements:** R4 (layout visible), R5 (no hydration errors)

**Dependencies:** U1, U2

**Files:**
- Create: `src/components/providers.tsx`
- Create: `src/components/connect-wallet.tsx`
- Create: `src/app/layout.tsx`

**Approach:**

`src/components/providers.tsx` (`"use client"`):
- Import `'@rainbow-me/rainbowkit/styles.css'` here (not in layout.tsx — server components don't own CSS imports the same way).
- Wrap children in order: `ThemeProvider (next-themes, forcedTheme="dark")` → `WagmiProvider` → `QueryClientProvider` → `RainbowKitProvider`.
- Accept `initialState?: State` prop (from wagmi) and `children`.
- Create `queryClient` and `config` inside `useState(() => ...)` — never at module scope.
- Pass `initialState` to `WagmiProvider` for SSR hydration.

`src/components/connect-wallet.tsx` (`"use client"`):
- Re-export RainbowKit's `ConnectButton` with a thin wrapper (adds custom class or size override if needed). If no customization is needed, this file is still kept as the single import point so we can swap implementations without touching pages.

`src/app/layout.tsx` (server component):
- Call `cookieToInitialState(getConfig(), (await headers()).get('cookie'))` for SSR state.
- Set `<html lang="en" suppressHydrationWarning>` — required by next-themes.
- Nav bar: `MNEMOS` text logo (links to `/`), nav links (Marketplace, Dashboard), `ConnectWallet` on the right. Use shadcn `Button` variant="ghost" for nav links, `Separator` (vertical) between sections.
- Wrap `{children}` in `<Providers initialState={...}>`.

**Test scenarios:**
- Test expectation: none — layout/provider wiring is verified by the app starting without hydration errors. No unit test needed for this wiring layer.

**Verification:**
- `pnpm dev` loads `/` without console errors about "No QueryClient" or "WagmiConfig".
- `ConnectButton` renders in the nav and opens the RainbowKit wallet modal on click.
- Refreshing with a previously connected wallet does not flash an unconnected state.
- `<html>` carries the `dark` class — shadcn dark CSS variables are active.

---

- U4. **Marketplace page**

**Goal:** A browseable grid of active memory token listings, filtered by category via URL params, with empty state and loading skeleton.

**Requirements:** R1

**Dependencies:** U1, U2, U3

**Files:**
- Create: `src/app/marketplace/page.tsx`
- Test: `src/app/marketplace/__tests__/page.test.tsx`

**Approach:**

Page file (`"use client"`):
- Use `usePublicClient()` to call `getLogs` with the `Listed` event ABI from `REGISTRY_ABI`, `fromBlock: 0n`, `strict: true`. Guard with `if (!publicClient) return <Skeleton />`.
- Wrap the `useSearchParams()` call (and any component using it) in `<Suspense>` — required in Next.js 15 production build.
- Filter loaded listings by `searchParams.get('category')` client-side. If category param is absent, show all.
- Co-locate `ListingCard` component in this file. Props: `{ tokenId, seller, category, price, rentalPricePerDay, isForSale, isForRent, isForFork }`.
  - Use shadcn `Card`/`CardHeader`/`CardContent`/`CardFooter`.
  - Display token ID as `#${tokenId}`, seller address truncated to `0x…abcd`, price in ETH using viem `formatEther`.
  - Badge row: show "For Sale", "For Rent", "For Fork" badges conditionally.
  - Card links to `/listing/${tokenId}`.
- Co-locate `CategoryFilter` component — renders filter buttons, uses `useRouter`/`useSearchParams` to set `?category=` param.
- Empty state: "No listings found" with CTA link to Dashboard ("List your first memory").
- Loading state: render 6 `Skeleton` cards while `getLogs` is in flight (use `useState` for `isLoading`).

**Patterns to follow:**
- shadcn Card from `src/components/ui/card.tsx`.
- `formatEther` from viem for price display.

**Test scenarios:**
- Happy path: renders a `ListingCard` for each log returned from the mock `getLogs` call. (Mock `usePublicClient` to return a stubbed `getLogs`.)
- Happy path: with `?category=trading` in URL, only trading listings are shown.
- Edge case: `getLogs` returns empty array → empty state copy "No listings found" is visible.
- Edge case: `usePublicClient` returns `undefined` on first render → Skeleton is shown, no crash.
- Integration: `ListingCard` displays price formatted in ETH, not wei (i.e., `1.0` not `1000000000000000000`).
- Integration: clicking a card navigates to `/listing/1` (smoke test with router mock).

**Verification:**
- `pnpm test src/app/marketplace/__tests__/page.test.tsx` passes.
- Manually: at least one listing card appears when a `Listed` event exists on the configured chain.
- `?category=research` URL param filters the grid without a page reload.

---

- U5. **Listing detail page**

**Goal:** An information-dense detail view showing on-chain provenance (via API) and three action panels: Buy, Rent (with duration input), and Fork (disabled).

**Requirements:** R2

**Dependencies:** U1, U2, U3, U4

**Files:**
- Create: `src/app/listing/[id]/page.tsx`
- Test: `src/app/listing/[id]/__tests__/page.test.tsx`

**Approach:**

Page file (`"use client"`):
- Params: `{ params }: { params: { id: string } }`. The `id` is the tokenId as string.
- On mount, fire two parallel fetches (both via `src/lib/api.ts`):
  - `getMemoryInfo(id)` → provenance section
  - `getMarketplaceListing(id)` → action panels
- Fire a third fetch `getMemoryBundle(id)` separately — if it fails (API down or 404), show "Bundle preview unavailable" instead of failing the whole page.
- Use `Promise.all` for the first two; if either fails with `ApiError(404)`, show "Token not found" full-page error. If it fails with 5xx, show "Chain data unavailable".
- Manage loading state with a single `isLoading` boolean (both first two fetches done = loaded).

Co-locate components in this file:

`ProvenanceSection`: Two-column key-value list — Content Hash, Storage URI, Creator, Parent Token (links to parent if non-zero), Minted At (formatted date from timestamp). Use shadcn `Separator` between rows.

`BuyPanel`: Shown only if `isForSale`. Displays price in ETH. Uses `useSimulateContract` to pre-validate the buy call with `value: BigInt(listing.price)`. Button disabled if simulation fails or `isPending`. On click: `writeContractAsync({ functionName: 'buy', args: [BigInt(id)], value: BigInt(listing.price) })`. After hash returned, show "Transaction submitted" — no auto-reload.

`RentPanel`: Shown only if `isForRent`. Number input for `durationDays` (min 1). Total cost computed as `BigInt(listing.rentalPricePerDay) * BigInt(durationDays)`, displayed in ETH. `useSimulateContract` with computed value. Same submit pattern as Buy.

`ForkPanel`: Always shown. Button is always disabled. Body copy: "Fork this memory using the Mnemos SDK. The fork operation requires your agent to upload a child memory bundle before minting."

Inactive panels (flags false): render the panel with muted styling and a "Not available" badge rather than hiding — shows the possible actions without implying they don't exist.

**Patterns to follow:**
- `useSimulateContract` + `useWriteContract` composition from wagmi v2 research.
- `formatEther` from viem for display.
- Error handling: `BaseError.walk()` for user rejection vs revert.

**Test scenarios:**
- Happy path: MSW returns valid `getMemoryInfo` + `getMarketplaceListing` responses → both ProvenanceSection and BuyPanel render.
- Happy path: `isForSale=true, isForRent=false` → BuyPanel is active, RentPanel is muted/disabled.
- Edge case: `getMemoryInfo` returns 404 → "Token not found" message shown, no action panels rendered.
- Edge case: `getMemoryBundle` fails → "Bundle preview unavailable" shown, rest of page unaffected.
- Integration: RentPanel total cost updates when `durationDays` input changes (e.g., 7 days × 0.1 ETH/day = "0.7 ETH total").
- Integration: `BigInt(listing.price)` passed as `value` to the buy contract call — price string `"1000000000000000000"` becomes `1000000000000000000n`.
- Error path: `writeContractAsync` throws `UserRejectedRequestError` → "Transaction cancelled" shown, no crash.

**Verification:**
- `pnpm test src/app/listing/[id]/__tests__/page.test.tsx` passes.
- Manually: visit `/listing/1` with a valid token — provenance data renders, Buy/Rent buttons are enabled/disabled per the listing flags.

---

- U6. **Dashboard page**

**Goal:** A producer view showing minted tokens from chain, plus a listing form that executes the `setApprovalForAll → list` two-step transaction with correct sequencing.

**Requirements:** R3

**Dependencies:** U1, U2, U3

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Test: `src/app/dashboard/__tests__/page.test.tsx`

**Approach:**

Page file (`"use client"`):
- `useAccount()` to get `address`. If disconnected: render "Connect your wallet to view your tokens" message with ConnectButton.
- `getLogs` with `MemoryMinted` event, filtered by `args: { creator: address }` — only scan this wallet's tokens.
- `useReadContract` for `isApprovedForAll(address, MARKETPLACE_ADDRESS)` on the registry contract. `query: { enabled: !!address }`.

Co-locate `TokenTable`: renders a shadcn `Table` with columns: Token ID, Content Hash (first 10 chars + ellipsis), Minted At, Status (listed / unlisted badge). Each row has a "List" button that opens the listing form for that token.

Co-locate `ListingForm`: receives `tokenId: bigint`. Fields:
- Price in ETH (text input, validated as positive decimal; convert to wei with `parseEther` on submit).
- Rental price per day in ETH (same validation).
- Checkboxes: isForSale, isForRent, isForFork.
- Fork royalty: numeric input 0–10000 bps (display as percentage: `value / 100`).
- Submit button label: `isApproved ? "List" : "Approve & List"` — always clear to user that two txs may be needed.
- On submit:
  1. If `!isApproved`: `writeContractAsync(setApprovalForAll(MARKETPLACE_ADDRESS, true))` → `waitForTransactionReceipt` → `refetchApproval`.
  2. `writeContractAsync(list(tokenId, price, rentalPricePerDay, isForSale, isForRent, isForFork, forkRoyaltyBps))`.
- Show per-step status: "Approving… (1/2)", "Listing… (2/2)", "Listed!".
- Error handling: `UserRejectedRequestError` → "Cancelled", revert → show `shortMessage`.

Empty state: "No memory tokens yet. Run the reference agent to mint your first snapshot."

**Patterns to follow:**
- Approval sequencing pattern from wagmi research (U2 research section).
- `parseEther` from viem for ETH → wei conversion.
- `waitForTransactionReceipt` between the two txs — mandatory to avoid approval-race revert.

**Test scenarios:**
- Happy path: `getLogs` returns two minted tokens → TokenTable renders two rows.
- Happy path: `isApprovedForAll = true` → submit form triggers `list()` directly without approval tx.
- Happy path: `isApprovedForAll = false` → submit triggers `setApprovalForAll` first, then `list()`. Both `writeContractAsync` calls made in sequence.
- Edge case: wallet disconnected → "Connect your wallet" message shown, no getLogs call made.
- Edge case: empty token list (getLogs returns []) → empty state copy shown.
- Edge case: price input "abc" → form validation prevents submission (HTML5 `type="number"` or explicit validation).
- Error path: `setApprovalForAll` rejected by user → "Cancelled" shown, `list()` NOT called.
- Error path: `list()` reverts → error `shortMessage` shown.
- Integration: status message transitions "Approving… (1/2)" → "Listing… (2/2)" → "Listed!" in the two-step flow.

**Verification:**
- `pnpm test src/app/dashboard/__tests__/page.test.tsx` passes.
- Manually: connect wallet, see tokens, fill form, get two wallet popups when not yet approved.
- `isApprovedForAll` is read once on load and re-read after approval tx completes.

---

- U7. **Landing page**

**Goal:** A visually striking server component landing page with headline, protocol pitch, three-step "how it works", and CTAs.

**Requirements:** R4

**Dependencies:** U3 (layout)

**Files:**
- Create: `src/app/page.tsx`

**Approach:**

Server component (no `"use client"` — no chain reads needed):
- Hero section: large headline ("Trade Agent Memory. On-Chain."), one-sentence subheadline, two CTA buttons (`Button` from shadcn): "Browse Marketplace" (→ `/marketplace`) + "Open Dashboard" (→ `/dashboard`).
- "How it works" section: three numbered steps in a row or grid — "1. Agent snapshots", "2. Mint on 0G", "3. List & Earn". Each step: icon (lucide-react), title, one-sentence description.
- Footer: "Mnemos Protocol — MIT License" + link to the 0G APAC Hackathon page.
- No wagmi hooks, no chain reads, no `"use client"`.

**Test scenarios:**
- Test expectation: none — static server component with no logic. Verified by visual inspection and `pnpm build`.

**Verification:**
- `pnpm build` passes (no server component using client hooks by mistake).
- Page renders at `/` without JavaScript (progressive enhancement check).
- Hero headline and both CTA buttons visible without scrolling on a 1440px viewport.

---

- U8. **Test suite execution and issue resolution**

**Goal:** Run the full test suite, identify failures, and fix all issues before declaring the build complete.

**Requirements:** R5, R6

**Dependencies:** U1–U7

**Files:**
- Modify: any file where test failures reveal bugs (scope TBD at implementation time).
- Modify: `src/test/handlers.ts` if additional fixture data is needed.

**Approach:**

Run `pnpm test` and `pnpm build` in sequence. Fix each failure before moving to the next.

Common failure classes to expect and their resolutions:
- **"Missing Suspense boundary"** (build error): wrap `useSearchParams` usage in a `<Suspense>` — must be in the parent that renders the component using the hook.
- **"No QueryClient set"** (runtime/test error): `QueryClient` instantiated at module scope instead of inside `useState`.
- **Module resolution `@/`** (test error): `resolve.alias` missing in `vitest.config.ts`.
- **BigInt serialization error** (runtime): somewhere a `bigint` is being passed through `JSON.stringify`; replace with `.toString()`.
- **wagmi hook called outside provider** (test error): test is not using `renderWithWagmi` wrapper.
- **MSW handler not matching URL** (test error): check `API_BASE` prefix — handlers must use the full path.
- **`usePublicClient` returns `undefined`** (test error): either the mock config is not connected, or the test doesn't `await` hydration with `waitFor`.

After all test failures are resolved: run `pnpm lint` and fix any ESLint issues. Run `pnpm build` to confirm the production build exits 0.

**Test scenarios:**
- All unit tests in `src/lib/__tests__/api.test.ts` pass.
- All component tests in `src/app/*/` pass.
- `pnpm build` exits 0.
- `pnpm lint` exits 0.

**Verification:**
- `pnpm test --reporter=verbose` shows 0 failures.
- `pnpm build` output contains no TypeScript or Next.js errors.
- No `console.error` calls appear in test output.

---

## System-Wide Impact

- **Interaction graph:** All wagmi hook consumers depend on `Providers` being in the tree. If `Providers` is missing or has wrong ordering, every page fails silently or with cryptic errors.
- **Error propagation:** `api.ts` throws typed `ApiError` instances. Pages must catch these and display fallback UI — no uncaught promise rejections allowed.
- **State lifecycle risks:** `getLogs` results are not cached between route navigations (each page mount re-scans from block 0). Acceptable for MVP; re-scanning on re-mount is predictable.
- **API surface parity:** `src/lib/contracts.ts` ABIs must stay in sync with the deployed contracts. Any function called by the frontend that's missing from the ABI causes a silent encode failure at runtime. The ABIs must include all four ERC-721 functions needed (isApprovedForAll, setApprovalForAll) in addition to the SDK's minimal set.
- **Integration coverage:** The approval-before-list sequence cannot be fully verified by unit tests alone — the test for U6 must mock both `writeContractAsync` calls and verify their order.
- **Unchanged invariants:** The backend API contract (endpoint paths, response shapes, decimal-string BigInt convention) is not changed by this plan. The frontend is a consumer only.

---

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| Turbopack breaks wagmi/RainbowKit init | `package.json` `"dev"` script uses `next dev` (no `--turbopack` flag) |
| `Listed` event ABI doesn't match deployed contract | Verify against the contract repo's ABI before coding U4; copy exact event signature |
| `useSearchParams` Suspense boundary forgotten | U8 build step will surface it; fix before declaring done |
| RainbowKit WalletConnect modal requires a project ID | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` must be set; app will show "WalletConnect not configured" without it |
| Backend API unavailable during demo | `api.ts` catches errors; pages show graceful fallback state (not blank/crashed) |
| BigInt precision: JS `number` can't hold uint256 | All chain values stay as `bigint` until display; `parseEther`/`formatEther` for ETH conversion |

---

## Documentation / Operational Notes

- Update `CLAUDE.md` tech stack section after U1 to add Vitest and `next-themes` to the listed dependencies.
- `.env.example` must include `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — without it, RainbowKit wallet modal fails silently.
- The `pnpm dev` command must not use `--turbopack`. Document this in `README.md`.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-07-001-frontend-rebuild-requirements.md](docs/brainstorms/2026-05-07-001-frontend-rebuild-requirements.md)
- Backend API source: `apps/api/src/marketplace/marketplace.controller.ts`, `apps/api/src/memory/memory.controller.ts`
- SDK ABI source: `packages/sdk/src/client.ts`
- wagmi v2 migration: https://wagmi.sh/react/guides/migrate-from-v1-to-v2
- wagmi SSR guide: https://wagmi.sh/react/guides/ssr
- wagmi Write to Contract: https://wagmi.sh/react/guides/write-to-contract
- RainbowKit installation: https://rainbowkit.com/docs/installation
- shadcn/ui Next.js install: https://ui.shadcn.com/docs/installation/next
- viem getLogs: https://viem.sh/docs/actions/public/getLogs.html
- MSW v2 Node integration: https://mswjs.io/docs/integrations/node
- Next.js useSearchParams: https://nextjs.org/docs/app/api-reference/functions/use-search-params
