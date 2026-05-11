# Mnemos — Frontend (Marketplace UI)

> The reference marketplace for Mnemos. Browse memory snapshots, inspect on-chain provenance, and buy / rent / fork them.

For project overview, architecture diagram, and judging context, see the [root README](../README.md).

This is one of three repositories that make up Mnemos:

| Repo | Purpose |
|---|---|
| [`mnemos-contract`](../contract) | Solidity contracts deployed to 0G Chain |
| [`mnemos-backend`](../backend) | TypeScript SDK + NestJS REST API + reference agent |
| [`mnemos-frontend`](.) (this repo) | Next.js marketplace UI |

Mnemos is a protocol, not a platform — anyone can build a different marketplace UI on top of the same contracts. This is the canonical reference UI.

---

## What's in here

A Next.js App Router app with four pages:

- **`/`** — landing. Pitches the protocol, links to marketplace and dashboard.
- **`/marketplace`** — browse all active listings. Reads `Listed` events from the marketplace contract, renders cards with prices for all three monetization paths.
- **`/listing/[id]`** — listing detail. Shows on-chain provenance (content hash, storage URI, lineage ancestors, creator, timestamp) plus action panels for buy / rent / fork.
- **`/dashboard`** — producer view. Lists tokens minted by the connected wallet, with a form to set listing terms.

Chain reads and user-signed writes go directly through wagmi/viem in the browser. Agent-side operations (memory snapshots, minting) are delegated to the `mnemos-backend` REST API — the frontend never holds a private key. There's no database and no API routes inside this repo.

---

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [`wagmi`](https://wagmi.sh/) + [`viem`](https://viem.sh/) for chain I/O
- [`@tanstack/react-query`](https://tanstack.com/query) for caching (provided by wagmi)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [`@mnemos-sdk/sdk`](../backend) as a peer dependency for shared types
- `mnemos-backend` REST API (NestJS, port 3001) for agent-side operations

Node.js ≥ 20. Package manager: `pnpm`.

---

## 0G Integration

The frontend reads all state directly from **0G Chain** via wagmi + viem — no backend database, no intermediary. Chain reads (`getLogs`, `readContract`) go through `https://evmrpc.0g.ai` (chain ID `16661`) using the deployed contract addresses. User-signed writes (buy, rent, fork, list) are sent directly from the user's connected wallet. The backend API is only used for server-side operations that require a private key (memory snapshot + mint, memory decrypt).

---

### Responsibility split

| Operation | Who handles it |
|---|---|
| Browse listings (read chain) | `wagmi` / `viem` direct |
| Listing detail + provenance | `wagmi` / `viem` direct — or `GET /api/memory/:id/info` |
| User buy / rent / fork | `wagmi` (user signs with their wallet) |
| List token on marketplace | `wagmi` (user signs) |
| Agent memory snapshot + mint | `POST /api/memory/snapshot` (server wallet) |
| Load / decrypt memory bundle | `GET /api/memory/:id` (server wallet decrypts) |

---

## Quickstart

### Prerequisites

```bash
npm install -g pnpm
```

You also need:

1. The contracts deployed (see [`mnemos-contract`](../contract))
2. The SDK either published to npm or linked locally (see [`mnemos-backend`](../backend))
3. The backend API running (see [`mnemos-backend`](../backend) — `pnpm dev` inside `apps/api`)

### Setup

```bash
git clone <this-repo>
cd mnemos-frontend
pnpm install
cp .env.example .env.local
# fill in:
#   NEXT_PUBLIC_REGISTRY_ADDRESS=0x... (from contract repo deploy)
#   NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x... (from contract repo deploy)
#   NEXT_PUBLIC_OG_RPC_URL=https://evmrpc.0g.ai
#   NEXT_PUBLIC_OG_CHAIN_ID=
#   NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Run

```bash
# Terminal 1 — backend API (mnemos-backend repo)
cd ../backend && pnpm --filter @mnemos/api dev   # localhost:3001

# Terminal 2 — frontend
pnpm dev                                          # localhost:3000
```

For end-to-end testing, run the reference agent from `mnemos-backend` in a third terminal — you'll see snapshots appearing in the dashboard within seconds.

Swagger docs for the backend API: `http://localhost:3001/docs`

---

## Repository layout

```
mnemos-frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                Landing
│   │   ├── layout.tsx              Root layout + nav
│   │   ├── globals.css
│   │   ├── marketplace/page.tsx    Browse
│   │   ├── listing/[id]/page.tsx   Detail + actions
│   │   └── dashboard/page.tsx      Producer dashboard
│   ├── components/
│   │   ├── providers.tsx           wagmi + react-query providers
│   │   └── connect-wallet.tsx
│   ├── hooks/
│   └── lib/
│       ├── wagmi.ts                Chain config
│       └── contracts.ts            Addresses + ABIs
│
├── public/
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
├── README.md                       (this file)
└── CLAUDE.md                       Guidance for Claude Code
```

---

## Common commands

```bash
pnpm dev                     # next dev on localhost:3000
pnpm build                   # production build
pnpm start                   # serve production build
pnpm lint                    # next lint
```

---

## Deploying

This is a static-friendly Next.js app — `pnpm build` produces output that can be deployed to Vercel, Netlify, Cloudflare Pages, or any static host. No environment variables need to be secret (everything is `NEXT_PUBLIC_*`), so the build can be public.

Vercel with the `mnemos-frontend` repo connected is the path of least resistance.

---

## License

MIT