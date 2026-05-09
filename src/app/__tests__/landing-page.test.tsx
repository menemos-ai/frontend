import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import LandingPage from '../page'

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

describe('LandingPage (integration)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', { writable: true, value: makeMatchMedia(false) })
    // jsdom returns getBoundingClientRect().top = 0; set innerHeight = 0 so all sections
    // appear below the fold, ensuring the reveal class is added during mount.
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 0 })
  })
  it('renders without errors', async () => {
    await act(async () => {
      render(<LandingPage />)
    })
    // If render throws, the test fails — this is the smoke check
  })

  it('hero heading is present', async () => {
    await act(async () => {
      render(<LandingPage />)
    })
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.textContent).toMatch(/AI agents have memory/i)
  })

  it('all five below-hero section headings are present', async () => {
    await act(async () => {
      render(<LandingPage />)
    })
    expect(screen.getByText(/six months of agent experience/i)).toBeInTheDocument()
    expect(screen.getByText(/three properties that aren't optional/i)).toBeInTheDocument()
    expect(screen.getByText(/three steps to own ai memory/i)).toBeInTheDocument()
    expect(screen.getByText(/built for the agent economy/i)).toBeInTheDocument()
    expect(screen.getByText(/this is one interface/i)).toBeInTheDocument()
  })

  it('Browse marketplace CTA links to /marketplace', async () => {
    await act(async () => {
      render(<LandingPage />)
    })
    const links = screen.getAllByRole('link', { name: /browse marketplace/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute('href', '/marketplace')
  })

  it('five RevealSection wrappers receive reveal class after mount', async () => {
    const { container } = render(<LandingPage />)
    await act(async () => {})

    const revealDivs = container.querySelectorAll('.reveal')
    expect(revealDivs.length).toBe(5)
  })
})
