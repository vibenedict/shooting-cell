'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import MenuScreen from '@/components/game/MenuScreen'
import GameOverScreen from '@/components/game/GameOverScreen'
import LeaderboardScreen from '@/components/game/LeaderboardScreen'
import type { GameScreen } from '@/types'

// Canvas game touches window/devicePixelRatio on mount — client-only.
const ShooterGame = dynamic(() => import('@/components/game/ShooterGame'), {
  ssr: false,
})

export default function Home() {
  const [screen, setScreen] = useState<GameScreen>('menu')
  const [lastScore, setLastScore] = useState(0)

  return (
    <main className="flex h-dvh w-full flex-col bg-cs-bg">
      {screen === 'menu' && (
        <MenuScreen
          onPlay={() => setScreen('playing')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'playing' && (
        <ShooterGame
          onGameOver={(score) => {
            setLastScore(score)
            setScreen('gameover')
          }}
        />
      )}

      {screen === 'gameover' && (
        <GameOverScreen
          score={lastScore}
          onPlayAgain={() => setScreen('playing')}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'leaderboard' && (
        <LeaderboardScreen onBack={() => setScreen('menu')} />
      )}
    </main>
  )
}
