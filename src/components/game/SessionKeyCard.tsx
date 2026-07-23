'use client'

import { useMiniPay } from '@/hooks/useMiniPay'
import { useSessionKey } from '@/hooks/useSessionKey'
import { truncateAddress } from '@/lib/format'

/**
 * Every fire and move you make in-game is logged as its own on-chain
 * transaction. Since wallets can't prompt per-shot, a local "session key"
 * (burner wallet) auto-signs those for you — you just fund it once here.
 */
export default function SessionKeyCard() {
  const { isConnected, isOnCelo } = useMiniPay()
  const {
    sessionAddress,
    balanceFormatted,
    isFunded,
    isFunding,
    fundError,
    fundSession,
    contractConfigured,
  } = useSessionKey()

  if (!contractConfigured || !isConnected || !isOnCelo || !sessionAddress) return null

  return (
    <div className="relative w-full max-w-xs cs-card px-4 py-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-cs-text2">Session key</span>
        <span className="font-mono text-cs-text3">{truncateAddress(sessionAddress)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-cs-text2">Balance</span>
        <span className="font-mono text-cs-text1">{Number(balanceFormatted).toFixed(4)} CELO</span>
      </div>

      {isFunded ? (
        <p className="mt-2 text-cs-accent">
          Ready — every fire &amp; move this run will be logged on-chain.
        </p>
      ) : (
        <>
          <p className="mt-2 text-cs-text3">
            Fund it once (testnet CELO) so every fire &amp; move can be
            logged on-chain without a wallet popup per action.
          </p>
          <button
            onClick={() => fundSession()}
            disabled={isFunding}
            className="mt-2 w-full cs-btn-secondary py-2 text-[11px]"
          >
            {isFunding ? 'Funding…' : 'Fund session key (0.02 CELO)'}
          </button>
          {fundError && <p className="mt-1 text-cs-danger">{fundError}</p>}
        </>
      )}
    </div>
  )
}
