import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import Link from 'next/link'
import { Providers } from '@/components/providers'
import { ConnectWallet } from '@/components/connect-wallet'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mnemos — Memory Marketplace',
  description: 'Trade, rent, and fork AI agent memory on-chain.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
          <Providers>
            {/* Fixed background: gradient + orbs */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, #0a0618 0%, #120730 40%, #1a0a3d 70%, #0a0618 100%)' }}
              />
              {/* Orange blob */}
              <div
                className="absolute top-[10%] right-[10%] w-[700px] h-[700px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 65%)', filter: 'blur(80px)' }}
              />
              {/* Pink blob */}
              <div
                className="absolute bottom-[15%] left-[5%] w-[600px] h-[600px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 65%)', filter: 'blur(80px)' }}
              />
              {/* Violet glow center */}
              <div
                className="absolute top-[35%] left-[25%] w-[900px] h-[900px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 65%)', filter: 'blur(100px)' }}
              />
              {/* Small white orb */}
              <div
                className="absolute top-[25%] right-[38%] w-[250px] h-[250px] rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)', filter: 'blur(50px)' }}
              />
            </div>

            <div className="min-h-screen flex flex-col">
              <header className="sticky top-0 z-40 glass border-b border-white/10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="flex h-14 items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Link
                        href="/"
                        className="text-sm font-bold text-white tracking-tight"
                      >
                        mnemos
                      </Link>
                      <nav className="flex items-center gap-4">
                        <Link
                          href="/marketplace"
                          className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                          Marketplace
                        </Link>
                        <Link
                          href="/dashboard"
                          className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                          Dashboard
                        </Link>
                      </nav>
                    </div>
                    <ConnectWallet />
                  </div>
                </div>
              </header>

              <main className="flex-1">{children}</main>

              <footer className="border-t border-white/10 py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <p className="text-xs text-white/30">
                    Mnemos — open protocol for on-chain agent memory.
                  </p>
                </div>
              </footer>
            </div>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
