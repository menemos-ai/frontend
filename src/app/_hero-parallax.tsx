'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'

export function HeroParallax() {
  const headlineRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const el = headlineRef.current
    if (!el) return

    el.style.willChange = 'transform'

    let rafId: number

    function onScroll() {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (headlineRef.current) {
          headlineRef.current.style.transform = `translateY(${window.scrollY * -0.3}px)`
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-28 pb-24">
      <div className="max-w-3xl">
        <p className="text-xs font-mono text-violet-400 tracking-widest uppercase mb-6">
          On-chain agent memory
        </p>
        <h1
          ref={headlineRef}
          className="text-6xl font-bold text-white leading-tight tracking-tight mb-6"
        >
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
            href="https://mnemos-api.imhuman.fun/docs#/"
            target="_blank"
            className="glass inline-block px-6 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            API docs
          </Link>
          <Link
            href="https://www.npmjs.com/package/@mnemos-sdk/sdk?activeTab=readme"
            target="_blank"
            className="glass inline-block px-6 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            NPM SDK
          </Link>
        </div>
      </div>
    </section>
  )
}
