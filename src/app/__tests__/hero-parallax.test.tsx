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
  beforeEach(() => {
    setScrollY(0)
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(false) })
  })

  afterEach(() => {
    setScrollY(0)
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
    // rAF fires async in jsdom; save originals and stub with immediate version for this test only.
    // We restore by re-stubbing (not vi.unstubAllGlobals — that would remove the IntersectionObserver
    // mock added in setup.ts, breaking Next.js Link in subsequent tests).
    const origRAF = window.requestAnimationFrame.bind(window)
    const origCAF = window.cancelAnimationFrame.bind(window)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<HeroParallax />)
    const heading = screen.getByRole('heading', { level: 1 })

    setScrollY(100)
    await act(async () => { fireEvent.scroll(window) })

    expect(heading.style.transform).toBe('translateY(-30px)')

    vi.stubGlobal('requestAnimationFrame', origRAF)
    vi.stubGlobal('cancelAnimationFrame', origCAF)
  })

  it('does not apply transform when prefers-reduced-motion is set', async () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(true) })

    const origRAF = window.requestAnimationFrame.bind(window)
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0 })

    render(<HeroParallax />)
    const heading = screen.getByRole('heading', { level: 1 })

    setScrollY(100)
    await act(async () => { fireEvent.scroll(window) })

    expect(heading.style.transform).toBe('')

    vi.stubGlobal('requestAnimationFrame', origRAF)
  })

  it('removes scroll listener on unmount', async () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<HeroParallax />)
    await act(async () => { unmount() })

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
    removeSpy.mockRestore()
  })
})
