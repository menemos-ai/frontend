export const REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`

export const MARKETPLACE_ADDRESS = process.env
  .NEXT_PUBLIC_MARKETPLACE_ADDRESS as `0x${string}`

// Minimal ABI — only functions the UI calls. Keep additive; never remove entries.
export const REGISTRY_ABI = [
  {
    type: 'event',
    name: 'MemoryMinted',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'contentHash', type: 'bytes32', indexed: false },
      { name: 'storageUri', type: 'string', indexed: false },
      { name: 'parentTokenId', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'getMemoryInfo',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'contentHash', type: 'bytes32' },
      { name: 'storageUri', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'parentTokenId', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'isApprovedForAll',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export const MARKETPLACE_ABI = [
  // Listed event — not in SDK minimal ABI, required for getLogs scan
  {
    type: 'event',
    name: 'Listed',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'rentalPricePerDay', type: 'uint256', indexed: false },
      { name: 'isForSale', type: 'bool', indexed: false },
      { name: 'isForRent', type: 'bool', indexed: false },
      { name: 'isForFork', type: 'bool', indexed: false },
      { name: 'forkRoyaltyBps', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'function',
    name: 'getListing',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'price', type: 'uint256' },
      { name: 'rentalPricePerDay', type: 'uint256' },
      { name: 'isForSale', type: 'bool' },
      { name: 'isForRent', type: 'bool' },
      { name: 'isForFork', type: 'bool' },
      { name: 'forkRoyaltyBps', type: 'uint256' },
      { name: 'seller', type: 'address' },
    ],
  },
  {
    type: 'function',
    name: 'list',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'rentalPricePerDay', type: 'uint256' },
      { name: 'isForSale', type: 'bool' },
      { name: 'isForRent', type: 'bool' },
      { name: 'isForFork', type: 'bool' },
      { name: 'forkRoyaltyBps', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'buyMemory',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'rentMemory',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'durationDays', type: 'uint256' },
    ],
    outputs: [],
  },
] as const
