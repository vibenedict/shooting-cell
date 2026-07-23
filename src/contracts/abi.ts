export const SHOOTER_SCORE_ABI = [
  // Views
  {
    name: 'bestScore',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getLeaderboard',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        type: 'tuple[10]',
        components: [
          { name: 'player', type: 'address' },
          { name: 'score', type: 'uint256' },
        ],
      },
    ],
  },
  {
    name: 'MAX_ENTRIES',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Writes
  {
    name: 'submitScore',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'score', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'logAction',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'actionType', type: 'uint8' }],
    outputs: [],
  },
  // Events
  {
    name: 'ScoreSubmitted',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'score', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'ActionLogged',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'actionType', type: 'uint8', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const

/**
 * Deployed ShooterScore contract address, read from env (gitignored
 * .env.local locally, Vercel project env in production). Public on-chain
 * regardless; env just keeps it out of the repo / lets it differ per network.
 */
const ZERO = '0x0000000000000000000000000000000000000000' as const

const envAddr = (v: string | undefined): `0x${string}` =>
  v && /^0x[0-9a-fA-F]{40}$/.test(v) ? (v as `0x${string}`) : ZERO

export const SHOOTER_SCORE_ADDRESS = envAddr(
  process.env.NEXT_PUBLIC_SHOOTER_SCORE_ADDRESS
)
