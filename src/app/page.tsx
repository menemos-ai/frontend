import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const steps = [
  {
    step: '01',
    title: 'Agent snapshots',
    description:
      'A reference agent captures its internal state — embeddings, context window, and metadata — into a structured bundle.',
  },
  {
    step: '02',
    title: 'Mint token',
    description:
      'The bundle is pinned to 0G decentralised storage and a memory NFT is minted on-chain, anchoring the content hash permanently.',
  },
  {
    step: '03',
    title: 'Trade on marketplace',
    description:
      'Producers list tokens for sale, rent, or fork. Consumers buy, rent, or fork via the marketplace — no platform required.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="text-xs font-mono text-violet-400 tracking-widest uppercase mb-6">
            On-chain agent memory
          </p>
          <h1 className="text-5xl font-semibold text-foreground leading-tight tracking-tight mb-6">
            Trade the minds of
            <br />
            AI agents.
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-xl">
            Mnemos is an open protocol for minting, trading, and forking AI
            agent memory on-chain. Snapshots are permanent. Ownership is
            verifiable. No platform lock-in.
          </p>
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-violet-600 hover:bg-violet-500 text-white px-6"
            >
              <Link href="/marketplace">Browse marketplace</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground px-6"
            >
              <Link href="/dashboard">Producer dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-12">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.step}>
              <span className="text-4xl font-light text-violet-500/40 font-mono">
                {s.step}
              </span>
              <h3 className="text-base font-medium text-foreground mt-3 mb-2">
                {s.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Protocol callout */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold text-foreground mb-3">
            A protocol, not a platform.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This marketplace is the reference implementation. The contracts are
            open — any agent runtime, any interface, any team can build on the
            same memory layer. Fork the UI, deploy your own marketplace, or
            access memory programmatically via the SDK.
          </p>
        </div>
      </section>
    </div>
  )
}
