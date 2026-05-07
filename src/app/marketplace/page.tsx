'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { Skeleton } from '@/components/ui/skeleton'
import { MARKETPLACE_ADDRESS, LISTED_EVENT } from '@/lib/contracts'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

interface StrategyMeta {
  strategy?: string
  category?: string
  assets?: string[]
  performance30d?: string
  tags?: string[]
  agentId?: string
  version?: string
}

interface Listing {
  tokenId: string
  seller: string
  buyPrice: bigint
  rentPricePerDay: bigint
  forkPrice: bigint
  royaltyBps: number
  meta?: StrategyMeta
}

async function fetchStrategyMeta(tokenId: string): Promise<StrategyMeta | null> {
  try {
    const res = await fetch(`${API_URL}/marketplace/listings/${tokenId}`, {
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const json = await res.json()
    // Try to extract strategy metadata from various possible response shapes
    const data = json.data ?? json
    const metadata = json.metadata ?? json.meta ?? {}
    return {
      strategy: data.strategy ?? metadata.strategy ?? null,
      category: data.category ?? metadata.category ?? null,
      assets: data.assets ?? metadata.assets ?? null,
      performance30d: data.performance30d ?? metadata.performance30d ?? null,
      tags: data.tags ?? metadata.tags ?? null,
      agentId: data.agentId ?? metadata.agentId ?? null,
      version: data.version ?? metadata.version ?? null,
    }
  } catch {
    return null
  }
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const CATEGORY_COLORS: Record<string, string> = {
  trading: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
  yield: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
  analytics: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  nft: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
}

function PerfBadge({ value }: { value: string }) {
  const isPos = value.startsWith('+')
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
      isPos
        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
        : 'bg-red-500/15 border-red-500/30 text-red-400'
    }`}>
      {value} 30d
    </span>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const { meta } = listing
  const catColor = meta?.category
    ? (CATEGORY_COLORS[meta.category] ?? 'bg-white/10 border-white/20 text-white/50')
    : ''

  return (
    <Link
      href={`/listing/${listing.tokenId}`}
      className="group block glass-card rounded-2xl p-5 hover:border-violet-500/40 hover:bg-white/[0.08] transition-all duration-300 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-mono text-white/30">#{listing.tokenId}</span>
        <div className="flex gap-1 flex-wrap justify-end">
          {meta?.category && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize ${catColor}`}>
              {meta.category}
            </span>
          )}
          {listing.buyPrice > 0n && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 font-medium">
              sale
            </span>
          )}
          {listing.rentPricePerDay > 0n && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium">
              rent
            </span>
          )}
          {listing.forkPrice > 0n && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 font-medium">
              fork
            </span>
          )}
        </div>
      </div>

      {/* Strategy title */}
      <div>
        <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-violet-200 transition-colors line-clamp-2">
          {meta?.strategy ?? `Memory Token #${listing.tokenId}`}
        </h3>
        {meta?.agentId && (
          <p className="text-[10px] text-white/30 mt-0.5 font-mono">
            {meta.agentId}{meta.version ? ` · v${meta.version}` : ''}
          </p>
        )}
      </div>

      {/* Assets + performance */}
      {(meta?.assets?.length || meta?.performance30d) && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1 flex-wrap">
            {meta.assets?.map((a) => (
              <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/50 font-mono">
                {a}
              </span>
            ))}
          </div>
          {meta.performance30d && <PerfBadge value={meta.performance30d} />}
        </div>
      )}

      {/* Prices */}
      <div className="space-y-1">
        {listing.buyPrice > 0n && (
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-white/40">Buy</span>
            <span className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
              {formatEther(listing.buyPrice)} A0GI
            </span>
          </div>
        )}
        {listing.rentPricePerDay > 0n && (
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-white/40">Rent/day</span>
            <span className="text-sm font-medium text-white/70">
              {formatEther(listing.rentPricePerDay)} A0GI
            </span>
          </div>
        )}
        {listing.forkPrice > 0n && (
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-white/40">Fork</span>
            <span className="text-sm font-medium text-white/70">
              {formatEther(listing.forkPrice)} A0GI
            </span>
          </div>
        )}
      </div>

      {/* Tags + seller */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="flex gap-1 flex-wrap">
          {meta?.tags?.slice(0, 2).map((t) => (
            <span key={t} className="text-[9px] text-white/20 font-mono">#{t}</span>
          ))}
        </div>
        <span className="text-[10px] font-mono text-white/25 shrink-0">
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
        <Skeleton className="h-3 w-8 bg-white/10" />
        <Skeleton className="h-4 w-20 bg-white/10" />
      </div>
      <Skeleton className="h-4 w-full bg-white/10" />
      <Skeleton className="h-3 w-3/4 bg-white/10" />
      <div className="flex gap-1">
        <Skeleton className="h-5 w-10 bg-white/10" />
        <Skeleton className="h-5 w-12 bg-white/10" />
      </div>
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full bg-white/10" />
        <Skeleton className="h-3 w-3/4 bg-white/10" />
      </div>
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
          event: LISTED_EVENT,
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
            buyPrice: args.buyPrice!,
            rentPricePerDay: args.rentPricePerDay!,
            forkPrice: args.forkPrice!,
            royaltyBps: Number(args.royaltyBps!),
          })
        }

        const onChain = Array.from(seen.values()).reverse()
        if (!cancelled) setListings(onChain)

        // Fetch strategy metadata from API in background for each listing
        const metaResults = await Promise.allSettled(
          onChain.map((l) => fetchStrategyMeta(l.tokenId)),
        )
        if (!cancelled) {
          setListings(onChain.map((l, i) => {
            const result = metaResults[i]
            const meta = result.status === 'fulfilled' ? result.value ?? undefined : undefined
            return { ...l, meta }
          }))
        }
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
        if (category === 'sale') return l.buyPrice > 0n
        if (category === 'rent') return l.rentPricePerDay > 0n
        if (category === 'fork') return l.forkPrice > 0n
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
