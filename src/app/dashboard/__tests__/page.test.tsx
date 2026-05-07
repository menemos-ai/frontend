import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from '../page'

// Completely replace wagmi so no WagmiProvider context is needed.
// The mock connector auto-connects, so we can't use the real WagmiProvider
// for disconnected-state tests — provide a lightweight fake context instead.
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ isConnected: false, address: undefined })),
  useWriteContract: () => ({ writeContractAsync: vi.fn() }),
  usePublicClient: () => undefined,
  WagmiProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <DashboardPage />
    </QueryClientProvider>,
  )
}

describe('DashboardPage (disconnected)', () => {
  it('renders page heading', async () => {
    renderDashboard()
    expect(
      await screen.findByRole('heading', { name: /dashboard/i }),
    ).toBeInTheDocument()
  })

  it('shows connect wallet prompt when disconnected', async () => {
    renderDashboard()
    expect(
      await screen.findByText(/connect your wallet/i),
    ).toBeInTheDocument()
  })
})

describe('DashboardPage (connected, no tokens)', () => {
  it('shows empty state when connected but no tokens', async () => {
    const { useAccount } = await import('wagmi')
    vi.mocked(useAccount).mockReturnValue({
      isConnected: true,
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    } as ReturnType<typeof useAccount>)

    renderDashboard()
    expect(
      await screen.findByText(/no memory tokens yet/i),
    ).toBeInTheDocument()
  })
})
