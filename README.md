# Celo Shooter 🚀

A pocket arcade shooter for [MiniPay](https://www.opera.com/products/minipay) (Opera's in-wallet browser on Celo). Drag or use arrow keys to fly, tap Fire or press Space to shoot, dodge falling bullets, and climb an on-chain leaderboard.

Rebuilt from a Python/pygame prototype ([source](https://github.com/coding-arnav66/Arnav-Python-Projects2/tree/9f72e974aeba8c1e73ae81a4fc32a81705de5e63/shooter.py)) as a mobile-first HTML5 Canvas game: mouse-follow becomes touch-drag, the keyboard-fire becomes a tap button.

---

## How it works

1. **Fly** — drag anywhere, or use arrow keys / WASD, to move your ship.
2. **Fire** — tap the Fire button or press Space/X to shoot enemies falling from the top.
3. **Dodge** — random enemy bullets fall too; each hit costs you a point of health. Health hits 0 → run over.
4. **Submit** — if your run beats your personal best, submit it on-chain to the `ShooterScore` leaderboard (gas only, no fee).

### Every fire and move is an on-chain transaction

Optionally, every shot fired and every discrete move gesture can be logged as its own transaction via `logAction(uint8)` — a cheap, storage-free event emitted on `ShooterScore`. Since no wallet can prompt per-shot, this uses a **session key**: a burner wallet generated and stored in the browser (`src/lib/sessionKey.ts`) that auto-signs those transactions once you fund it with a small amount of test CELO from your real wallet (the "Session key" card on the menu, `SessionKeyCard.tsx`).

- Movement is continuous, so only *discrete* move gestures are logged (a drag start, or a fresh arrow-key press), throttled to at most one every 250ms — not every animation frame.
- Transactions are fire-and-forget: gameplay never waits on a block to confirm, since Celo's ~5s block time is far slower than the game's input rate. The session key tracks its own nonce locally to send sequential transactions without waiting for confirmations.
- This is genuinely gas-per-action, continuously, for as long as you play — **testnet only**. Never fund the session key with real (mainnet) value; it's a plaintext key in localStorage by design, disposable and low-value.
- If the session key isn't funded (or the contract isn't deployed), the game plays exactly the same — action logging just silently no-ops.

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

`ShooterScore.sol` ([`src/contracts/ShooterScore.sol`](src/contracts/ShooterScore.sol)) is a minimal, fee-free leaderboard: `submitScore(uint256)` records a run if it beats the caller's previous best, and keeps a sorted top-10 (`getLeaderboard()`). It also exposes `logAction(uint8 actionType)`, a storage-free event emitter (`ActionLogged`) used for the per-action on-chain logging described above — cheap enough (~15k gas) to call at high frequency. The frontend ABI in [`src/contracts/abi.ts`](src/contracts/abi.ts) mirrors both.

### Build & test (Foundry)

```bash
cd contracts
forge test              # compiles + runs the ShooterScore test suite
```

`forge-std` is vendored directly under `contracts/lib/forge-std` (not a git submodule), so tests run offline with no `forge install` step.

### Deploy to Alfajores testnet

> Full step-by-step (deployer setup, funding, connecting a real wallet, funding the session key, and verifying transactions on the explorer) is in [`DEPLOY_ALFAJORES.md`](DEPLOY_ALFAJORES.md). Quick version:

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
│   └── game/             # ShooterGame (canvas engine), Menu/GameOver/Leaderboard, SessionKeyCard
├── hooks/                # useMiniPay (wallet), useShooterScore, useSessionKey (burner wallet)
├── lib/                  # wagmi config, providers, address formatting, sfx, sessionKey
├── contracts/            # ShooterScore.sol + generated ABI
└── types/                # shared TypeScript types
contracts/                # Foundry project (foundry.toml, tests, vendored forge-std)
```

---

## License

ISC
