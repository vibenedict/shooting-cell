'use client'

import { useAccount } from 'wagmi'
import { useLeaderboard } from '@/hooks/useShooterScore'
import { truncateAddress } from '@/lib/format'
import { SHOOTER_SCORE_ADDRESS } from '@/contracts/abi'
import SpaceBackground from './SpaceBackground'

interface Props {
  onBack: () => void
}

const RANK_COLOR: Record<number, string> = {
  0: 'var(--cs-gold)',
  1: '#C7CDD6',
  2: '#C9884E',
}

export default function LeaderboardScreen({ onBack }: Props) {
  const { address } = useAccount()
  const { entries, isLoading } = useLeaderboard()
  const contractConfigured = SHOOTER_SCORE_ADDRESS !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="relative flex h-full flex-col gap-4 overflow-hidden px-4 py-6 animate-cs-in">
      <SpaceBackground opacity={0.7} />

      <div className="relative flex items-center justify-between">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-cs-text1">
          Leaderboard
        </h2>
        <button onClick={onBack} className="text-sm text-cs-text2 underline decoration-dotted">
          Back
        </button>
      </div>

      {!contractConfigured && (
        <p className="relative cs-card px-4 py-3 text-xs text-cs-text2">
          Leaderboard contract not configured yet. Set
          NEXT_PUBLIC_SHOOTER_SCORE_ADDRESS once ShooterScore is deployed.
        </p>
      )}

      {contractConfigured && isLoading && (
        <p className="relative text-sm text-cs-text2">Loading…</p>
      )}

      {contractConfigured && !isLoading && entries.length === 0 && (
        <p className="relative cs-card px-4 py-3 text-sm text-cs-text2">
          No scores yet — be the first on the board.
        </p>
      )}

      <div className="relative flex-1 space-y-2 overflow-y-auto">
        {entries.map((entry, i) => {
          const isMe = address && entry.player.toLowerCase() === address.toLowerCase()
          const rankColor = RANK_COLOR[i]
          return (
            <div
              key={entry.player}
              className="cs-card flex items-center justify-between px-4 py-3"
              style={{
                borderColor: isMe ? 'var(--cs-accent)' : rankColor ? `${rankColor}66` : undefined,
                background: rankColor ? `${rankColor}14` : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-5 font-display text-base font-bold"
                  style={{ color: rankColor ?? 'var(--cs-text3)' }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-cs-text1">
                  {truncateAddress(entry.player)}
                  {isMe && <span className="ml-1 text-cs-accent">(you)</span>}
                </span>
              </div>
              <span
                className="font-mono text-sm font-semibold"
                style={{ color: rankColor ?? 'var(--cs-text1)' }}
              >
                {entry.score.toString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
