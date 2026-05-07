'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  REGISTRY_ADDRESS,
  REGISTRY_ABI,
} from '@/lib/contracts'
import type { MemoryInfo, ListingInfo } from '@/lib/api'
import { DEMO_MODE, MOCK_MEMORY_INFO, MOCK_LISTING_INFO } from '@/lib/mock-data'

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function ProvenanceRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span
        className={`text-sm text-white/80 break-all ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function BuyPanel({
  listing,
  tokenId,
}: {
  listing: ListingInfo
  tokenId: bigint
}) {
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const [pending, setPending] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  if (!listing.isForSale) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/40 mb-1">Buy</h3>
        <p className="text-xs text-white/30">Not for sale.</p>
      </div>
    )
  }

  if (!MARKETPLACE_ADDRESS) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/40 mb-1">Buy</h3>
        <p className="text-xs text-white/30">Contract not configured.</p>
      </div>
    )
  }

  const marketplaceAddr = MARKETPLACE_ADDRESS
  const price = BigInt(listing.price)

  async function handleBuy() {
    setPending(true)
    try {
      const hash = await writeContractAsync({
        address: marketplaceAddr,
        abi: MARKETPLACE_ABI,
        functionName: 'buyMemory',
        args: [tokenId],
        value: price,
      })
      setTxHash(hash)
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Buy</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-white/40">Price</span>
        <span className="text-2xl font-bold gradient-text">
          {formatEther(price)} A0GI
        </span>
      </div>
      {txHash && (
        <p className="text-xs text-violet-400 font-mono break-all bg-violet-500/10 rounded-lg p-2">
          Tx: {truncate(txHash)}
        </p>
      )}
      <Button
        onClick={handleBuy}
        disabled={pending}
        className="w-full btn-glow text-white rounded-xl h-10"
      >
        {pending ? 'Buying…' : 'Buy Now'}
      </Button>
    </div>
  )
}

function RentPanel({
  listing,
  tokenId,
}: {
  listing: ListingInfo
  tokenId: bigint
}) {
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()
  const [days, setDays] = useState('1')
  const [pending, setPending] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  if (!listing.isForRent) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/40 mb-1">Rent</h3>
        <p className="text-xs text-white/30">Not available for rent.</p>
      </div>
    )
  }

  if (!MARKETPLACE_ADDRESS) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white/40 mb-1">Rent</h3>
        <p className="text-xs text-white/30">Contract not configured.</p>
      </div>
    )
  }

  const marketplaceAddr = MARKETPLACE_ADDRESS
  const ratePerDay = BigInt(listing.rentalPricePerDay)
  const daysNum = Math.max(1, parseInt(days, 10) || 1)
  const total = ratePerDay * BigInt(daysNum)

  async function handleRent() {
    setPending(true)
    try {
      const hash = await writeContractAsync({
        address: marketplaceAddr,
        abi: MARKETPLACE_ABI,
        functionName: 'rentMemory',
        args: [tokenId, BigInt(daysNum)],
        value: total,
      })
      setTxHash(hash)
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Rent</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-white/40">Rate</span>
        <span className="text-sm text-white/80">
          {formatEther(ratePerDay)} A0GI/day
        </span>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rent-days" className="text-xs text-white/40">
          Duration (days)
        </Label>
        <Input
          id="rent-days"
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="h-8 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-violet-500/50"
        />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-white/40">Total</span>
        <span className="text-lg font-bold gradient-text">
          {formatEther(total)} A0GI
        </span>
      </div>
      {txHash && (
        <p className="text-xs text-violet-400 font-mono break-all bg-violet-500/10 rounded-lg p-2">
          Tx: {truncate(txHash)}
        </p>
      )}
      <Button
        onClick={handleRent}
        disabled={pending}
        className="w-full btn-glow text-white rounded-xl h-10"
      >
        {pending ? 'Renting…' : 'Rent Now'}
      </Button>
    </div>
  )
}

function ForkPanel({ listing }: { listing: ListingInfo }) {
  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-semibold ${listing.isForFork ? 'text-white' : 'text-white/40'}`}
        >
          Fork
        </h3>
        {listing.isForFork && (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 font-medium">
            {(listing.forkRoyaltyBps / 100).toFixed(2)}% royalty
          </span>
        )}
      </div>
      {listing.isForFork ? (
        <p className="text-xs text-white/40">
          Forking requires uploading a child memory bundle via the SDK.
        </p>
      ) : (
        <p className="text-xs text-white/30">Not available for fork.</p>
      )}
      <Button
        disabled
        variant="outline"
        className="w-full border-white/15 text-white/30 cursor-not-allowed rounded-xl h-10 bg-transparent hover:bg-transparent"
      >
        Use the SDK to fork this memory
      </Button>
    </div>
  )
}

function ProvenanceSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-20 bg-white/10" />
          <Skeleton className="h-4 w-full bg-white/10" />
        </div>
      ))}
    </div>
  )
}

export function ListingDetail({ id }: { id: string }) {
  const tokenId = BigInt(id)
  const { isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [info, setInfo] = useState<MemoryInfo | null>(null)
  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isDemo = DEMO_MODE && !!MOCK_MEMORY_INFO[id]

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Use mock data when demo mode is on and token is in mock set
      if (DEMO_MODE && MOCK_MEMORY_INFO[id] && MOCK_LISTING_INFO[id]) {
        if (!cancelled) {
          setInfo(MOCK_MEMORY_INFO[id])
          setListing(MOCK_LISTING_INFO[id])
        }
        return
      }

      if (!publicClient || !REGISTRY_ADDRESS || !MARKETPLACE_ADDRESS) {
        throw new Error('Contracts not configured')
      }

      const [memResult, listResult] = await Promise.all([
        publicClient.readContract({
          address: REGISTRY_ADDRESS,
          abi: REGISTRY_ABI,
          functionName: 'getMemoryInfo',
          args: [tokenId],
        }),
        publicClient.readContract({
          address: MARKETPLACE_ADDRESS,
          abi: MARKETPLACE_ABI,
          functionName: 'getListing',
          args: [tokenId],
        }),
      ])

      // viem returns a readonly tuple for multi-output functions — access by index
      const memInfo: MemoryInfo = {
        tokenId: id,
        contentHash: memResult[0],
        storageUri: memResult[1],
        creator: memResult[2],
        parent: memResult[3] === 0n ? null : memResult[3].toString(),
        timestamp: memResult[4].toString(),
      }

      const listInfo: ListingInfo = {
        tokenId: id,
        price: listResult[0].toString(),
        rentalPricePerDay: listResult[1].toString(),
        isForSale: listResult[2],
        isForRent: listResult[3],
        isForFork: listResult[4],
        forkRoyaltyBps: Number(listResult[5]),
        seller: listResult[6],
      }

      if (!cancelled) {
        setInfo(memInfo)
        setListing(listInfo)
      }
    }

    load()
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, publicClient, tokenId])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-xs font-mono text-white/30">Memory Token</p>
          {isDemo && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
              demo
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-white">#{id}</h1>
      </div>

      {error && (
        <div className="glass-card rounded-2xl border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Provenance */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-5">
              Provenance
            </h2>
            <div className="border-t border-white/10 pt-5">
              {loading ? (
                <ProvenanceSkeleton />
              ) : info ? (
                <div className="space-y-5">
                  <ProvenanceRow label="Content Hash" value={info.contentHash} mono />
                  <ProvenanceRow label="Storage URI" value={info.storageUri} mono />
                  <ProvenanceRow label="Creator" value={info.creator} mono />
                  {info.parent && (
                    <ProvenanceRow label="Parent Token" value={info.parent} mono />
                  )}
                  <ProvenanceRow
                    label="Minted"
                    value={new Date(parseInt(info.timestamp) * 1000).toLocaleString()}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
            Actions
          </h2>
          {!isConnected && (
            <p className="text-xs text-white/30 glass rounded-xl px-4 py-3 mb-2">
              Connect your wallet to buy, rent, or fork.
            </p>
          )}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-5">
                  <Skeleton className="h-20 w-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : listing ? (
            <>
              <BuyPanel listing={listing} tokenId={tokenId} />
              <RentPanel listing={listing} tokenId={tokenId} />
              <ForkPanel listing={listing} />
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
