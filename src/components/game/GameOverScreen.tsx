'use client'

import { useEffect } from 'react'
import { useMiniPay } from '@/hooks/useMiniPay'
import { useBestScore, useSubmitScore } from '@/hooks/useShooterScore'
import { SHOOTER_SCORE_ADDRESS } from '@/contracts/abi'
import SpaceBackground from './SpaceBackground'

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
    <div className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden px-6 text-center animate-cs-in">
      <SpaceBackground />

      <div className="relative">
        <p className="text-xs uppercase tracking-widest text-cs-text3">Run over</p>

        <div className="relative mt-1 inline-block">
          {isNewBest && (
            <>
              <span className="absolute inset-0 -z-10 rounded-full bg-cs-gold/40 animate-cs-burst" />
              <span className="absolute inset-0 -z-10 rounded-full bg-cs-gold/30 animate-cs-burst [animation-delay:150ms]" />
            </>
          )}
          <p
            className="font-display text-7xl font-extrabold"
            style={
              isNewBest
                ? { color: '#F5C542', textShadow: '0 0 32px rgba(245,197,66,0.6)' }
                : { color: 'var(--cs-text1)' }
            }
          >
            {score}
          </p>
        </div>

        {isNewBest ? (
          <p className="mt-1 font-display text-lg font-bold uppercase tracking-wide text-cs-gold">
            New personal best!
          </p>
        ) : (
          <p className="mt-1 text-sm text-cs-text2">
            Best: <span className="font-semibold text-cs-text1">{bestScore}</span>
          </p>
        )}
      </div>

      <div className="relative w-full max-w-xs space-y-3">
        {contractConfigured && isConnected && isOnCelo && isNewBest && !isSuccess && (
          <button
            onClick={() => submitScore(score)}
            disabled={isPending || isConfirming}
            className="cs-btn-primary"
            style={{ background: '#F5C542' }}
          >
            {isPending
              ? 'Confirm in wallet…'
              : isConfirming
                ? 'Submitting…'
                : 'Submit to leaderboard'}
          </button>
        )}

        {isSuccess && (
          <div className="cs-card px-4 py-3" style={{ borderColor: 'rgba(245,197,66,0.4)' }}>
            <p className="text-sm font-semibold text-cs-gold">Score submitted on-chain ✓</p>
            <p className="mt-0.5 text-xs text-cs-text3">Your run is live on the leaderboard.</p>
          </div>
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
