'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts'

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
      className="group block rounded-lg border border-border bg-card p-4 hover:border-violet-500/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-mono text-muted-foreground">
          #{listing.tokenId}
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          {listing.isForSale && (
            <Badge
              variant="outline"
              className="text-[10px] border-violet-500/30 text-violet-400"
            >
              sale
            </Badge>
          )}
          {listing.isForRent && (
            <Badge
              variant="outline"
              className="text-[10px] border-violet-500/30 text-violet-400"
            >
              rent
            </Badge>
          )}
          {listing.isForFork && (
            <Badge
              variant="outline"
              className="text-[10px] border-violet-500/30 text-violet-400"
            >
              fork
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-1">
        {listing.isForSale && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Buy</span>
            <span className="text-sm font-medium text-foreground">
              {formatEther(listing.price)} A0GI
            </span>
          </div>
        )}
        {listing.isForRent && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Rent/day</span>
            <span className="text-sm font-medium text-foreground">
              {formatEther(listing.rentalPricePerDay)} A0GI
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-border">
        <span className="text-[11px] font-mono text-muted-foreground">
          {truncate(listing.seller)}
        </span>
      </div>
    </Link>
  )
}

function ListingCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-3 border-t border-border">
        <Skeleton className="h-3 w-24" />
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

        setListings(Array.from(seen.values()).reverse())
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Marketplace
          </h1>
          {!loading && (
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
              {category ? ` · ${category}` : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/marketplace"
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              !category
                ? 'border-violet-500/50 text-violet-400 bg-violet-500/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/marketplace?category=${cat}`}
              className={`text-xs px-3 py-1.5 rounded-md border transition-colors capitalize ${
                category === cat
                  ? 'border-violet-500/50 text-violet-400 bg-violet-500/10'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground mb-6">
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
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground text-sm">No listings yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
