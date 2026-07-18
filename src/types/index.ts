export interface LeaderboardEntry {
  player: `0x${string}`
  score: bigint
}

export type GameScreen = 'menu' | 'playing' | 'gameover' | 'leaderboard'
