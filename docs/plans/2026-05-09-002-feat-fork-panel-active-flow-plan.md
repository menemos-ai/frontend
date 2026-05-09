---
title: "feat: Enable ForkPanel with Pure-Frontend Derived Fork Flow"
type: feat
status: completed
date: 2026-05-09
origin: docs/brainstorms/fork-panel-requirements.md
---

# feat: Enable ForkPanel with Pure-Frontend Derived Fork Flow

## Overview

`ForkPanel` in the listing detail page is permanently disabled — the button reads "Use the SDK to fork this memory" and calls nothing. This plan enables the button so a connected wallet can execute a real on-chain `marketplace.fork()` transaction. Child `contentHash` is derived client-side using viem's `keccak256 + encodePacked` from data already in-browser (parent hash + forker address + timestamp). No backend changes required.

Additionally, 5 pre-existing test failures in `src/app/listing/__tests__/page.test.tsx` must be fixed as a prerequisite.

---

## Problem Frame

The fork contract function requires `contentHash` (bytes32) and `storageURI` (string) that don't exist in the browser until an agent has prepared a child bundle off-chain. However, for the hackathon demo, what matters is that the on-chain fork transaction executes correctly — child token minted, `forkPrice` paid, lineage recorded. Bundle content is not validated by any judge. A client-side derived hash satisfies the contract and demonstrates the complete protocol primitive.

See origin: `docs/brainstorms/fork-panel-requirements.md`

---

## Requirements Trace

- R1. `forkPrice > 0` → Fork button is clickable when wallet is connected.
- R2. Clicking Fork → wallet prompts for exactly `forkPrice` A0GI.
- R3. After confirmation → child token appears on 0G Chain (verifiable in explorer).
- R4. UI shows `childTokenId` and link to `/listing/[childTokenId]` after success.
- R5. `forkPrice === 0` → "Not available for fork" message, button unchanged.
- R6. No regression on `BuyPanel` or `RentPanel`.
- R7. All unit tests pass (including fixing 5 pre-existing failures).

---

## Scope Boundaries

- No backend changes — `mnemos-backend` is not touched.
- No real bundle merging, encryption, or 0G storage upload.
- No lineage tree UI on the listing detail page.
- No real-time state refresh after fork completes (page reload shows updated state).
- `childTokenId` extraction is best-effort: if `publicClient` is unavailable post-tx (edge case), only tx hash is shown.

---

## Context & Research

### Relevant Code and Patterns

- `src/app/listing/[id]/_listing-detail.tsx` — `BuyPanel` and `RentPanel` (lines 47–253) are the direct patterns for ForkPanel to follow: props `{ listing, tokenId }`, wagmi hooks (`useWriteContract`, `usePublicClient`), `pending`/`txHash` state, emerald success card with explorer link.
- `src/lib/contracts.ts` — `FORKED_EVENT` already exported; `MARKETPLACE_ABI` and `MARKETPLACE_ADDRESS` available.
- `src/lib/wagmi.ts` — `ogChain` for explorer URL construction.
- `src/lib/api.ts` — `MemoryInfo` type (provides `contentHash: string`, `storageUri: string`).
- `src/lib/mock-data.ts` — `MOCK_LISTING_INFO` tokens `'1'` (forkPrice 0) and `'4'` (forkPrice 50000000000000000 wei) useful for tests.
- `src/app/listing/__tests__/page.test.tsx` — current test file, 5 of 6 tests failing. Root cause: `usePublicClient` mocked to `undefined`, DEMO_MODE off → contracts error → listing never loads → panels never render.
- `src/test/render.tsx` — `renderWithProviders` wrapper (WagmiProvider + QueryClientProvider).

### Institutional Learnings

- None found in `docs/solutions/` relevant to viem event log parsing or keccak256 in this repo.

### External References

- Not needed — `keccak256`, `encodePacked`, `parseEventLogs` are standard viem 2.x APIs already used elsewhere in the project via wagmi.

---

## Key Technical Decisions

- **Client-side hash derivation**: `keccak256(encodePacked(['bytes32', 'address', 'uint256'], [parentContentHash, forkerAddress, timestamp]))`. Produces a unique `bytes32` per fork without any network call.
- **`storageURI` reuse**: Child's `storageURI` = parent's `storageUri` from `MemoryInfo`. Contract does not enforce uniqueness on this field (confirmed from ABI — no uniqueness error exists).
- **`childTokenId` extraction**: `parseEventLogs({ abi: MARKETPLACE_ABI, eventName: 'Forked', logs: receipt.logs })` — uses `FORKED_EVENT`'s type already in ABI; `childTokenId` is indexed so it appears as a topic, parsed correctly by viem.
- **Prop extension**: ForkPanel adds `tokenId: bigint` and `info: MemoryInfo` — same pattern as `BuyPanel`/`RentPanel` which already receive `tokenId`. The call site guard changes from `listing ?` to `listing && info ?` because both are set atomically in the same Promise.all.
- **Test environment**: Add `NEXT_PUBLIC_DEMO_MODE: 'true'` to `vitest.config.ts` `test.env` so mock data loads in tests without a real `publicClient`. Token `'1'` covers forkPrice=0; token `'4'` covers forkPrice>0.

---

## Open Questions

### Resolved During Planning

- **Does `fork()` reject duplicate `storageURI`?**: No — confirmed by ABI inspection. No uniqueness error or check in the ABI for `storageURI`. Safe to reuse parent's value.
- **Is `contentHash` in `MemoryInfo` always 32 bytes?**: In production yes (`bytes32` from registry). viem's `encodePacked` right-pads any shorter value to 32 bytes when typed as `bytes32`, so short test values are safe.
- **5 pre-existing test failures**: Root cause identified — tests assume data loads but `usePublicClient` returns `undefined` and `DEMO_MODE` is off. Fix: enable demo mode in vitest env + fix incorrect test assertions.
- **Why test for "Memory #1" heading fails**: Heading text is `#1` not `Memory #1`. Test regex is wrong.

### Deferred to Implementation

- **What if `parseEventLogs` returns empty array?**: Edge case where tx succeeds but log is missing. Guard: `parsed[0]?.args.childTokenId?.toString() ?? null` — shows tx hash without child link. Acceptable for MVP.
- **Exact error messages from wagmi when wallet is not connected**: Catch-all `err.message` is shown inline, same as BuyPanel pattern.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**ForkPanel state machine:**

```
[forkPrice === 0]          → render: "Not available for fork" (unchanged)
[MARKETPLACE_ADDRESS undef] → render: "Contract not configured" (unchanged)
[idle]                     → render: "Fork Now" button (enabled)
[pending]                  → render: "Forking…" button (disabled)
[confirmed]                → render: success card (child token link + tx hash) + "Forked ✓" disabled
[error]                    → render: error message inline + "Fork Now" re-enabled
```

**Fork execution sequence:**

```
click "Fork Now"
  → derive childContentHash = keccak256(encodePacked(parentHash, address, timestamp))
  → writeContractAsync({ fork, args: [tokenId, childContentHash, storageUri], value: forkPrice })
  → setPending(true), setStatus('Forking…')
  → receipt = publicClient.waitForTransactionReceipt({ hash })
  → parsed = parseEventLogs({ abi: MARKETPLACE_ABI, eventName: 'Forked', logs: receipt.logs })
  → setChildTokenId(parsed[0]?.args.childTokenId?.toString() ?? null)
  → setTxHash(hash)
  → setPending(false)
```

---

## Implementation Units

- U1. **Fix pre-existing test failures in listing detail test suite**

**Goal:** Green baseline before adding new ForkPanel tests. 5 of 6 listing tests currently fail due to missing DEMO_MODE flag and wrong test assertions.

**Requirements:** R7

**Dependencies:** None

**Files:**
- Modify: `vitest.config.ts`
- Modify: `src/app/listing/__tests__/page.test.tsx`

**Approach:**
- In `vitest.config.ts`, add `env: { NEXT_PUBLIC_DEMO_MODE: 'true' }` under `test:` so mock data loads from `src/lib/mock-data.ts` without a real publicClient.
- Fix `renders memory token heading`: heading is `#1` not `Memory #1` — fix regex to `/#1/`.
- Fix `shows provenance section heading after data loads`: provenance loads via demo data for token `'1'` — assert for "Content Hash" text (matches current `ProvenanceRow` label).
- Fix `renders buy panel after data loads`: demo token `'1'` has buyPrice > 0 — assert for heading "Buy".
- Fix `renders rent panel after data loads`: demo token `'1'` has rentPricePerDay > 0 — assert for heading "Rent".
- Fix `renders fork panel button as disabled`: demo token `'1'` has forkPrice = 0, so ForkPanel shows "Not available for fork." message — change test to assert on that text, or convert to a new scenario (see U3).

**Patterns to follow:**
- Existing passing tests in `src/app/dashboard/__tests__/page.test.tsx` and `src/app/marketplace/__tests__/page.test.tsx` for mock structure.

**Test scenarios:**

Test expectation: none — this unit IS the test fix. Verification is that `pnpm test` passes after changes.

**Verification:**
- `pnpm test` shows 0 failures in `src/app/listing/__tests__/page.test.tsx`.

---

- U2. **Implement active ForkPanel with derived hash and on-chain tx**

**Goal:** Rewrite `ForkPanel` to execute `marketplace.fork()` and show child token success state. Update call site to pass new props.

**Requirements:** R1, R2, R3, R4, R5, R6

**Dependencies:** U1

**Files:**
- Modify: `src/app/listing/[id]/_listing-detail.tsx`

**Approach:**
- **Props**: Add `tokenId: bigint` and `info: MemoryInfo` to `ForkPanel`. The `info` type is imported from `src/lib/api.ts` (already imported in this file via `import type { MemoryInfo, ListingInfo } from '@/lib/api'`).
- **Hooks**: Add `useAccount` (for `address`), keep `useWriteContract` and `usePublicClient` inside ForkPanel (same pattern as BuyPanel).
- **State**: `pending: boolean`, `txHash: string | null`, `childTokenId: string | null`, `error: string | null`.
- **Hash derivation**: Uses `keccak256` and `encodePacked` from `viem` (already imported in this file for other uses — check and add if absent). Input: `['bytes32', 'address', 'uint256']` with `info.contentHash as '0x${string}'`, `address!`, `BigInt(Math.floor(Date.now() / 1000))`.
- **Contract call**: `writeContractAsync({ address: MARKETPLACE_ADDRESS, abi: MARKETPLACE_ABI, functionName: 'fork', args: [tokenId, derivedHash, info.storageUri], value: BigInt(listing.forkPrice) })`.
- **Receipt parsing**: After `waitForTransactionReceipt`, import `parseEventLogs` from `'viem'` and parse the `Forked` event to extract `childTokenId`. Guard against empty result.
- **Success card**: Emerald color scheme matching BuyPanel. Show child token ID + `<Link href={'/listing/' + childTokenId}>` and tx hash with `explorerTx()` link (function already defined in this file).
- **Call site** in `ListingDetail`: Change render condition from `listing ?` to `listing && info ?` and pass `<ForkPanel listing={listing} tokenId={tokenId} info={info} />`.
- **No new duplicate helper functions**: `explorerTx`, `truncate`, `truncateTx` already defined in the file — reuse them.

**Patterns to follow:**
- `BuyPanel` (lines 47–133) for hook setup, pending/txHash state, success card layout, error handling.
- `RentPanel` (lines 135–253) for the total-calculation pattern if needed.

**Test scenarios:**

No new test scenarios in this unit — covered by U3. The existing test suite (fixed in U1) provides regression coverage for R5 and R6.

**Verification:**
- `pnpm build` passes without TypeScript errors.
- In the browser (demo mode or real chain), clicking Fork on a forkPrice > 0 listing triggers wallet prompt.
- After confirmation, success card shows child token ID with clickable link and explorer tx link.

---

- U3. **Extend listing tests with ForkPanel active-flow coverage**

**Goal:** Cover the new ForkPanel states: active fork available (token 4), no fork (token 1), and success state after mocked tx.

**Requirements:** R1, R4, R5, R7

**Dependencies:** U1, U2

**Files:**
- Modify: `src/app/listing/__tests__/page.test.tsx`

**Approach:**
- Add a `describe('ForkPanel')` block inside the existing `describe('ListingDetail')`.
- Use `renderWithProviders(<ListingDetail id="4" />)` for the fork-available case (token 4 has `forkPrice: 50000000000000000` in mock data).
- Use `renderWithProviders(<ListingDetail id="1" />)` for the no-fork case.
- For the success state test: mock `writeContractAsync` to resolve with a fake tx hash; mock `waitForTransactionReceipt` on `usePublicClient` to return a receipt with a fake Forked event log. Then click the fork button and assert on the success card.
- Keep the success state test as a unit assertion on child token text — no full E2E chain interaction needed.
- The wagmi mock in this file already mocks `useWriteContract` — extend it to allow test-specific overrides using `vi.mocked` pattern from `dashboard/__tests__/page.test.tsx`.

**Patterns to follow:**
- `src/app/dashboard/__tests__/page.test.tsx` — `vi.mocked(useAccount).mockReturnValue(...)` pattern for per-test mock overrides.
- `src/app/listing/__tests__/page.test.tsx` — existing `vi.mock('wagmi', async (importOriginal) => ...)` mock structure.

**Test scenarios:**
- Happy path: `renderWithProviders(<ListingDetail id="4" />)` → find heading "Fork" → find button with name "Fork Now" → button is not disabled.
- Edge case — no fork available: `renderWithProviders(<ListingDetail id="1" />)` → find text "Not available for fork." → button "Use the SDK" is gone.
- Happy path — success state: mock `writeContractAsync` to return `'0xdeadbeef'`; mock `usePublicClient` to return client with `waitForTransactionReceipt` resolving to receipt with Forked log containing `childTokenId: 99n` → click "Fork Now" → assert text "Child Token #99" appears.
- Error path: mock `writeContractAsync` to throw `new Error('user rejected')` → click "Fork Now" → assert error message contains "user rejected" → assert button re-enabled.
- Edge case — `MARKETPLACE_ADDRESS` undefined: this case renders "Contract not configured" message — assert on that text when contract env is unset (already covered by the contracts-not-configured error path in the existing suite).

**Verification:**
- `pnpm test` passes all tests including new ForkPanel describe block.
- Test coverage includes at least: enabled state, disabled state (no fork), success state, error state.

---

## System-Wide Impact

- **Interaction graph:** `ListingDetail` → `ForkPanel` (prop interface change). No other components import ForkPanel.
- **Error propagation:** Fork tx errors are caught in ForkPanel's try/catch and shown inline — no error propagates to parent.
- **State lifecycle risks:** `childTokenId` and `txHash` are local to ForkPanel and are not persisted. After fork success the listing still shows the parent token data — a page reload is needed to see updated state (acceptable for MVP, documented in scope boundaries).
- **API surface parity:** `BuyPanel` and `RentPanel` signatures are unchanged. Only `ForkPanel`'s call site changes.
- **Integration coverage:** The on-chain fork creates a new token in the registry — visible via explorer link in success card. No automated integration test against live chain; manual verification covers this.
- **Unchanged invariants:** `BuyPanel`, `RentPanel`, `ListingDetail` rendering logic, and all other pages are unaffected.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `contentHash` from `MemoryInfo` is typed `string` not `0x${string}` | Cast with `as '0x${string}'` — safe because registry always stores 0x-prefixed 32-byte hashes in production. In tests, viem pads shorter values. |
| `parseEventLogs` returns empty array if log is missing | Guard with `parsed[0]?.args.childTokenId?.toString() ?? null` — shows tx hash without child token link instead of crashing. |
| Demo mode enabled globally in vitest config affects other test files | Other test files (`dashboard`, `marketplace`) mock `usePublicClient: () => undefined` explicitly and don't depend on DEMO_MODE being false — no regression expected. Verify with `pnpm test` after U1. |
| `info` prop is `null` during loading despite call site guarding `listing && info` | Impossible if both are set atomically in the same `setInfo/setListing` pair — confirmed from `_listing-detail.tsx` lines 376–379. |

---

## Sources & References

- **Origin document:** `docs/brainstorms/fork-panel-requirements.md`
- Related code: `src/app/listing/[id]/_listing-detail.tsx` — BuyPanel (lines 47–133), RentPanel (lines 135–253)
- Contract ABI: `src/abis/MemoryMarketplace.ts` — `fork` function, `Forked` event
- Mock data: `src/lib/mock-data.ts` — tokens `'1'` and `'4'` for test scenarios
