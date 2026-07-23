# Deploying & testing on Alfajores

Step-by-step walkthrough for deploying `ShooterScore.sol` to Celo's Alfajores
testnet and validating the full on-chain-action-logging flow (session key
funding → play → transactions confirmed on-chain). Testnet only — nothing
here should ever touch real funds.

---

## 1. Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed (`forge --version` should work — this repo already vendors `forge-std`, so no `forge install` step is needed)
- A browser wallet you control: [MetaMask](https://metamask.io) (desktop, easiest for testing) or MiniPay (mobile)
- Node 18+ and this repo's dependencies installed (`npm install` from the project root)

---

## 2. Create a deployer wallet

Import a fresh keystore for deploying — keep this separate from any wallet holding real funds. Foundry will prompt you to set a local password for the encrypted keystore file.

```bash
cast wallet import shooter-deployer --interactive
```

Get the address so you can fund it:

```bash
cast wallet address --account shooter-deployer
```

---

## 3. Fund the deployer with test CELO

Test CELO is free. Paste the deployer address from step 2 into the faucet:

**https://faucet.celo.org/alfajores**

Confirm it landed:

```bash
cast balance $(cast wallet address --account shooter-deployer) \
  --rpc-url https://alfajores-forno.celo-testnet.org
```

---

## 4. Deploy `ShooterScore.sol`

```bash
cd contracts
forge create ../src/contracts/ShooterScore.sol:ShooterScore \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  --account shooter-deployer
```

Copy the `Deployed to: 0x...` address from the output — that's your contract address for the next step.

(Optional) Re-run the test suite against the same compiler settings first, if you want a final sanity check before deploying:

```bash
forge test
```

---

## 5. Point the app at the deployed contract

From the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
NEXT_PUBLIC_SHOOTER_SCORE_ADDRESS=0x...   # the address from step 4
```

If you're deploying to Vercel, set the same variable in the project's environment settings so production picks it up too.

---

## 6. Run the app and connect a real wallet

```bash
npm run dev
```

Open **http://localhost:3000** in a browser that has MetaMask installed (or open it in MiniPay on mobile).

1. Add/select **Celo Alfajores Testnet** in your wallet if it isn't already there:
   - Network name: `Celo Alfajores Testnet`
   - RPC URL: `https://alfajores-forno.celo-testnet.org`
   - Chain ID: `44787`
   - Currency symbol: `CELO`
   - Block explorer: `https://alfajores.celoscan.io`
2. Click **"Connect wallet to save scores on-chain"** on the menu and approve the connection.
3. Make sure your wallet has some test CELO too (same faucet as step 3) — you'll need it to fund the session key.

---

## 7. Fund the session key

Once connected on Alfajores, a **"Session key"** card appears on the menu showing a burner address and balance. Click **"Fund session key (0.02 CELO)"** and approve the transaction in your wallet — this is the *only* wallet popup in the whole flow; everything after this is auto-signed by the burner key.

The card should flip to **"Ready — every fire & move this run will be logged on-chain."**

---

## 8. Play and verify

Play a run. Fire a few shots and move around — you'll see a small `N on-chain tx(s)` counter tick up in the top HUD during gameplay.

To verify the transactions actually landed, open the burner address (shown truncated on the menu card) on the block explorer:

```
https://alfajores.celoscan.io/address/<session-key-address>
```

You should see a stream of `logAction` transactions, each emitting an `ActionLogged` event.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Session key card never appears | Wallet not connected, or connected to the wrong network — it only shows once `isConnected && isOnCelo` |
| "Fund session key" transaction fails | Your connected wallet has no test CELO — hit the faucet again |
| TX counter stays at 0 during play | Session key balance dropped below the 0.005 CELO floor (`MIN_FUNDED_BALANCE` in `useSessionKey.ts`) — fund it again from the menu |
| Transactions appear stuck/out of order on the explorer | The session key tracks its own nonce locally and doesn't wait for confirmations between sends; if one transaction fails (e.g., ran out of gas mid-run), later ones with higher nonces will stay pending until it's resolved. Refreshing the page re-fetches the correct nonce from chain. |
| `forge create` fails with "insufficient funds" | The deployer wallet (step 2/3), not the session key, needs the balance for deployment gas |

---

## Tuning the action-logging behavior

All in [`src/components/game/ShooterGame.tsx`](src/components/game/ShooterGame.tsx) and [`src/hooks/useSessionKey.ts`](src/hooks/useSessionKey.ts):

- `MOVE_LOG_COOLDOWN_MS` (ShooterGame.tsx) — minimum gap between logged "move" actions. Lower = more transactions per run.
- `FIRE_COOLDOWN_MS` (ShooterGame.tsx) — already governs fire rate itself, so it also caps how often action `0` (fire) can be logged.
- `MIN_FUNDED_BALANCE` (useSessionKey.ts) — balance floor below which logging silently pauses.
- `DEFAULT_FUND_AMOUNT` (useSessionKey.ts) — how much test CELO the "Fund session key" button sends per click.

---

## Going further: mainnet

Don't. Not with this pattern as-is — a plaintext burner key in localStorage that continuously spends gas is a fine testnet convenience but not something to point at real funds. If you want this on mainnet later, that needs a real security pass (e.g., a properly scoped session-key/account-abstraction setup with spending limits) — worth a separate conversation before attempting it.
