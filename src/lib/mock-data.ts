import type { MemoryInfo, ListingInfo } from '@/lib/api'

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

export interface MockListing {
  tokenId: string
  seller: string
  buyPrice: bigint
  rentPricePerDay: bigint
  forkPrice: bigint
  royaltyBps: number
}

export const MOCK_LISTINGS: MockListing[] = [
  {
    tokenId: '1',
    seller: '0x742d35Cc6634C0532925a3b8D4C9c5e9C8b5F0a1',
    buyPrice: BigInt('500000000000000000'),        // 0.5 A0GI
    rentPricePerDay: BigInt('50000000000000000'),  // 0.05 A0GI/day
    forkPrice: BigInt('0'),
    royaltyBps: 0,
  },
  {
    tokenId: '2',
    seller: '0x8ba1f109551bD432803012645Hac136c9C8cF0a2',
    buyPrice: BigInt('1200000000000000000'),       // 1.2 A0GI
    rentPricePerDay: BigInt('0'),
    forkPrice: BigInt('100000000000000000'),       // 0.1 A0GI to fork
    royaltyBps: 500,
  },
  {
    tokenId: '3',
    seller: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
    buyPrice: BigInt('0'),
    rentPricePerDay: BigInt('20000000000000000'), // 0.02 A0GI/day
    forkPrice: BigInt('0'),
    royaltyBps: 0,
  },
  {
    tokenId: '4',
    seller: '0x742d35Cc6634C0532925a3b8D4C9c5e9C8b5F0a1',
    buyPrice: BigInt('300000000000000000'),        // 0.3 A0GI
    rentPricePerDay: BigInt('30000000000000000'), // 0.03 A0GI/day
    forkPrice: BigInt('50000000000000000'),        // 0.05 A0GI to fork
    royaltyBps: 1000,
  },
  {
    tokenId: '5',
    seller: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    buyPrice: BigInt('2000000000000000000'),       // 2.0 A0GI
    rentPricePerDay: BigInt('0'),
    forkPrice: BigInt('0'),
    royaltyBps: 0,
  },
  {
    tokenId: '6',
    seller: '0x8ba1f109551bD432803012645Hac136c9C8cF0a2',
    buyPrice: BigInt('0'),
    rentPricePerDay: BigInt('10000000000000000'), // 0.01 A0GI/day
    forkPrice: BigInt('80000000000000000'),        // 0.08 A0GI to fork
    royaltyBps: 750,
  },
]

export const MOCK_MEMORY_INFO: Record<string, MemoryInfo> = {
  '1': {
    tokenId: '1',
    contentHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    storageUri: '0g://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
    creator: '0x742d35Cc6634C0532925a3b8D4C9c5e9C8b5F0a1',
    parent: null,
    timestamp: '1746057600',
  },
  '2': {
    tokenId: '2',
    contentHash: '0xa4b8c2d1e5f3901234567890abcdef1234567890abcdef1234567890abcdef12',
    storageUri: '0g://bafkreihdwdcefgh4567890abcdefghijklmnopqrstuvwxyz1234567890ab',
    creator: '0x8ba1f109551bD432803012645Hac136c9C8cF0a2',
    parent: '1',
    timestamp: '1746144000',
  },
  '3': {
    tokenId: '3',
    contentHash: '0xd8e9f0a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcd34',
    storageUri: '0g://bafybeihykbl6senlowl6xpbsq7yhqemlxejfkifnnoitx7stuzclsrb67s',
    creator: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
    parent: null,
    timestamp: '1746230400',
  },
  '4': {
    tokenId: '4',
    contentHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567856',
    storageUri: '0g://bafkreiabcdefghij1234567890klmnopqrstuvwxyzabcdefghijklmnop78',
    creator: '0x742d35Cc6634C0532925a3b8D4C9c5e9C8b5F0a1',
    parent: '1',
    timestamp: '1746316800',
  },
  '5': {
    tokenId: '5',
    contentHash: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8',
    storageUri: '0g://bafybeiemxf5abjwjbikoz4mc3a3dla6ual3jsgpdr4cjr3oz3evfyavhwq',
    creator: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    parent: null,
    timestamp: '1746403200',
  },
  '6': {
    tokenId: '6',
    contentHash: '0x4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3',
    storageUri: '0g://bafkreiabc123def456ghi789jkl012mno345pqr678stu901vwx234yz567',
    creator: '0x8ba1f109551bD432803012645Hac136c9C8cF0a2',
    parent: '3',
    timestamp: '1746489600',
  },
}

export interface MockToken {
  tokenId: string
  contentHash: `0x${string}`
  blockNumber: bigint
}

export const MOCK_TOKENS: MockToken[] = [
  {
    tokenId: '1',
    contentHash: '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    blockNumber: 142853n,
  },
  {
    tokenId: '4',
    contentHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567856',
    blockNumber: 143201n,
  },
]

export const MOCK_LISTING_INFO: Record<string, ListingInfo> = {
  '1': {
    tokenId: '1',
    seller: '0x742d35Cc6634C0532925a3b8D4C9c5e9C8b5F0a1',
    buyPrice: '500000000000000000',
    rentPricePerDay: '50000000000000000',
    forkPrice: '0',
    royaltyBps: 0,
  },
  '2': {
    tokenId: '2',
    seller: '0x8ba1f109551bD432803012645Hac136c9C8cF0a2',
    buyPrice: '1200000000000000000',
    rentPricePerDay: '0',
    forkPrice: '100000000000000000',
    royaltyBps: 500,
  },
  '3': {
    tokenId: '3',
    seller: '0xdD870fA1b7C4700F2BD7f44238821C26f7392148',
    buyPrice: '0',
    rentPricePerDay: '20000000000000000',
    forkPrice: '0',
    royaltyBps: 0,
  },
  '4': {
    tokenId: '4',
    seller: '0x742d35Cc6634C0532925a3b8D4C9c5e9C8b5F0a1',
    buyPrice: '300000000000000000',
    rentPricePerDay: '30000000000000000',
    forkPrice: '50000000000000000',
    royaltyBps: 1000,
  },
  '5': {
    tokenId: '5',
    seller: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    buyPrice: '2000000000000000000',
    rentPricePerDay: '0',
    forkPrice: '0',
    royaltyBps: 0,
  },
  '6': {
    tokenId: '6',
    seller: '0x8ba1f109551bD432803012645Hac136c9C8cF0a2',
    buyPrice: '0',
    rentPricePerDay: '10000000000000000',
    forkPrice: '80000000000000000',
    royaltyBps: 750,
  },
}
