'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  REGISTRY_ADDRESS,
  REGISTRY_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  MEMORY_MINTED_EVENT,
  RENTED_EVENT,
  BOUGHT_EVENT,
  FORKED_EVENT,
} from '@/lib/contracts'
import { ogChain } from '@/lib/wagmi'

type Tab = 'tokens' | 'rentals' | 'earnings'

interface MintedToken {
  tokenId: string
  contentHash: string
  blockNumber: bigint
  parentTokenId?: string  // present if this token was created via fork
  forkedByCount: number   // how many times this token has been forked
}

interface Rental {
  tokenId: string
  expiresAt: bigint
  pricePaid: bigint
  txHash: string
}

interface Earning {
  type: 'sale' | 'rent' | 'fork'
  tokenId: string
  amount: bigint
  counterparty: string
  blockNumber: bigint
  txHash: string
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function truncateTx(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`
}

function bytesToHex(bytes: `0x${string}`) {
  return `${bytes.slice(0, 10)}…`
}

function explorerTx(hash: string) {
  return `${ogChain.blockExplorers.default.url}/tx/${hash}`
}

// ─── List Form ───────────────────────────────────────────────────────────────

interface ListFormProps {
  tokenId: string
  onSuccess: () => void
}

function ListForm({ tokenId, onSuccess }: ListFormProps) {
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const publicClient = usePublicClient()

  const [buyPrice, setBuyPrice] = useState('')
  const [rentalPricePerDay, setRentalPricePerDay] = useState('')
  const [forkPrice, setForkPrice] = useState('')
  const [forkRoyaltyBps, setForkRoyaltyBps] = useState(500)
  const [status, setStatus] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleList(e: React.FormEvent) {
    e.preventDefault()
    if (!address || !publicClient || !REGISTRY_ADDRESS || !MARKETPLACE_ADDRESS) return

    const registryAddress = REGISTRY_ADDRESS
    const marketplaceAddress = MARKETPLACE_ADDRESS
    setPending(true)
    setStatus(null)

    try {
      const approved = await publicClient.readContract({
        address: registryAddress,
        abi: REGISTRY_ABI,
        functionName: 'isApprovedForAll',
        args: [address, marketplaceAddress],
      })

      if (!approved) {
        setStatus('Approving marketplace…')
        const approvalHash = await writeContractAsync({
          address: registryAddress,
          abi: REGISTRY_ABI,
          functionName: 'setApprovalForAll',
          args: [marketplaceAddress, true],
        })
        // Approval must confirm before the list tx can succeed
        await publicClient.waitForTransactionReceipt({
          hash: approvalHash,
          timeout: 120_000,
          pollingInterval: 2_000,
        })
      }

      const buyPriceWei = parseEther(buyPrice || '0')
      const rentalWei = parseEther(rentalPricePerDay || '0')
      const forkPriceWei = parseEther(forkPrice || '0')
      const royaltyBpsValue = forkPriceWei > 0n ? BigInt(forkRoyaltyBps) : 0n

      if (buyPriceWei === 0n && rentalWei === 0n && forkPriceWei === 0n) {
        setStatus('Error: Set at least one price greater than 0.')
        setPending(false)
        return
      }

      setStatus('Listing…')

      const listHash = await writeContractAsync({
        address: marketplaceAddress,
        abi: MARKETPLACE_ABI,
        functionName: 'list',
        args: [BigInt(tokenId), buyPriceWei, rentalWei, forkPriceWei, royaltyBpsValue],
      })

      // Show success immediately — don't block on receipt confirmation
      setTxHash(listHash)
      setStatus('Listed successfully!')
      onSuccess()

      // Best-effort: wait for confirmation in the background
      publicClient.waitForTransactionReceipt({
        hash: listHash,
        timeout: 120_000,
        pollingInterval: 2_000,
      }).catch(() => {/* receipt unavailable — tx hash link still visible */})
    } catch (err) {
      setStatus(
        err instanceof Error ? `Error: ${err.message}` : 'Transaction failed',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleList} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`buyprice-${tokenId}`} className="text-xs text-white/50">
            Buy price (A0GI)
          </Label>
          <Input
            id={`buyprice-${tokenId}`}
            type="number"
            min="0"
            step="0.001"
            placeholder="0 = not for sale"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            className="h-8 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-violet-500/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`rental-${tokenId}`} className="text-xs text-white/50">
            Rent/day (A0GI)
          </Label>
          <Input
            id={`rental-${tokenId}`}
            type="number"
            min="0"
            step="0.001"
            placeholder="0 = not for rent"
            value={rentalPricePerDay}
            onChange={(e) => setRentalPricePerDay(e.target.value)}
            className="h-8 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-violet-500/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`forkprice-${tokenId}`} className="text-xs text-white/50">
            Fork price (A0GI)
          </Label>
          <Input
            id={`forkprice-${tokenId}`}
            type="number"
            min="0"
            step="0.001"
            placeholder="0 = not for fork"
            value={forkPrice}
            onChange={(e) => setForkPrice(e.target.value)}
            className="h-8 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus-visible:ring-violet-500/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-xs text-white/50">Fork royalty</Label>
          <span className="text-xs text-white/80">
            {(forkRoyaltyBps / 100).toFixed(2)}%
          </span>
        </div>
        <Slider
          min={0}
          max={5000}
          step={1}
          value={[forkRoyaltyBps]}
          onValueChange={([v]) => setForkRoyaltyBps(v)}
          className="[&_[role=slider]]:bg-violet-500 [&_[role=slider]]:border-violet-400"
        />
      </div>

      {status && (
        <div className={`space-y-1 text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-violet-400'}`}>
          <span>{status}</span>
          {txHash && (
            <div>
              <a
                href={explorerTx(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-violet-300 font-mono"
              >
                {truncateTx(txHash)} ↗
              </a>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full btn-glow text-white text-sm rounded-xl h-9"
      >
        {pending ? status ?? 'Processing…' : 'List on Marketplace'}
      </Button>
    </form>
  )
}

// ─── Token Row ────────────────────────────────────────────────────────────────

function TokenRow({
  token,
  expanded,
  onToggle,
}: {
  token: MintedToken
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-violet-500/30">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/listing/${token.tokenId}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-mono text-white/70 hover:text-white transition-colors shrink-0"
          >
            #{token.tokenId}
          </Link>
          {token.parentTokenId && (
            <Link
              href={`/listing/${token.parentTokenId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] px-2.5 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-300 font-medium hover:bg-pink-500/30 transition-colors shrink-0"
            >
              Fork of #{token.parentTokenId}
            </Link>
          )}
          {token.forkedByCount > 0 && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-white/40 font-medium shrink-0">
              {token.forkedByCount} fork{token.forkedByCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-xs font-mono text-white/30 truncate hidden sm:inline">
            {bytesToHex(token.contentHash as `0x${string}`)}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-white/30 hidden md:inline">
            block #{token.blockNumber.toString()}
          </span>
          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
              expanded
                ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300'
                : 'glass text-white/50 hover:text-white'
            }`}
          >
            {expanded ? 'Close' : 'List'}
          </span>
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-5">
          <ListForm tokenId={token.tokenId} onSuccess={() => {}} />
        </div>
      )}
    </div>
  )
}

// ─── My Rentals Tab ──────────────────────────────────────────────────────────

function MyRentalsTab({ address }: { address: `0x${string}` }) {
  const publicClient = usePublicClient()
  const [rentals, setRentals] = useState<Rental[]>([])
  const [loading, setLoading] = useState(true)

  const now = BigInt(Math.floor(Date.now() / 1000))

  useEffect(() => {
    if (!publicClient || !MARKETPLACE_ADDRESS) {
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      try {
        const logs = await publicClient!.getLogs({
          address: MARKETPLACE_ADDRESS!,
          event: RENTED_EVENT,
          fromBlock: 0n,
          toBlock: 'latest',
          args: { renter: address },
          strict: true,
        })

        if (cancelled) return

        // Keep the latest rental per token (in case of renewal)
        const latestByToken = new Map<string, Rental>()
        for (const log of logs) {
          const tokenId = log.args.tokenId!.toString()
          latestByToken.set(tokenId, {
            tokenId,
            expiresAt: log.args.expiresAt!,
            pricePaid: log.args.price!,
            txHash: log.transactionHash ?? '',
          })
        }

        setRentals(Array.from(latestByToken.values()).reverse())
      } catch {
        // leave empty on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [publicClient, address])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <Skeleton className="h-5 w-full bg-white/10" />
          </div>
        ))}
      </div>
    )
  }

  if (rentals.length === 0) {
    return (
      <div className="text-center py-20 glass-card rounded-2xl">
        <p className="text-white/50 text-sm">No rentals yet.</p>
        <p className="text-white/30 text-xs mt-1">
          Browse the <Link href="/marketplace" className="underline hover:text-white/60">marketplace</Link> to rent a memory token.
        </p>
      </div>
    )
  }

  const active = rentals.filter((r) => r.expiresAt > now)
  const expired = rentals.filter((r) => r.expiresAt <= now)

  function ExpiryBadge({ rental }: { rental: Rental }) {
    const isActive = rental.expiresAt > now
    const expDate = new Date(Number(rental.expiresAt) * 1000)
    const daysLeft = Math.ceil((Number(rental.expiresAt) - Number(now)) / 86400)

    if (isActive) {
      return (
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium">
          Active · {daysLeft}d left
        </span>
      )
    }
    return (
      <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/15 text-white/30 font-medium">
        Expired {expDate.toLocaleDateString()}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">Active</p>
          <div className="space-y-3">
            {active.map((rental) => (
              <div key={rental.tokenId} className="glass-card rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Link href={`/listing/${rental.tokenId}`} className="text-sm font-mono text-white/70 hover:text-white transition-colors">
                    #{rental.tokenId}
                  </Link>
                  <ExpiryBadge rental={rental} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/40">
                    {formatEther(rental.pricePaid)} A0GI paid
                  </span>
                  {rental.txHash && (
                    <a
                      href={explorerTx(rental.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-violet-400/60 hover:text-violet-300 underline underline-offset-2 transition-colors"
                    >
                      {truncateTx(rental.txHash)} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expired.length > 0 && (
        <div>
          <p className="text-xs text-white/30 uppercase tracking-wider font-medium mb-3">Expired</p>
          <div className="space-y-3">
            {expired.map((rental) => (
              <div key={rental.tokenId} className="glass-card rounded-2xl px-5 py-4 flex items-center justify-between gap-4 opacity-60">
                <div className="flex items-center gap-3">
                  <Link href={`/listing/${rental.tokenId}`} className="text-sm font-mono text-white/50 hover:text-white transition-colors">
                    #{rental.tokenId}
                  </Link>
                  <ExpiryBadge rental={rental} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/30">
                    {formatEther(rental.pricePaid)} A0GI paid
                  </span>
                  {rental.txHash && (
                    <a
                      href={explorerTx(rental.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-white/20 hover:text-white/50 underline underline-offset-2 transition-colors"
                    >
                      {truncateTx(rental.txHash)} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Earnings Tab ─────────────────────────────────────────────────────────────

function EarningsTab({ address, tokenIds }: { address: `0x${string}`; tokenIds: Set<string> }) {
  const publicClient = usePublicClient()
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!publicClient || !MARKETPLACE_ADDRESS) {
      setLoading(false)
      return
    }

    let cancelled = false
    async function load() {
      try {
        const mp = MARKETPLACE_ADDRESS!

        // Sales: Bought events where seller = me
        const [boughtLogs, rentedLogs, forkedLogs] = await Promise.all([
          publicClient!.getLogs({
            address: mp,
            event: BOUGHT_EVENT,
            fromBlock: 0n,
            toBlock: 'latest',
            args: { seller: address },
            strict: true,
          }),
          publicClient!.getLogs({
            address: mp,
            event: RENTED_EVENT,
            fromBlock: 0n,
            toBlock: 'latest',
            strict: true,
          }),
          publicClient!.getLogs({
            address: mp,
            event: FORKED_EVENT,
            fromBlock: 0n,
            toBlock: 'latest',
            strict: true,
          }),
        ])

        if (cancelled) return

        const result: Earning[] = []

        for (const log of boughtLogs) {
          result.push({
            type: 'sale',
            tokenId: log.args.tokenId!.toString(),
            amount: log.args.price!,
            counterparty: log.args.buyer!,
            blockNumber: log.blockNumber ?? 0n,
            txHash: log.transactionHash ?? '',
          })
        }

        for (const log of rentedLogs) {
          const tokenId = log.args.tokenId!.toString()
          if (tokenIds.has(tokenId)) {
            result.push({
              type: 'rent',
              tokenId,
              amount: log.args.price!,
              counterparty: log.args.renter!,
              blockNumber: log.blockNumber ?? 0n,
              txHash: log.transactionHash ?? '',
            })
          }
        }

        for (const log of forkedLogs) {
          const parentTokenId = log.args.parentTokenId!.toString()
          if (tokenIds.has(parentTokenId)) {
            result.push({
              type: 'fork',
              tokenId: parentTokenId,
              amount: log.args.price!,
              counterparty: log.args.forker!,
              blockNumber: log.blockNumber ?? 0n,
              txHash: log.transactionHash ?? '',
            })
          }
        }

        result.sort((a, b) => Number(b.blockNumber - a.blockNumber))
        if (!cancelled) setEarnings(result)
      } catch {
        // leave empty on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [publicClient, address, tokenIds])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <Skeleton className="h-4 w-16 bg-white/10 mb-3" />
              <Skeleton className="h-7 w-24 bg-white/10" />
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <Skeleton className="h-5 w-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const totalBySales = earnings.filter(e => e.type === 'sale').reduce((s, e) => s + e.amount, 0n)
  const totalByRent = earnings.filter(e => e.type === 'rent').reduce((s, e) => s + e.amount, 0n)
  const totalByFork = earnings.filter(e => e.type === 'fork').reduce((s, e) => s + e.amount, 0n)
  const grandTotal = totalBySales + totalByRent + totalByFork

  const TYPE_LABELS: Record<Earning['type'], string> = {
    sale: 'Sale',
    rent: 'Rental',
    fork: 'Fork',
  }

  const TYPE_COLORS: Record<Earning['type'], string> = {
    sale: 'bg-violet-500/20 border-violet-500/30 text-violet-300',
    rent: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    fork: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 lg:col-span-1">
          <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-2">Total Earned</p>
          <p className="text-2xl font-bold gradient-text">{formatEther(grandTotal)}</p>
          <p className="text-xs text-white/30 mt-0.5">A0GI</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-[11px] text-violet-400/70 uppercase tracking-wider font-medium mb-2">Sales</p>
          <p className="text-xl font-bold text-white">{formatEther(totalBySales)}</p>
          <p className="text-xs text-white/30 mt-0.5">A0GI · {earnings.filter(e => e.type === 'sale').length} tx</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-[11px] text-purple-400/70 uppercase tracking-wider font-medium mb-2">Rentals</p>
          <p className="text-xl font-bold text-white">{formatEther(totalByRent)}</p>
          <p className="text-xs text-white/30 mt-0.5">A0GI · {earnings.filter(e => e.type === 'rent').length} tx</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-[11px] text-pink-400/70 uppercase tracking-wider font-medium mb-2">Forks</p>
          <p className="text-xl font-bold text-white">{formatEther(totalByFork)}</p>
          <p className="text-xs text-white/30 mt-0.5">A0GI · {earnings.filter(e => e.type === 'fork').length} tx</p>
        </div>
      </div>

      {/* Transaction history */}
      {earnings.length === 0 ? (
        <div className="text-center py-16 glass-card rounded-2xl">
          <p className="text-white/50 text-sm">No earnings yet.</p>
          <p className="text-white/30 text-xs mt-1">
            List your tokens on the <Link href="/marketplace" className="underline hover:text-white/60">marketplace</Link> to start earning.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">Transaction History</p>
          <div className="space-y-2">
            {earnings.map((e, idx) => (
              <div key={idx} className="glass-card rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${TYPE_COLORS[e.type]}`}>
                    {TYPE_LABELS[e.type]}
                  </span>
                  <span className="text-xs font-mono text-white/50">
                    Token #{e.tokenId}
                  </span>
                  <span className="text-xs text-white/30 font-mono hidden sm:inline">
                    from {truncate(e.counterparty)}
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold text-white">
                    +{formatEther(e.amount)} A0GI
                  </span>
                  {e.txHash && (
                    <a
                      href={explorerTx(e.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-violet-400/60 hover:text-violet-300 underline underline-offset-2 transition-colors"
                    >
                      {truncateTx(e.txHash)} ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [tokens, setTokens] = useState<MintedToken[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('tokens')

  useEffect(() => {
    if (!isConnected || !address || !publicClient || !REGISTRY_ADDRESS) {
      setLoading(false)
      return
    }

    const registryAddress = REGISTRY_ADDRESS
    let cancelled = false

    async function scanMinted() {
      try {
        const [mintedLogs, forkedLogs] = await Promise.all([
          publicClient!.getLogs({
            address: registryAddress,
            event: MEMORY_MINTED_EVENT,
            fromBlock: 0n,
            toBlock: 'latest',
            args: { creator: address },
            strict: true,
          }),
          MARKETPLACE_ADDRESS
            ? publicClient!.getLogs({
                address: MARKETPLACE_ADDRESS,
                event: FORKED_EVENT,
                fromBlock: 0n,
                toBlock: 'latest',
                strict: true,
              })
            : Promise.resolve([]),
        ])

        if (cancelled) return

        // child token id → parent token id
        const childToParent = new Map<string, string>()
        // parent token id → number of children forked from it
        const forkCounts = new Map<string, number>()
        for (const log of forkedLogs) {
          const childId = log.args.childTokenId!.toString()
          const parentId = log.args.parentTokenId!.toString()
          childToParent.set(childId, parentId)
          forkCounts.set(parentId, (forkCounts.get(parentId) ?? 0) + 1)
        }

        const minted = mintedLogs.map((log) => {
          const tokenId = log.args.tokenId!.toString()
          return {
            tokenId,
            contentHash: log.args.contentHash as string,
            blockNumber: log.blockNumber ?? 0n,
            parentTokenId: childToParent.get(tokenId),
            forkedByCount: forkCounts.get(tokenId) ?? 0,
          }
        }).reverse()

        setTokens(minted)
      } catch {
        // silently show empty on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    scanMinted()
    return () => { cancelled = true }
  }, [isConnected, address, publicClient])

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-white mb-4">Dashboard</h1>
        <div className="text-center py-24 glass-card rounded-2xl">
          <p className="text-white/50 text-sm">
            Connect your wallet to view your memory tokens.
          </p>
        </div>
      </div>
    )
  }

  const tokenIdSet = new Set(tokens.map((t) => t.tokenId))

  const TABS: { id: Tab; label: string }[] = [
    { id: 'tokens', label: `My Tokens${tokens.length > 0 ? ` (${tokens.length})` : ''}` },
    { id: 'rentals', label: 'My Rentals' },
    { id: 'earnings', label: 'Earnings' },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-xs font-mono text-white/30 mt-1">
            {truncate(address!)}
          </p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-8 border-b border-white/10 pb-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`text-sm px-5 py-3 font-medium transition-all duration-200 border-b-2 -mb-px ${
              tab === id
                ? 'border-violet-500 text-white'
                : 'border-transparent text-white/40 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'tokens' && (
        <>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-5">
                  <Skeleton className="h-5 w-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-24 glass-card rounded-2xl">
              <p className="text-white/50 text-sm">No memory tokens yet.</p>
              <p className="text-white/30 text-xs mt-1">
                Run the reference agent to mint your first snapshot.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {tokens.map((token) => (
                <TokenRow
                  key={token.tokenId}
                  token={token}
                  expanded={expandedId === token.tokenId}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === token.tokenId ? null : token.tokenId,
                    )
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'rentals' && address && (
        <MyRentalsTab address={address} />
      )}

      {tab === 'earnings' && address && (
        <EarningsTab address={address} tokenIds={tokenIdSet} />
      )}
    </div>
  )
}
