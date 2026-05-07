import { defineChain } from 'viem'

const chainId = parseInt(process.env.NEXT_PUBLIC_OG_CHAIN_ID ?? '16661', 10)
const isTestnet = chainId === 16600

export const ogChain = defineChain({
  id: chainId,
  name: isTestnet ? '0G Testnet' : '0G Mainnet',
  nativeCurrency: { name: '0G Token', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_OG_RPC_URL ?? 'https://evmrpc.0g.ai'],
    },
  },
  blockExplorers: {
    default: {
      name: '0G Explorer',
      url: isTestnet ? 'https://chainscan-galileo.0g.ai' : 'https://chainscan.0g.ai',
    },
  },
  ...(isTestnet && { testnet: true }),
})

// Keep legacy export name for compatibility
export const ogTestnet = ogChain
