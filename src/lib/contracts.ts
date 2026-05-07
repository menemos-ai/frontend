import { MemoryRegistryABI } from '@/abis/MemoryRegistry'
import { MemoryMarketplaceABI } from '@/abis/MemoryMarketplace'

function requireAddress(raw: string | undefined): `0x${string}` | undefined {
  if (!raw || raw.length !== 42 || !raw.startsWith('0x')) return undefined
  return raw as `0x${string}`
}

export const REGISTRY_ADDRESS = requireAddress(
  process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
)

export const MARKETPLACE_ADDRESS = requireAddress(
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS,
)

export const REGISTRY_ABI = MemoryRegistryABI
export const MARKETPLACE_ABI = MemoryMarketplaceABI

// Pre-extracted events — use these in getLogs calls instead of ABI[index]
export const MEMORY_MINTED_EVENT = MemoryRegistryABI.find(
  (x): x is Extract<(typeof MemoryRegistryABI)[number], { type: 'event'; name: 'MemoryMinted' }> =>
    x.type === 'event' && 'name' in x && x.name === 'MemoryMinted',
)!

export const LISTED_EVENT = MemoryMarketplaceABI.find(
  (x): x is Extract<(typeof MemoryMarketplaceABI)[number], { type: 'event'; name: 'Listed' }> =>
    x.type === 'event' && 'name' in x && x.name === 'Listed',
)!

export const RENTED_EVENT = MemoryMarketplaceABI.find(
  (x): x is Extract<(typeof MemoryMarketplaceABI)[number], { type: 'event'; name: 'Rented' }> =>
    x.type === 'event' && 'name' in x && x.name === 'Rented',
)!

export const BOUGHT_EVENT = MemoryMarketplaceABI.find(
  (x): x is Extract<(typeof MemoryMarketplaceABI)[number], { type: 'event'; name: 'Bought' }> =>
    x.type === 'event' && 'name' in x && x.name === 'Bought',
)!

export const FORKED_EVENT = MemoryMarketplaceABI.find(
  (x): x is Extract<(typeof MemoryMarketplaceABI)[number], { type: 'event'; name: 'Forked' }> =>
    x.type === 'event' && 'name' in x && x.name === 'Forked',
)!
