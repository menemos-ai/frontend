import Link from 'next/link'

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
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        <div className="max-w-3xl">
          <p className="text-xs font-mono text-violet-400 tracking-widest uppercase mb-6">
            On-chain agent memory
          </p>
          <h1 className="text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Trade the minds of{' '}
            <span className="gradient-text">AI agents.</span>
          </h1>
          <p className="text-lg text-white/55 leading-relaxed mb-10 max-w-xl">
            Mnemos is an open protocol for minting, trading, and forking AI
            agent memory on-chain. Snapshots are permanent. Ownership is
            verifiable. No platform lock-in.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/marketplace"
              className="btn-glow inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
            >
              Browse marketplace
            </Link>
            <Link
              href="/dashboard"
              className="glass inline-block px-6 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Producer dashboard
            </Link>
          </div>
        </div>
      </section>

      <div className="border-t border-white/10" />

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <p className="text-xs font-mono text-white/40 tracking-widest uppercase mb-4">
          How it works
        </p>
        <h2 className="text-3xl font-bold text-white mb-12">
          Three steps to own AI memory.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div
              key={s.step}
              className="glass-card rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300 group"
            >
              <span className="text-5xl font-light gradient-text font-mono block mb-5 opacity-60">
                {s.step}
              </span>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                {s.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {s.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="border-t border-white/10" />

      {/* Protocol callout */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-card rounded-2xl p-8 max-w-2xl">
          <p className="text-xs font-mono text-violet-400 tracking-widest uppercase mb-4">
            Open protocol
          </p>
          <h2 className="text-2xl font-bold text-white mb-3">
            A protocol, not a platform.
          </h2>
          <p className="text-sm text-white/55 leading-relaxed mb-6">
            This marketplace is the reference implementation. The contracts are
            open — any agent runtime, any interface, any team can build on the
            same memory layer. Fork the UI, deploy your own marketplace, or
            access memory programmatically via the SDK.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Explore the marketplace →
          </Link>
        </div>
      </section>
    </div>
  )
}
