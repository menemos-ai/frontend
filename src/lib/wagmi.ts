import { defineChain } from 'viem'

export const ogTestnet = defineChain({
  id: parseInt(process.env.NEXT_PUBLIC_OG_CHAIN_ID ?? '16600', 10),
  name: '0G Testnet',
  nativeCurrency: { name: '0G Token', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_OG_RPC_URL ?? 'https://evmrpc-testnet.0g.ai'],
    },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
})
