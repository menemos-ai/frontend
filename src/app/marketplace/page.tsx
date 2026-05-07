'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { Skeleton } from '@/components/ui/skeleton'
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts'
import { DEMO_MODE, MOCK_LISTINGS } from '@/lib/mock-data'

interface Listing {
  tokenId: string
  seller: string
  price: bigint
  rentalPricePerDay: bigint
  isForSale: boolean
  isForRent: boolean
  isForFork: boolean
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listing/${listing.tokenId}`}
      className="group block glass-card rounded-2xl p-5 hover:border-violet-500/40 hover:bg-white/[0.08] transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <span className="text-xs font-mono text-white/40">
          #{listing.tokenId}
        </span>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {listing.isForSale && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 font-medium">
              sale
            </span>
          )}
          {listing.isForRent && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium">
              rent
            </span>
          )}
          {listing.isForFork && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 font-medium">
              fork
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {listing.isForSale && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-white/40">Buy</span>
            <span className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
              {formatEther(listing.price)} A0GI
            </span>
          </div>
        )}
        {listing.isForRent && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-white/40">Rent/day</span>
            <span className="text-sm font-medium text-white/80">
              {formatEther(listing.rentalPricePerDay)} A0GI
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-white/10">
        <span className="text-[11px] font-mono text-white/30">
          {truncate(listing.seller)}
        </span>
      </div>
    </Link>
  )
}

function ListingCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-10 bg-white/10" />
        <Skeleton className="h-4 w-16 bg-white/10" />
      </div>
      <Skeleton className="h-4 w-full bg-white/10" />
      <Skeleton className="h-4 w-3/4 bg-white/10" />
      <div className="pt-3 border-t border-white/10">
        <Skeleton className="h-3 w-24 bg-white/10" />
      </div>
    </div>
  )
}

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category')
  const publicClient = usePublicClient()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (!publicClient || !MARKETPLACE_ADDRESS) {
      setLoading(false)
      return
    }

    const marketplaceAddress = MARKETPLACE_ADDRESS
    let cancelled = false

    async function scanListings() {
      try {
        const logs = await publicClient!.getLogs({
          address: marketplaceAddress,
          event: MARKETPLACE_ABI[0],
          fromBlock: 0n,
          toBlock: 'latest',
          strict: true,
        })

        if (cancelled) return

        const seen = new Map<string, Listing>()
        for (const log of logs) {
          const args = log.args
          const tokenId = args.tokenId!.toString()
          seen.set(tokenId, {
            tokenId,
            seller: args.seller!,
            price: args.price!,
            rentalPricePerDay: args.rentalPricePerDay!,
            isForSale: args.isForSale!,
            isForRent: args.isForRent!,
            isForFork: args.isForFork!,
          })
        }

        const onChain = Array.from(seen.values()).reverse()
        const usingMock = onChain.length === 0 && DEMO_MODE
        setListings(usingMock ? MOCK_LISTINGS : onChain)
        setIsDemo(usingMock)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load listings')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    scanListings()
    return () => { cancelled = true }
  }, [publicClient])

  const filtered = category
    ? listings.filter((l) => {
        if (category === 'sale') return l.isForSale
        if (category === 'rent') return l.isForRent
        if (category === 'fork') return l.isForFork
        return true
      })
    : listings

  const categories = ['sale', 'rent', 'fork']

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          {!loading && (
            <p className="text-sm text-white/40 mt-1">
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
              {category ? ` · ${category}` : ''}
            </p>
          )}
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo mode — showing sample data
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/marketplace"
            className={`text-xs px-4 py-1.5 rounded-xl border transition-all duration-200 ${
              !category
                ? 'border-violet-500/50 text-violet-300 bg-violet-500/15'
                : 'glass text-white/50 hover:text-white'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/marketplace?category=${cat}`}
              className={`text-xs px-4 py-1.5 rounded-xl border transition-all duration-200 capitalize ${
                category === cat
                  ? 'border-violet-500/50 text-violet-300 bg-violet-500/15'
                  : 'glass text-white/50 hover:text-white'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="glass-card rounded-2xl border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 glass-card rounded-2xl">
          <p className="text-white/50 text-sm">No listings yet.</p>
          <p className="text-white/30 text-xs mt-1">
            Run the reference agent to mint and list the first memory token.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.tokenId} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  )
}
