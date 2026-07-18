'use client'

import { useMiniPay } from '@/hooks/useMiniPay'
import { truncateAddress } from '@/lib/format'

interface Props {
  onPlay: () => void
  onLeaderboard: () => void
}

export default function MenuScreen({ onPlay, onLeaderboard }: Props) {
  const { address, isConnected, isConnecting, connectWallet, isOnCelo } = useMiniPay()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6 text-center animate-cs-in">
      <div>
        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-cs-text1">
          Celo <span className="text-cs-accent">Shooter</span>
        </h1>
        <p className="mt-2 text-sm text-cs-text2">
          Drag to fly, tap to fire. Climb the on-chain leaderboard.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <button onClick={onPlay} className="cs-btn-primary">
          Play
        </button>
        <button onClick={onLeaderboard} className="cs-btn-secondary">
          Leaderboard
        </button>
      </div>

      <div className="w-full max-w-xs cs-card px-4 py-3 text-xs">
        {isConnected ? (
          <div className="flex items-center justify-between text-cs-text2">
            <span>{truncateAddress(address)}</span>
            <span className={isOnCelo ? 'text-cs-accent' : 'text-cs-gold'}>
              {isOnCelo ? 'Celo' : 'Wrong network'}
            </span>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="w-full text-cs-text2 underline decoration-dotted"
          >
            {isConnecting ? 'Connecting…' : 'Connect wallet to save scores on-chain'}
          </button>
        )}
      </div>
    </div>
  )
}
