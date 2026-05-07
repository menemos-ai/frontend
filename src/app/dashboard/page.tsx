'use client'

import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, usePublicClient } from 'wagmi'
import { parseEther } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  REGISTRY_ADDRESS,
  REGISTRY_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
} from '@/lib/contracts'

interface MintedToken {
  tokenId: string
  contentHash: string
  timestamp: bigint
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

  const [price, setPrice] = useState('')
  const [rentalPricePerDay, setRentalPricePerDay] = useState('')
  const [isForSale, setIsForSale] = useState(true)
  const [isForRent, setIsForRent] = useState(false)
  const [isForFork, setIsForFork] = useState(false)
  const [forkRoyaltyBps, setForkRoyaltyBps] = useState(500)
  const [status, setStatus] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleList(e: React.FormEvent) {
    e.preventDefault()
    if (!address || !publicClient || !REGISTRY_ADDRESS || !MARKETPLACE_ADDRESS) return

    const registryAddress = REGISTRY_ADDRESS
    const marketplaceAddress = MARKETPLACE_ADDRESS
    setPending(true)
    setStatus(null)

    try {
      // Approval step: check and request setApprovalForAll before list()
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
        await publicClient.waitForTransactionReceipt({ hash: approvalHash })
      }

      setStatus('Listing…')
      const priceWei = parseEther(price || '0')
      const rentalWei = parseEther(rentalPricePerDay || '0')

      const listHash = await writeContractAsync({
        address: marketplaceAddress,
        abi: MARKETPLACE_ABI,
        functionName: 'list',
        args: [
          BigInt(tokenId),
          priceWei,
          rentalWei,
          isForSale,
          isForRent,
          isForFork,
          BigInt(forkRoyaltyBps),
        ],
      })
      await publicClient.waitForTransactionReceipt({ hash: listHash })
      setStatus('Listed! Reload to see updated status.')
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`price-${tokenId}`} className="text-xs text-muted-foreground">
            Buy price (A0GI)
          </Label>
          <Input
            id={`price-${tokenId}`}
            type="number"
            min="0"
            step="0.001"
            placeholder="0.1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`rental-${tokenId}`} className="text-xs text-muted-foreground">
            Rent/day (A0GI)
          </Label>
          <Input
            id={`rental-${tokenId}`}
            type="number"
            min="0"
            step="0.001"
            placeholder="0.01"
            value={rentalPricePerDay}
            onChange={(e) => setRentalPricePerDay(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Checkbox
            id={`sale-${tokenId}`}
            checked={isForSale}
            onCheckedChange={(v) => setIsForSale(!!v)}
          />
          <Label htmlFor={`sale-${tokenId}`} className="text-xs cursor-pointer">
            For sale
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id={`rent-${tokenId}`}
            checked={isForRent}
            onCheckedChange={(v) => setIsForRent(!!v)}
          />
          <Label htmlFor={`rent-${tokenId}`} className="text-xs cursor-pointer">
            For rent
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Checkbox
            id={`fork-${tokenId}`}
            checked={isForFork}
            onCheckedChange={(v) => setIsForFork(!!v)}
          />
          <Label htmlFor={`fork-${tokenId}`} className="text-xs cursor-pointer">
            For fork
          </Label>
        </div>
      </div>

      {isForFork && (
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Fork royalty</Label>
            <span className="text-xs text-foreground">
              {(forkRoyaltyBps / 100).toFixed(2)}%
            </span>
          </div>
          <Slider
            min={0}
            max={5000}
            step={1}
            value={[forkRoyaltyBps]}
            onValueChange={([v]) => setForkRoyaltyBps(v)}
          />
        </div>
      )}

      {status && (
        <p
          className={`text-xs ${status.startsWith('Error') ? 'text-destructive' : 'text-violet-400'}`}
        >
          {status}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm"
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
    <div className="rounded-lg border border-border bg-card">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-muted-foreground">
            #{token.tokenId}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            {bytesToHex(token.contentHash as `0x${string}`)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(Number(token.timestamp) * 1000).toLocaleDateString()}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] border-violet-500/30 text-violet-400 cursor-pointer"
          >
            {expanded ? 'Close' : 'List'}
          </Badge>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4">
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
          event: REGISTRY_ABI[0],
          fromBlock: 0n,
          toBlock: 'latest',
          args: { creator: address },
          strict: true,
        })

        if (cancelled) return

        const minted = logs.map((log) => ({
          tokenId: log.args.tokenId!.toString(),
          contentHash: log.args.contentHash as string,
          timestamp: log.blockNumber ?? 0n,
        }))

        setTokens(minted.reverse())
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Dashboard
        </h1>
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground text-sm">
            Connect your wallet to view your memory tokens.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            {truncate(address!)}
          </p>
        </div>
        {!loading && (
          <span className="text-sm text-muted-foreground">
            {tokens.length} token{tokens.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <Separator className="mb-6" />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground text-sm">No memory tokens yet.</p>
          <p className="text-muted-foreground text-xs mt-1">
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
