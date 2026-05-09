import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { RevealSection } from '../_reveal-section'

// The IntersectionObserver mock in setup.ts stores the last callback here.
// Cast to access it in tests.
type IOWithCallback = typeof IntersectionObserver & { lastCallback?: IntersectionObserverCallback }

function triggerIntersection(isIntersecting: boolean) {
  const cb = (IntersectionObserver as IOWithCallback).lastCallback
  if (!cb) throw new Error('No IntersectionObserver callback captured')
  act(() => {
    cb(
      [{ isIntersecting } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
  })
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

describe('RevealSection', () => {
  beforeEach(() => {
    // Reset IO mock call history and the lastCallback property (mockClear resets call
    // counts but not properties set directly on the mock function).
    vi.mocked(IntersectionObserver).mockClear()
    ;(IntersectionObserver as IOWithCallback).lastCallback = undefined
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(false) })
    // jsdom returns getBoundingClientRect().top = 0; set innerHeight = 0 so sections
    // appear below the fold (0 < 0 is false), allowing the reveal class to be added.
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 0 })
  })

  it('renders children', () => {
    render(
      <RevealSection>
        <p>hello</p>
      </RevealSection>,
    )
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('adds reveal class after mount', async () => {
    const { container } = render(
      <RevealSection>
        <p>content</p>
      </RevealSection>,
    )
    // useEffect fires after render; act() flushes it
    await act(async () => {})
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.classList.contains('reveal')).toBe(true)
  })

  it('adds visible class when IntersectionObserver fires with isIntersecting: true', async () => {
    const { container } = render(
      <RevealSection>
        <p>content</p>
      </RevealSection>,
    )
    await act(async () => {})
    const wrapper = container.firstElementChild as HTMLElement

    triggerIntersection(true)

    expect(wrapper.classList.contains('reveal')).toBe(true)
    expect(wrapper.classList.contains('visible')).toBe(true)
  })

  it('disconnects observer after first intersection (one-shot)', async () => {
    render(
      <RevealSection>
        <p>content</p>
      </RevealSection>,
    )
    await act(async () => {})

    // Get the last created observer instance
    const lastInstance = vi.mocked(IntersectionObserver).mock.results.at(-1)?.value as {
      disconnect: ReturnType<typeof vi.fn>
    }

    triggerIntersection(true)

    expect(lastInstance.disconnect).toHaveBeenCalledTimes(1)
  })

  it('does not add visible class when isIntersecting is false', async () => {
    const { container } = render(
      <RevealSection>
        <p>content</p>
      </RevealSection>,
    )
    await act(async () => {})
    const wrapper = container.firstElementChild as HTMLElement

    triggerIntersection(false)

    expect(wrapper.classList.contains('visible')).toBe(false)
  })

  it('does not add reveal class when prefers-reduced-motion is set', async () => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(true) })

    const { container } = render(
      <RevealSection>
        <p>content</p>
      </RevealSection>,
    )
    await act(async () => {})
    const wrapper = container.firstElementChild as HTMLElement

    expect(wrapper.classList.contains('reveal')).toBe(false)
    expect(wrapper.classList.contains('visible')).toBe(false)
  })

  it('disconnects observer on unmount', async () => {
    const { unmount } = render(
      <RevealSection>
        <p>content</p>
      </RevealSection>,
    )
    await act(async () => {})

    const lastInstance = vi.mocked(IntersectionObserver).mock.results.at(-1)?.value as {
      disconnect: ReturnType<typeof vi.fn>
    }

    await act(async () => { unmount() })

    expect(lastInstance.disconnect).toHaveBeenCalled()
  })

  it('does not add reveal class when section is already in the viewport at mount', async () => {
    // Simulate innerHeight > getBoundingClientRect().top (0) so the FOUC guard fires
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1000 })

    const { container } = render(
      <RevealSection>
        <p>content</p>
      </RevealSection>,
    )
    await act(async () => {})
    const wrapper = container.firstElementChild as HTMLElement

    expect(wrapper.classList.contains('reveal')).toBe(false)
    expect(wrapper.classList.contains('visible')).toBe(false)
  })
})
