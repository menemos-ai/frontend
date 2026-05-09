'use client'

import { useEffect, useRef } from 'react'

export function RevealSection({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Skip reveal animation for sections already in the viewport at mount to prevent FOUC.
    // getBoundingClientRect is synchronous, so this avoids the invisible flash that would occur
    // if we added the 'reveal' class and then immediately received an IO callback.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight) {
      return
    }

    el.classList.add('reveal')

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible')
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(el)

    return () => { observer.disconnect() }
  }, [])

  return <div ref={wrapperRef}>{children}</div>
}
