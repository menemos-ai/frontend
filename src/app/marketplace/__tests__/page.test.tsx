import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import MarketplacePage from '../page'

// useSearchParams requires Suspense + Next.js router — mock in jsdom
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/marketplace',
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    usePublicClient: () => undefined,
  }
})

describe('MarketplacePage', () => {
  it('renders page heading', async () => {
    renderWithProviders(<MarketplacePage />)
    // heading renders after Suspense resolves
    const heading = await screen.findByRole('heading', { name: /marketplace/i })
    expect(heading).toBeInTheDocument()
  })

  it('shows empty state when no listings', async () => {
    renderWithProviders(<MarketplacePage />)
    const empty = await screen.findByText(/no listings yet/i)
    expect(empty).toBeInTheDocument()
  })

  it('renders category filter links', async () => {
    renderWithProviders(<MarketplacePage />)
    await screen.findByRole('heading', { name: /marketplace/i })
    expect(screen.getByRole('link', { name: /^all$/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sale/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /rent/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /fork/i })).toBeInTheDocument()
  })
})
