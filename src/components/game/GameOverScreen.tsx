'use client'

import { useEffect } from 'react'
import { useMiniPay } from '@/hooks/useMiniPay'
import { useBestScore, useSubmitScore } from '@/hooks/useShooterScore'
import { SHOOTER_SCORE_ADDRESS } from '@/contracts/abi'

interface Props {
  score: number
  onPlayAgain: () => void
  onLeaderboard: () => void
}

export default function GameOverScreen({ score, onPlayAgain, onLeaderboard }: Props) {
  const { address, isConnected, connectWallet, isOnCelo } = useMiniPay()
  const { data: best, refetch: refetchBest } = useBestScore(address)
  const { submitScore, isPending, isConfirming, isSuccess, error } = useSubmitScore()

  const contractConfigured = SHOOTER_SCORE_ADDRESS !== '0x0000000000000000000000000000000000000000'
  const bestScore = best ? Number(best) : 0
  const isNewBest = score > bestScore

  useEffect(() => {
    if (isSuccess) refetchBest()
  }, [isSuccess, refetchBest])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center animate-cs-in">
      <div>
        <p className="text-xs uppercase tracking-widest text-cs-text3">Run over</p>
        <p className="mt-1 font-display text-6xl font-extrabold text-cs-text1">{score}</p>
        {isNewBest && (
          <p className="mt-1 text-sm font-semibold text-cs-gold">New personal best!</p>
        )}
      </div>

      <div className="w-full max-w-xs space-y-3">
        {contractConfigured && isConnected && isOnCelo && isNewBest && !isSuccess && (
          <button
            onClick={() => submitScore(score)}
            disabled={isPending || isConfirming}
            className="cs-btn-primary"
          >
            {isPending
              ? 'Confirm in wallet…'
              : isConfirming
                ? 'Submitting…'
                : 'Submit to leaderboard'}
          </button>
        )}

        {isSuccess && (
          <p className="text-xs text-cs-accent">Score submitted on-chain ✓</p>
        )}

        {error && (
          <p className="text-xs text-cs-danger">{error.message.split('\n')[0]}</p>
        )}

        {contractConfigured && !isConnected && (
          <button onClick={connectWallet} className="cs-btn-secondary text-xs">
            Connect wallet to submit score
          </button>
        )}

        {contractConfigured && isConnected && !isOnCelo && (
          <p className="text-xs text-cs-gold">Switch to Celo to submit your score</p>
        )}

        <button onClick={onPlayAgain} className="cs-btn-primary">
          Play again
        </button>
        <button onClick={onLeaderboard} className="cs-btn-secondary">
          Leaderboard
        </button>
      </div>
    </div>
  )
}
