# Celo Shooter 🚀

A pocket arcade shooter for [MiniPay](https://www.opera.com/products/minipay) (Opera's in-wallet browser on Celo). Drag to fly, tap to fire, dodge falling bullets, and climb an on-chain leaderboard.

Rebuilt from a Python/pygame prototype ([source](https://github.com/coding-arnav66/Arnav-Python-Projects2/tree/9f72e974aeba8c1e73ae81a4fc32a81705de5e63/shooter.py)) as a mobile-first HTML5 Canvas game: mouse-follow becomes touch-drag, the keyboard-fire becomes a tap button.

---

## How it works

1. **Fly** — drag anywhere on the play field to move your ship.
2. **Fire** — tap the Fire button to shoot enemies falling from the top.
3. **Dodge** — random enemy bullets fall too; each hit costs you a point of health. Health hits 0 → run over.
4. **Submit** — if your run beats your personal best, submit it on-chain to the `ShooterScore` leaderboard (gas only, no fee).

---

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Game engine | HTML5 Canvas, `requestAnimationFrame` game loop (no external libs) |
| Wallet / chain | wagmi + viem, targeting Celo & Alfajores, MiniPay injected provider |
| Contract | Solidity `^0.8.20` (`ShooterScore.sol`), compiled/tested with Foundry |

---

## Getting started

**Prerequisites:** Node 18+, npm.

```bash
npm install
npm run dev
```

Open **http://localhost:3000**. The game is playable without a wallet — connecting is only required to submit a score to the on-chain leaderboard.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |
| `npm run type-check` | TypeScript type-check (no emit) |

---

## Smart contract

`ShooterScore.sol` ([`src/contracts/ShooterScore.sol`](src/contracts/ShooterScore.sol)) is a minimal, fee-free leaderboard: `submitScore(uint256)` records a run if it beats the caller's previous best, and keeps a sorted top-10 (`getLeaderboard()`). The frontend ABI in [`src/contracts/abi.ts`](src/contracts/abi.ts) mirrors it.

### Build & test (Foundry)

```bash
cd contracts
forge test              # compiles + runs the ShooterScore test suite
```

`forge-std` is vendored directly under `contracts/lib/forge-std` (not a git submodule), so tests run offline with no `forge install` step.

### Deploy to Alfajores testnet

```bash
cast wallet import shooter-deployer --interactive
# fund the deployer with test CELO: https://faucet.celo.org/alfajores

cd contracts
forge create ../src/contracts/ShooterScore.sol:ShooterScore \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  --account shooter-deployer
```

After deploying, copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SHOOTER_SCORE_ADDRESS=0x...
```

Set the same variable in your Vercel project settings for production. Until it's set, the app runs fine but the leaderboard/submit UI shows a "not configured" state instead of erroring.

> ⚠️ **Unaudited.** Low-risk by design (no funds custodied — just a public high-score board), but not audited. Test on Alfajores before pointing at mainnet.

---

## Project structure

```
src/
├── app/                  # Next.js App Router (layout, page, globals.css)
├── components/
│   └── game/             # ShooterGame (canvas engine), Menu/GameOver/Leaderboard screens
├── hooks/                # useMiniPay (wallet), useShooterScore (contract reads/writes)
├── lib/                  # wagmi config, providers, address formatting
├── contracts/            # ShooterScore.sol + generated ABI
└── types/                # shared TypeScript types
contracts/                # Foundry project (foundry.toml, tests, vendored forge-std)
```

---

## License

ISC
