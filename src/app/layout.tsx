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
            <div className="min-h-screen flex flex-col bg-background">
              <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="flex h-14 items-center justify-between">
                    <div className="flex items-center gap-6">
                      <Link
                        href="/"
                        className="text-sm font-semibold text-foreground tracking-tight"
                      >
                        mnemos
                      </Link>
                      <nav className="flex items-center gap-4">
                        <Link
                          href="/marketplace"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Marketplace
                        </Link>
                        <Link
                          href="/dashboard"
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
              <footer className="border-t border-border py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <p className="text-xs text-muted-foreground">
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
