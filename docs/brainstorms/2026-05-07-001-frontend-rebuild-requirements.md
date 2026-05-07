# Requirements: Frontend Rebuild — Mnemos Marketplace

**Date:** 2026-05-07
**Status:** Ready for planning
**Scope:** Standard

---

## Problem

Frontend belum dibangun. Hanya ada `package.json` kosong dengan `shadcn` sebagai dev dependency. Perlu dibangun dari nol dengan tech stack yang tepat dan desain yang bersih untuk demo hackathon.

---

## Goals

1. Marketplace yang fungsional dan information-dense untuk demo video.
2. Listing detail yang bisa jadi pause-frame yang meyakinkan.
3. Dashboard producer yang jelas menunjukkan end-to-end flow.
4. Landing page yang memberikan first impression kuat.
5. Integrasi dengan backend API (`mnemos-backend`, port 3001) untuk memory info dan bundle.

---

## Tech Stack (Keputusan Final)

| Layer | Pilihan |
|---|---|
| Framework | Next.js latest (App Router, TypeScript) |
| Package manager | pnpm |
| UI components | shadcn/ui (dark theme) |
| Chain I/O | wagmi v2 + viem |
| Wallet picker | RainbowKit |
| Caching | @tanstack/react-query (via wagmi) |
| Styling | Tailwind CSS (via shadcn) |

---

## Visual Design

**Tema:** Dark, minimal, satu warna aksen.

| Token | Nilai |
|---|---|
| Background utama | `zinc-950` |
| Background card/surface | `zinc-900` |
| Border | `zinc-800` |
| Teks primer | `zinc-50` |
| Teks muted | `zinc-400` |
| Aksen primer | `violet-500` |
| Aksen hover | `violet-400` |
| Aksen border | `violet-500/30` |
| Aksen badge bg | `violet-500/10` |

- shadcn `dark` mode aktif secara default, tidak ada toggle light/dark.
- Tidak ada gradient dekoratif, tidak ada animasi library.
- Tailwind transitions saja untuk micro-interaction.
- Desktop-first. Mobile tidak diprioritaskan untuk demo.

---

## Halaman & Prioritas

### 1. `/marketplace` — Prioritas utama

Browse semua listing aktif.

- Scan event `Listed` dari marketplace contract via wagmi `usePublicClient` → `getLogs`.
- Render grid card listing, masing-masing menampilkan: token ID, kategori, harga beli, harga sewa/hari, flag (for sale / for rent / for fork), alamat seller (truncated).
- Empty state dengan copy yang jelas dan CTA.
- Filter by category via URL query param `?category=trading` (client-side filter, bukan `useState`).

### 2. `/listing/[id]` — Prioritas utama

Detail satu token.

**Data sources:**
- Provenance info: `GET /api/memory/:tokenId/info` → contentHash, storageUri, creator, parent, timestamp.
- Listing terms: `GET /api/marketplace/listings/:tokenId` → price, rentalPricePerDay, isForSale, isForRent, isForFork, forkRoyaltyBps, seller.
- Memory bundle (opsional): `GET /api/memory/:tokenId` → decoded bundle (hanya tampil jika API available).

**Layout:**
- Kolom kiri: provenance metadata (content hash, storage URI, creator address, parent token, timestamp).
- Kolom kanan: tiga action panel — Buy, Rent, Fork.
  - Buy: tampil harga, tombol "Buy" via `useWriteContract`.
  - Rent: input durasi hari, hitung total = `rentalPricePerDay × days`, tombol "Rent" via `useWriteContract`.
  - Fork: tombol disabled, teks "Use the SDK to fork this memory".
- Panel yang tidak aktif (isForSale=false, isForRent=false) dimuted/disabled.

### 3. `/dashboard` — Prioritas tinggi

Producer view.

- List token yang di-mint oleh wallet yang terhubung (scan `MemoryMinted` events).
- Untuk setiap token: tampil token ID, content hash, timestamp, status listing.
- Form "List on Marketplace":
  - Input: price (ETH), rentalPricePerDay (ETH), checkbox isForSale/isForRent/isForFork, slider forkRoyaltyBps (0-100, step 0.01%).
  - **Approval step**: sebelum call `list()`, cek dan call `setApprovalForAll(marketplaceAddress, true)` jika belum approved. Ini blocker yang dicatat di CLAUDE.md.
  - Submit via `useWriteContract`.
- Empty state: "No memory tokens yet. Run the reference agent to mint your first snapshot."

### 4. `/` — Landing

First impression.

- Hero: headline kuat, subheadline satu kalimat, dua CTA button (Marketplace + Dashboard).
- Section "How it works": tiga langkah (Agent snapshots → Mint token → Trade on marketplace).
- Footer minimal.

---

## Integrasi Backend API

Base URL: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api`).

**Aturan penting:**
- Semua nilai `tokenId`, `price`, `amount` dari API adalah **decimal string** — parse dengan `BigInt(value)` sebelum dikirim ke wagmi/viem.
- Jika `NEXT_PUBLIC_API_URL` tidak di-set atau API tidak merespons: tampilkan fallback state, jangan crash halaman. Core browsing masih bisa jalan via chain reads langsung.
- User-signed transactions (buy, rent) **tidak** melalui API — langsung ke chain via `useWriteContract`.

---

## Struktur File (Konvensi dari CLAUDE.md)

```
src/
├── app/
│   ├── page.tsx                    Landing (server component)
│   ├── layout.tsx                  Root layout + nav + providers
│   ├── globals.css
│   ├── marketplace/page.tsx        Browse (client component)
│   ├── listing/[id]/page.tsx       Detail + actions (client component)
│   └── dashboard/page.tsx          Producer dashboard (client component)
├── components/
│   ├── providers.tsx               wagmi + RainbowKit + react-query providers
│   └── connect-wallet.tsx          wallet button
└── lib/
    ├── wagmi.ts                    Chain config + 0G chain definition
    └── contracts.ts                Addresses + minimal ABIs
```

Page-specific components (ListingCard, ActionPanel, dll) **co-located** di file halaman masing-masing, bukan di `components/`.

---

## Environment Variables

```
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x...
NEXT_PUBLIC_OG_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_OG_CHAIN_ID=
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # untuk RainbowKit
```

---

## Known Gaps / Deferred

- **fromBlock optimization**: marketplace scan pakai `fromBlock: 0n` sementara. Cukup untuk testnet.
- **Optimistic UI**: setelah transaksi, user perlu reload. Acceptable untuk MVP.
- **Mobile layout**: tidak diprioritaskan.
- **SEO / OG image**: tidak diprioritaskan.
- **Light mode**: tidak ada. Dark only.
- **Fork flow**: disabled, arahkan ke SDK.

---

## Success Criteria

- [ ] Marketplace menampilkan semua listing aktif dari chain.
- [ ] Listing detail menampilkan provenance info + buy/rent panel yang fungsional.
- [ ] Dashboard menampilkan token milik wallet + form listing dengan approval step.
- [ ] Landing bisa di-screenshot dan terlihat profesional.
- [ ] `pnpm build` bersih tanpa error.
