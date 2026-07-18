'use client'

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { celo } from 'wagmi/chains'
import { SHOOTER_SCORE_ABI, SHOOTER_SCORE_ADDRESS } from '@/contracts/abi'
import type { LeaderboardEntry } from '@/types'

const contract = {
  address: SHOOTER_SCORE_ADDRESS,
  abi: SHOOTER_SCORE_ABI,
} as const

export function useLeaderboard() {
  const { data, isLoading, refetch } = useReadContract({
    ...contract,
    functionName: 'getLeaderboard',
    chainId: celo.id,
    query: { enabled: SHOOTER_SCORE_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  })

  const entries: LeaderboardEntry[] = ((data as readonly { player: `0x${string}`; score: bigint }[]) ?? [])
    .filter((e) => e.player !== '0x0000000000000000000000000000000000000000')
    .map((e) => ({ player: e.player, score: e.score }))

  return { entries, isLoading, refetch }
}

export function useBestScore(address?: `0x${string}`) {
  return useReadContract({
    ...contract,
    functionName: 'bestScore',
    args: address ? [address] : undefined,
    chainId: celo.id,
    query: { enabled: !!address && SHOOTER_SCORE_ADDRESS !== '0x0000000000000000000000000000000000000000' },
  })
}

export function useSubmitScore() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const submitScore = (score: number) => {
    if (!address) return
    writeContract({
      ...contract,
      functionName: 'submitScore',
      args: [BigInt(score)],
      chainId: celo.id,
    })
  }

  return { submitScore, isPending, isConfirming, isSuccess, error, hash }
}
