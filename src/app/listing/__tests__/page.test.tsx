import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { ListingDetail } from '../[id]/_listing-detail'

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: () => ({ isConnected: false, address: undefined }),
    useWriteContract: () => ({ writeContractAsync: vi.fn() }),
    usePublicClient: () => undefined,
  }
})

describe('ListingDetail', () => {
  it('renders memory token heading', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByRole('heading', { name: /memory #1/i })).toBeInTheDocument()
  })

  it('shows provenance section heading after data loads', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByText(/content hash/i)).toBeInTheDocument()
  })

  it('renders buy panel after data loads (MSW returns isForSale: true)', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByRole('heading', { name: /^buy$/i })).toBeInTheDocument()
  })

  it('renders rent panel after data loads', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByRole('heading', { name: /^rent$/i })).toBeInTheDocument()
  })

  it('renders fork panel button as disabled', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    const forkBtn = await screen.findByRole('button', { name: /use the sdk/i })
    expect(forkBtn).toBeDisabled()
  })

  it('shows connect wallet prompt when not connected', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByText(/connect your wallet/i)).toBeInTheDocument()
  })
})
