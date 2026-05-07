import { createConfig, http } from 'wagmi'
import { mock } from 'wagmi/connectors'
import { mainnet } from 'wagmi/chains'

export const testWagmiConfig = createConfig({
  chains: [mainnet],
  connectors: [
    mock({
      accounts: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'],
    }),
  ],
  transports: {
    [mainnet.id]: http(),
  },
})
