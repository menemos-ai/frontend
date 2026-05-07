import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // No --turbopack: known init-order bug with wagmi/RainbowKit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any) {
    // Suppress warnings from third-party deps (MetaMask SDK, pino, ox)
    // that reference optional peer dependencies not available in browser
    config.ignoreWarnings = [
      { module: /node_modules\/@metamask\/sdk/ },
      { module: /node_modules\/pino/ },
      { module: /node_modules\/ox/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
    ]
    return config
  },
}

export default nextConfig
