'use client'

// A local "session key" (burner wallet) that auto-signs the high-frequency
// per-action transactions (one per fire, one per move gesture) so gameplay
// never needs a wallet popup mid-run. Funded with a small amount of test
// CELO from the player's real wallet, once, at the start of a session.
//
// SECURITY: the private key is generated in-browser and stored in
// localStorage in plaintext. That's an accepted tradeoff for a disposable
// burner key holding trivial testnet funds — never fund this with real
// (mainnet) value, and never reuse it as a real wallet.
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, createPublicClient, http, type Hex } from 'viem'
import { celoAlfajores } from 'viem/chains'

const STORAGE_KEY = 'celo-shooter-session-key'
const RPC_URL = 'https://alfajores-forno.celo-testnet.org'

function loadOrCreateKey(): Hex {
  if (typeof window === 'undefined') {
    throw new Error('session key can only be created in the browser')
  }
  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return existing as Hex
  const key = generatePrivateKey()
  window.localStorage.setItem(STORAGE_KEY, key)
  return key
}

export function getSessionAccount() {
  const key = loadOrCreateKey()
  return privateKeyToAccount(key)
}

export const sessionPublicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(RPC_URL),
})

export function createSessionWalletClient() {
  return createWalletClient({
    account: getSessionAccount(),
    chain: celoAlfajores,
    transport: http(RPC_URL),
  })
}
