const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

export interface MemoryInfo {
  tokenId: string
  contentHash: string
  storageUri: string
  creator: string
  parent: string | null
  timestamp: string
}

export interface ListingInfo {
  tokenId: string
  seller: string
  buyPrice: string        // "0" = not for sale
  rentPricePerDay: string // "0" = not for rent
  forkPrice: string       // "0" = not for fork
  royaltyBps: number
}

export interface MemoryBundle {
  tokenId: string
  bundle: unknown | null
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

export async function fetchMemoryInfo(tokenId: string): Promise<MemoryInfo> {
  return apiFetch<MemoryInfo>(`/memory/${tokenId}/info`)
}

export async function fetchListingInfo(tokenId: string): Promise<ListingInfo> {
  return apiFetch<ListingInfo>(`/marketplace/listings/${tokenId}`)
}

export async function fetchMemoryBundle(
  tokenId: string,
): Promise<MemoryBundle> {
  return apiFetch<MemoryBundle>(`/memory/${tokenId}`)
}
