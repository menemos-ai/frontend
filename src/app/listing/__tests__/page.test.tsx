import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, act, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/render'
import { ListingDetail } from '../[id]/_listing-detail'

const mocks = vi.hoisted(() => ({
  writeContractAsync: vi.fn(),
  waitForTransactionReceipt: vi.fn(),
  useAccount: vi.fn(() => ({ isConnected: false, address: undefined })),
  usePublicClient: vi.fn(() => undefined),
  parseEventLogs: vi.fn(() => []),
}))

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount: mocks.useAccount,
    useWriteContract: () => ({ writeContractAsync: mocks.writeContractAsync }),
    usePublicClient: mocks.usePublicClient,
  }
})

vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>()
  return {
    ...actual,
    parseEventLogs: mocks.parseEventLogs,
  }
})

describe('ListingDetail', () => {
  beforeEach(() => {
    mocks.useAccount.mockImplementation(() => ({ isConnected: false, address: undefined }))
    mocks.usePublicClient.mockImplementation(() => undefined)
    mocks.writeContractAsync.mockReset()
    mocks.waitForTransactionReceipt.mockReset()
    mocks.parseEventLogs.mockImplementation(() => [])
  })

  it('renders memory token heading', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByRole('heading', { name: '#1' })).toBeInTheDocument()
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

  it('renders fork panel "not available" message when forkPrice is 0', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByText(/not available for fork/i)).toBeInTheDocument()
  })

  it('shows connect wallet prompt when not connected', async () => {
    renderWithProviders(<ListingDetail id="1" />)
    expect(await screen.findByText(/connect your wallet/i)).toBeInTheDocument()
  })

  describe('ForkPanel', () => {
    // Must be EIP-55 checksummed — viem's encodePacked validates address format
    const CONNECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as `0x${string}`

    beforeEach(() => {
      mocks.useAccount.mockImplementation(() => ({
        isConnected: true,
        address: CONNECTED_ADDRESS,
      }))
    })

    it('shows Fork Now button enabled when forkPrice > 0', async () => {
      renderWithProviders(<ListingDetail id="4" />)
      const button = await screen.findByRole('button', { name: /fork now/i })
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })

    it('shows error message when writeContractAsync rejects', async () => {
      mocks.writeContractAsync.mockRejectedValueOnce(new Error('user rejected'))
      renderWithProviders(<ListingDetail id="4" />)
      const button = await screen.findByRole('button', { name: /fork now/i })
      await act(async () => {
        fireEvent.click(button)
        // Drain microtask queue for the async rejection chain
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByText(/user rejected/i)).toBeInTheDocument()
    })

    it('shows success card after tx confirmed', async () => {
      const txHash = '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678'
      mocks.writeContractAsync.mockResolvedValueOnce(txHash)
      mocks.waitForTransactionReceipt.mockResolvedValueOnce({ logs: [] })
      mocks.usePublicClient.mockImplementation(() => ({
        waitForTransactionReceipt: mocks.waitForTransactionReceipt,
      }))
      renderWithProviders(<ListingDetail id="4" />)
      const button = await screen.findByRole('button', { name: /fork now/i })
      await act(async () => {
        fireEvent.click(button)
        // Drain microtask queue for writeContractAsync + waitForTransactionReceipt
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByText(/fork berhasil/i)).toBeInTheDocument()
    })

    it('shows child token ID after Forked event parsed', async () => {
      const txHash = '0xdeadbeef1234567890abcdef1234567890abcdef1234567890abcdef12345678'
      mocks.writeContractAsync.mockResolvedValueOnce(txHash)
      mocks.waitForTransactionReceipt.mockResolvedValueOnce({ logs: [] })
      mocks.parseEventLogs.mockReturnValueOnce([{ args: { childTokenId: 99n } }])
      mocks.usePublicClient.mockImplementation(() => ({
        waitForTransactionReceipt: mocks.waitForTransactionReceipt,
      }))
      renderWithProviders(<ListingDetail id="4" />)
      const button = await screen.findByRole('button', { name: /fork now/i })
      await act(async () => {
        fireEvent.click(button)
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(screen.getByText(/child token #99/i)).toBeInTheDocument()
    })
  })
})
