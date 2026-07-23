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
    <div className="relative flex h-full flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center animate-cs-in">
      <div className="cs-starfield pointer-events-none absolute inset-0 opacity-70" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 30%, #05060A 85%)' }}
      />

      <div className="relative">
        <h1
          className="font-display text-5xl font-extrabold uppercase tracking-tight text-cs-text1"
          style={{ textShadow: '0 0 24px rgba(234,240,232,0.25)' }}
        >
          Celo{' '}
          <span
            className="text-cs-accent"
            style={{ textShadow: '0 0 28px rgba(53,208,127,0.65)' }}
          >
            Shooter
          </span>
        </h1>
        <p className="mt-3 text-sm text-cs-text2">
          Drag to fly, tap to fire. Climb the on-chain leaderboard.
        </p>
      </div>

      <div className="relative w-full max-w-xs space-y-3">
        <button onClick={onPlay} className="cs-btn-primary animate-cs-pulse">
          Play
        </button>
        <button onClick={onLeaderboard} className="cs-btn-secondary">
          Leaderboard
        </button>
      </div>

      <div className="relative w-full max-w-xs cs-card px-4 py-3 text-xs">
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
