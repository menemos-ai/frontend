'use client'

import { useEffect, useState, use } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from '@/lib/contracts'
import {
  fetchMemoryInfo,
  fetchListingInfo,
  type MemoryInfo,
  type ListingInfo,
} from '@/lib/api'

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
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-sm text-foreground break-all ${mono ? 'font-mono' : ''}`}
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
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Buy</h3>
        <p className="text-xs text-muted-foreground">Not for sale.</p>
      </div>
    )
  }

  const price = BigInt(listing.price)

  async function handleBuy() {
    setPending(true)
    try {
      const hash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
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
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Buy</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Price</span>
        <span className="text-lg font-semibold text-foreground">
          {formatEther(price)} A0GI
        </span>
      </div>
      {txHash && (
        <p className="text-xs text-violet-400 font-mono break-all">
          Tx: {truncate(txHash)}
        </p>
      )}
      <Button
        onClick={handleBuy}
        disabled={pending}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white"
      >
        {pending ? 'Buying…' : 'Buy'}
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
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          Rent
        </h3>
        <p className="text-xs text-muted-foreground">Not available for rent.</p>
      </div>
    )
  }

  const ratePerDay = BigInt(listing.rentalPricePerDay)
  const daysNum = Math.max(1, parseInt(days, 10) || 1)
  const total = ratePerDay * BigInt(daysNum)

  async function handleRent() {
    setPending(true)
    try {
      const hash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
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
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <h3 className="text-sm font-medium text-foreground">Rent</h3>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Rate</span>
        <span className="text-sm text-foreground">
          {formatEther(ratePerDay)} A0GI/day
        </span>
      </div>
      <div className="space-y-1">
        <Label htmlFor="rent-days" className="text-xs text-muted-foreground">
          Duration (days)
        </Label>
        <Input
          id="rent-days"
          type="number"
          min="1"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-sm font-semibold text-foreground">
          {formatEther(total)} A0GI
        </span>
      </div>
      {txHash && (
        <p className="text-xs text-violet-400 font-mono break-all">
          Tx: {truncate(txHash)}
        </p>
      )}
      <Button
        onClick={handleRent}
        disabled={pending}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white"
      >
        {pending ? 'Renting…' : 'Rent'}
      </Button>
    </div>
  )
}

function ForkPanel({ listing }: { listing: ListingInfo }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className={`text-sm font-medium ${listing.isForFork ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          Fork
        </h3>
        {listing.isForFork && (
          <Badge
            variant="outline"
            className="text-[10px] border-violet-500/30 text-violet-400"
          >
            {(listing.forkRoyaltyBps / 100).toFixed(2)}% royalty
          </Badge>
        )}
      </div>
      {listing.isForFork ? (
        <p className="text-xs text-muted-foreground">
          Forking requires uploading a child memory bundle via the SDK.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Not available for fork.</p>
      )}
      <Button
        disabled
        variant="outline"
        className="w-full text-muted-foreground cursor-not-allowed"
      >
        Use the SDK to fork this memory
      </Button>
    </div>
  )
}

function ProvenanceSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  )
}

export function ListingDetail({ id }: { id: string }) {
  const tokenId = BigInt(id)

  const { isConnected } = useAccount()
  const [info, setInfo] = useState<MemoryInfo | null>(null)
  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [memInfo, listInfo] = await Promise.all([
          fetchMemoryInfo(id),
          fetchListingInfo(id),
        ])
        if (!cancelled) {
          setInfo(memInfo)
          setListing(listInfo)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Memory #{id}
          </h1>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive-foreground mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: provenance */}
        <div className="lg:col-span-3 space-y-5">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Provenance
          </h2>
          <Separator />
          {loading ? (
            <ProvenanceSkeleton />
          ) : info ? (
            <div className="space-y-4">
              <ProvenanceRow
                label="Content Hash"
                value={info.contentHash}
                mono
              />
              <ProvenanceRow
                label="Storage URI"
                value={info.storageUri}
                mono
              />
              <ProvenanceRow
                label="Creator"
                value={info.creator}
                mono
              />
              {info.parent && (
                <ProvenanceRow
                  label="Parent Token"
                  value={info.parent}
                  mono
                />
              )}
              <ProvenanceRow
                label="Minted"
                value={new Date(
                  parseInt(info.timestamp) * 1000,
                ).toLocaleString()}
              />
            </div>
          ) : null}
        </div>

        {/* Right: action panels */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Actions
          </h2>
          <Separator />
          {!isConnected && (
            <p className="text-xs text-muted-foreground py-2">
              Connect your wallet to buy, rent, or fork.
            </p>
          )}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
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

export default function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <ListingDetail id={id} />
}
