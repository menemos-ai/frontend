# Fork Panel — Requirements

**Status:** Ready for planning  
**Date:** 2026-05-09  
**Scope:** Frontend only (`src/app/listing/[id]/_listing-detail.tsx`)

---

## Problem

The Fork action panel (`ForkPanel`) in the listing detail page is permanently disabled. The button reads "Use the SDK to fork this memory" and is non-interactive. For the hackathon demo, fork must actually execute on-chain: child token minted, `forkPrice` paid to seller, lineage recorded.

---

## Goal

Enable the Fork button so a connected wallet can execute a real on-chain `marketplace.fork()` transaction from the listing detail page — no backend changes required.

---

## What "success" looks like in the demo

1. User opens `/listing/[id]` for a token with `forkPrice > 0`
2. User clicks **Fork**
3. Wallet prompt appears — user confirms payment of `forkPrice` A0GI
4. Transaction confirms on 0G Chain
5. UI shows: **"Fork berhasil ✓ — Child Token #[X]"** with a link to `/listing/[X]` and the tx hash linking to the block explorer

---

## Approach: Pure Frontend Derived Fork

All data required for the on-chain call is already available in the browser — no new backend endpoint needed.

### How `contentHash` is derived

```
childContentHash = keccak256(encodePacked(
  parentContentHash,   // bytes32 — from parent's MemoryInfo
  forkerAddress,       // address — from useAccount()
  timestamp            // uint256 — current unix timestamp
))
```

This produces a unique `bytes32` per fork. It does not represent a real memory bundle, but the on-chain `fork()` function does not validate bundle contents — it only anchors the hash.

### How `storageURI` is handled

`storageURI` is reused from the parent token (same value, already in `MemoryInfo.storageUri`). For the demo, no judge validates whether the URI resolves to a real child bundle.

### How `childTokenId` is extracted

After `waitForTransactionReceipt`, parse the `Forked` event from the receipt logs to extract `childTokenId`. The `Forked` event is already exported from `src/lib/contracts.ts` as `FORKED_EVENT`.

---

## Scope

### In scope
- `ForkPanel` component rewrite: add state, inputs, `writeContractAsync` call
- `ForkPanel` props extended: add `tokenId: bigint` and `info: MemoryInfo`
- Success state: display child token ID + link to child listing + tx hash

### Out of scope
- Backend endpoint for fork preparation (`mnemos-backend`)
- Real bundle merging, encryption, or 0G upload
- Lineage tree UI on the listing detail page
- Real-time state refresh after fork completes

---

## Behavior Specification

### ForkPanel props (updated)

```typescript
ForkPanel({
  listing: ListingInfo,   // for forkPrice, royaltyBps
  tokenId: bigint,        // parentTokenId
  info: MemoryInfo,       // for contentHash, storageUri
})
```

The call site in `ListingDetail` already has `info` and `tokenId` in scope — both are passed to `BuyPanel`/`RentPanel` already or are available.

### States

| State | UI |
|---|---|
| `forkPrice === 0n` | "Not available for fork." — same as today |
| `MARKETPLACE_ADDRESS` undefined | "Contract not configured." — same as today |
| Idle (wallet connected) | "Fork Now" button enabled |
| Pending tx | "Forking…" button disabled |
| Confirmed | Success card + child token link; button becomes "Forked ✓" disabled |
| Error | Error message inline, button re-enabled |

### Success card

```
[ ✓ Fork berhasil ]
Child Token #42  →  /listing/42
0xabc…123 ↗       (block explorer link)
```

Styled consistent with the confirmation card in `BuyPanel` (emerald color scheme, same layout).

---

## Acceptance Criteria

1. `forkPrice > 0` → Fork button is clickable (wallet connected)
2. Clicking Fork → wallet prompts for exactly `forkPrice` A0GI
3. After confirmation → child token appears on 0G Chain (verifiable in explorer)
4. UI shows correct `childTokenId` and link to `/listing/[childTokenId]`
5. `forkPrice === 0` → button remains disabled, message unchanged
6. No regression on `BuyPanel` or `RentPanel`

---

## Dependencies & Assumptions

- `viem` provides `keccak256` and `encodePacked` — already a project dependency
- `FORKED_EVENT` is already exported from `src/lib/contracts.ts` and can be used with `parseEventLogs` or manual log parsing from receipt
- `useAccount()` provides `address` — available in `ForkPanel` via wagmi
- The contract's `fork()` does not reject duplicate `storageURI` values — assumed based on ABI inspection (no uniqueness check visible)
- `MemoryInfo` is already in scope at the `ListingDetail` level and just needs to be passed as a prop to `ForkPanel`
