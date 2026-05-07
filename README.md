# Mnemos — Frontend (Marketplace UI)

> The reference marketplace for Mnemos. Browse memory snapshots, inspect on-chain provenance, and buy / rent / fork them.

This is one of three repositories that make up Mnemos:

| Repo | Purpose |
|---|---|
| [`mnemos-contract`](../contract) | Solidity contracts deployed to 0G Chain |
| [`mnemos-backend`](../backend) | TypeScript SDK + reference agent |
| [`mnemos-frontend`](.) (this repo) | Next.js marketplace UI |

Mnemos is a protocol, not a platform — anyone can build a different marketplace UI on top of the same contracts. This is the canonical reference UI.

---

## What's in here

A Next.js App Router app with four pages:

- **`/`** — landing. Pitches the protocol, links to marketplace and dashboard.
- **`/marketplace`** — browse all active listings. Reads `Listed` events from the marketplace contract, renders cards with prices for all three monetization paths.
- **`/listing/[id]`** — listing detail. Shows on-chain provenance (content hash, storage URI, lineage ancestors, creator, timestamp) plus action panels for buy / rent / fork.
- **`/dashboard`** — producer view. Lists tokens minted by the connected wallet, with a form to set listing terms.

Everything is read-from-chain or write-to-chain. There's **no traditional backend**, no database, no API routes. The app should still work after being deployed as static HTML.

---

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [`wagmi`](https://wagmi.sh/) + [`viem`](https://viem.sh/) for chain I/O
- [`@tanstack/react-query`](https://tanstack.com/query) for caching (provided by wagmi)
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [`@mnemos/sdk`](../backend) as a peer dependency for shared types

Node.js ≥ 20. Package manager: `pnpm`.

---

## Quickstart

### Prerequisites

```bash
npm install -g pnpm
```

You also need:

1. The contracts deployed (see [`mnemos-contract`](../contract))
2. The SDK either published to npm or linked locally (see [`mnemos-backend`](../backend))

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
```

### Run

```bash
pnpm dev                     # localhost:3000
```

For end-to-end testing, run the reference agent from `mnemos-backend` in another terminal — you'll see snapshots appearing in the dashboard within seconds.

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

For the hackathon demo, Vercel with the `mnemos-frontend` repo connected is the path of least resistance.

---

## Status

Hackathon MVP for the [0G APAC Hackathon](https://www.hackquest.io/hackathons/0G-APAC-Hackathon).

## License

MIT