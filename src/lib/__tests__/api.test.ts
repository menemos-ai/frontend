import { describe, it, expect } from 'vitest'
import {
  fetchMemoryInfo,
  fetchListingInfo,
  fetchMemoryBundle,
} from '../api'

describe('fetchMemoryInfo', () => {
  it('returns memory info for a token', async () => {
    const info = await fetchMemoryInfo('1')
    expect(info.tokenId).toBe('1')
    expect(info.contentHash).toBe('0xabc123')
    expect(info.creator).toMatch(/^0x/)
  })
})

describe('fetchListingInfo', () => {
  it('returns listing info with string BigInt prices', async () => {
    const listing = await fetchListingInfo('1')
    expect(listing.tokenId).toBe('1')
    expect(typeof listing.price).toBe('string')
    expect(BigInt(listing.price)).toBeGreaterThan(0n)
    expect(typeof listing.rentalPricePerDay).toBe('string')
  })

  it('returns boolean flags', async () => {
    const listing = await fetchListingInfo('1')
    expect(typeof listing.isForSale).toBe('boolean')
    expect(typeof listing.isForRent).toBe('boolean')
    expect(typeof listing.isForFork).toBe('boolean')
  })
})

describe('fetchMemoryBundle', () => {
  it('returns bundle data for a token', async () => {
    const bundle = await fetchMemoryBundle('1')
    expect(bundle.tokenId).toBe('1')
  })
})
