'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { parseEther } from 'viem'
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
} from '@/lib/contracts'
import { DEMO_MODE, MOCK_TOKENS } from '@/lib/mock-data'
import { ogChain } from '@/lib/wagmi'

interface MintedToken {
  tokenId: string
  contentHash: string
  blockNumber: bigint
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function bytesToHex(bytes: `0x${string}`) {
  return `${bytes.slice(0, 10)}…`
}

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
        await publicClient.waitForTransactionReceipt({ hash: approvalHash, timeout: 120_000, retryCount: 30, retryDelay: 3_000 })
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
      await publicClient.waitForTransactionReceipt({ hash: listHash, timeout: 120_000, retryCount: 30, retryDelay: 3_000 })
      setTxHash(listHash)
      setStatus('Listed successfully!')
      onSuccess()
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
        <div className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-violet-400'}`}>
          <span>{status}</span>
          {txHash && (
            <a
              href={`${ogChain.blockExplorers.default.url}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 underline underline-offset-2 hover:text-violet-300"
            >
              View on Explorer →
            </a>
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
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-white/50">
            #{token.tokenId}
          </span>
          <span className="text-xs font-mono text-white/30">
            {bytesToHex(token.contentHash as `0x${string}`)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-white/30">
            #{token.blockNumber.toString()}
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

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const [tokens, setTokens] = useState<MintedToken[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    if (!isConnected || !address || !publicClient || !REGISTRY_ADDRESS) {
      setLoading(false)
      return
    }

    const registryAddress = REGISTRY_ADDRESS
    let cancelled = false

    async function scanMinted() {
      try {
        const logs = await publicClient!.getLogs({
          address: registryAddress,
          event: MEMORY_MINTED_EVENT,
          fromBlock: 0n,
          toBlock: 'latest',
          args: { creator: address },
          strict: true,
        })

        if (cancelled) return

        const minted = logs.map((log) => ({
          tokenId: log.args.tokenId!.toString(),
          contentHash: log.args.contentHash as string,
          blockNumber: log.blockNumber ?? 0n,
        })).reverse()

        const usingMock = minted.length === 0 && DEMO_MODE
        setTokens(usingMock ? MOCK_TOKENS : minted)
        setIsDemo(usingMock)
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-xs font-mono text-white/30 mt-1">
            {truncate(address!)}
          </p>
          {isDemo && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo mode — showing sample tokens
            </span>
          )}
        </div>
        {!loading && (
          <span className="glass px-4 py-1.5 rounded-xl text-sm text-white/50">
            {tokens.length} token{tokens.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="border-t border-white/10 mb-6" />

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
    </div>
  )
}
