import { createConfig, http } from 'wagmi'
import { celo, celoAlfajores } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

/**
 * Wagmi config supporting both MiniPay (injected window.ethereum) and
 * any standard EIP-1193 browser wallet (MetaMask, Rabby, etc.).
 *
 * MiniPay sets window.ethereum.isMiniPay = true and injects on load.
 */
export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [injected()],
  transports: {
    [celo.id]: http('https://forno.celo.org'),
    [celoAlfajores.id]: http('https://alfajores-forno.celo-testnet.org'),
  },
  ssr: true,
})

/** Returns true when running inside MiniPay */
export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as unknown as { ethereum?: { isMiniPay?: boolean } }).ethereum
      ?.isMiniPay
  )
}

/** Returns true when ANY injected wallet is available */
export function hasInjectedWallet(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean((window as unknown as { ethereum?: unknown }).ethereum)
}
