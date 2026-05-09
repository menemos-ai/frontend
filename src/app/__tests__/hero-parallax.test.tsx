import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { HeroParallax } from '../_hero-parallax'

// window.scrollY is read-only in jsdom; override via Object.defineProperty
function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { value, writable: true, configurable: true })
}

function makeMatchMedia(reducedMotion: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

describe('HeroParallax', () => {
  // rAF fires async in jsdom; stub with immediate version for the whole suite.
  // We restore by re-stubbing originals (not vi.unstubAllGlobals — that removes the
  // IntersectionObserver mock from setup.ts, breaking Next.js Link in subsequent tests).
  let origRAF: typeof window.requestAnimationFrame
  let origCAF: typeof window.cancelAnimationFrame

  beforeEach(() => {
    setScrollY(0)
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(false) })
    origRAF = window.requestAnimationFrame.bind(window)
    origCAF = window.cancelAnimationFrame.bind(window)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })

  afterEach(() => {
    setScrollY(0)
    vi.stubGlobal('requestAnimationFrame', origRAF)
    vi.stubGlobal('cancelAnimationFrame', origCAF)
  })

  it('renders h1 with expected content', () => {
    render(<HeroParallax />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toMatch(/AI agents have memory/i)
  })

  it('renders all three CTA links', () => {
    render(<HeroParallax />)
    expect(screen.getByRole('link', { name: /browse marketplace/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /api docs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /npm sdk/i })).toBeInTheDocument()
  })

  it('applies translateY transform to h1 on scroll', async () => {
    render(<HeroParallax />)
    const heading = screen.getByRole('heading', { level: 1 })

    setScrollY(100)
    await act(async () => { fireEvent.scroll(window) })

    // Positive multiplier: h1 moves at 70% of scroll speed (true parallax, slower than content)
    expect(heading.style.transform).toBe('translateY(30px)')
  })

  it('does not apply transform when prefers-reduced-motion is set', async () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(true) })

    render(<HeroParallax />)
    const heading = screen.getByRole('heading', { level: 1 })

    setScrollY(100)
    await act(async () => { fireEvent.scroll(window) })

    expect(heading.style.transform).toBe('')
  })

  it('removes scroll listener and cancels rAF on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<HeroParallax />)
    await act(async () => { unmount() })

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    removeSpy.mockRestore()
  })
})
