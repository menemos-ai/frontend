import Link from 'next/link'

const steps = [
  {
    step: '01',
    title: 'Agent snapshots itself',
    description:
      'With five lines of SDK code, any agent runtime can begin auto-snapshotting its memory on a schedule. The snapshot is a structured bundle — embeddings, context, metadata — encrypted with the agent\'s key before it ever leaves the host machine.',
  },
  {
    step: '02',
    title: 'Mint memory token',
    description:
      'The encrypted bundle is uploaded to 0G decentralised storage, returning a content-addressed URI. A memory token is minted on 0G Chain, anchoring the content hash, the storage URI, and the agent\'s identity in a single on-chain record. From this point, the snapshot is permanent and the provenance is public.',
  },
  {
    step: '03',
    title: 'Trade, rent, or fork',
    description:
      'Producers list their memory tokens with one or more pricing models — outright sale, time-limited rental, or forkable inheritance with royalty streams. Consumers acquire memory through the same marketplace contract, load it into their own agent, and start operating with experience they didn\'t have to spend months building.',
  },
]

const whyOnChain = [
  {
    label: 'PROVENANCE',
    title: 'Verifiable history',
    body: 'A buyer needs to know the memory is real — that an agent actually operated for the period it claims, with the experience it claims. Every snapshot Mnemos mints carries an immutable record of when it was created, by whom, and from what parent state. No screenshots, no trust required.',
  },
  {
    label: 'PORTABILITY',
    title: 'No runtime lock-in',
    body: 'Memory is stored on 0G decentralised storage, not on the platform that hosted the agent. When you buy a memory token, you can load it into your own runtime — LangChain, OpenClaw, custom framework — without asking anyone for permission or paying export fees.',
  },
  {
    label: 'COMPOSABILITY',
    title: 'Forkable lineage',
    body: 'Memory isn\'t just buyable, it\'s inheritable. Fork an agent\'s memory and its experience becomes the starting point for your own. The original creator earns royalties as the lineage spreads — the same primitive that made open source viable, now applied to operational intelligence.',
  },
]

const whoFor = [
  {
    label: 'AGENT OPERATORS',
    title: 'Monetize your operational alpha',
    body: 'You\'ve spent compute and time training an agent that actually works. Mnemos lets you sell that experience without giving up the strategy itself — or rent it for recurring revenue while you keep building.',
  },
  {
    label: 'NEW DEPLOYERS',
    title: 'Skip the cold-start problem',
    body: 'Launching a fresh agent into a competitive market is hard. Buying or forking a battle-tested memory snapshot gives your agent a starting point that took someone else six months to reach.',
  },
  {
    label: 'INFRASTRUCTURE BUILDERS',
    title: 'Build on a memory primitive',
    body: 'Mnemos is a protocol, not an app. Build your own marketplace, your own agent runtime, your own analytics layer — they all share the same on-chain memory layer underneath.',
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
            AI agents have memory.{' '}
            <span className="gradient-text">Until now, no one owned it.</span>
          </h1>
          <p className="text-lg text-white/55 leading-relaxed mb-10 max-w-xl">
            Every autonomous agent accumulates something valuable while it works —
            trade history, learned patterns, customer interactions, strategy weights.
            That experience disappears when the agent shuts down, and stays trapped
            inside whatever runtime hosts it. Mnemos turns it into a portable,
            ownable, tradeable asset on 0G.
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

      {/* The Problem */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-card rounded-2xl p-8 max-w-2xl">
          <p className="text-xs font-mono text-violet-400 tracking-widest uppercase mb-4">
            The problem
          </p>
          <h2 className="text-2xl font-bold text-white mb-3">
            Six months of agent experience, gone in a server reset.
          </h2>
          <p className="text-sm text-white/55 leading-relaxed mb-4">
            Today's autonomous agents are amnesiac employees. A trading agent that
            spent six months learning DeFi pool dynamics has no way to carry that
            experience to a new deployment. A support agent that handled 10,000
            tickets can't transfer its learned response patterns to its replacement.
            The operational memory — the part that took real time and real
            interactions to build — lives inside a Postgres row or a vector store
            on someone else's infrastructure.
          </p>
          <p className="text-sm text-white/55 leading-relaxed">
            This is fine when agents are toys. It's a serious problem now that
            agents are starting to do real work, hold real positions, and represent
            real economic value. Memory that was earned should be ownable. Memory
            that's ownable can be priced, transferred, and inherited.
          </p>
        </div>
      </section>

      <div className="border-t border-white/10" />

      {/* Why On-Chain */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <p className="text-xs font-mono text-white/40 tracking-widest uppercase mb-4">
          Why on-chain
        </p>
        <h2 className="text-3xl font-bold text-white mb-12">
          Three properties that aren't optional for agent memory.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whyOnChain.map((item) => (
            <div
              key={item.label}
              className="glass-card rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300 group"
            >
              <span className="text-xs font-mono text-violet-400 tracking-widest uppercase block mb-5 opacity-60">
                {item.label}
              </span>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {item.body}
              </p>
            </div>
          ))}
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

      {/* Who is this for */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <p className="text-xs font-mono text-white/40 tracking-widest uppercase mb-4">
          Who builds with Mnemos
        </p>
        <h2 className="text-3xl font-bold text-white mb-12">
          Built for the agent economy that's already arriving.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whoFor.map((item) => (
            <div
              key={item.label}
              className="glass-card rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300 group"
            >
              <span className="text-xs font-mono text-violet-400 tracking-widest uppercase block mb-5 opacity-60">
                {item.label}
              </span>
              <h3 className="text-base font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                {item.body}
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
            This is one interface. Build the next one.
          </h2>
          <p className="text-sm text-white/55 leading-relaxed mb-6">
            Mnemos is an open protocol — the contracts, the SDK, and the storage
            layer are public infrastructure. This marketplace is just one reference
            implementation, designed to make the primitives concrete. Any agent
            runtime, any UI, any team can build directly on the same contracts.
            The memory layer is shared. Everything else is up for grabs.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
          >
            Browse the marketplace →
          </Link>
        </div>
      </section>
    </div>
  )
}
