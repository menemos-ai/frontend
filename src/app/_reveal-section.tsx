'use client'

import { useEffect, useRef } from 'react'

export function RevealSection({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

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
