import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { defineChain } from 'viem'
import { cookieStorage, createStorage } from 'wagmi'

const ogChainId = parseInt(process.env.NEXT_PUBLIC_OG_CHAIN_ID ?? '16600', 10)
const ogRpcUrl = process.env.NEXT_PUBLIC_OG_RPC_URL ?? 'https://evmrpc-testnet.0g.ai'

export const ogTestnet = defineChain({
  id: ogChainId,
  name: '0G Testnet',
  nativeCurrency: { name: '0G Token', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: [ogRpcUrl] },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan-galileo.0g.ai' },
  },
  testnet: true,
})

export const wagmiConfig = getDefaultConfig({
  appName: 'Mnemos Marketplace',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? 'mnemos-dev',
  chains: [ogTestnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
})
