'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount, useSendTransaction } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { celoAlfajores } from 'viem/chains'
import {
  getSessionAccount,
  createSessionWalletClient,
  sessionPublicClient,
} from '@/lib/sessionKey'
import { SHOOTER_SCORE_ABI, SHOOTER_SCORE_ADDRESS } from '@/contracts/abi'

const MIN_FUNDED_BALANCE = parseEther('0.005')
const DEFAULT_FUND_AMOUNT = '0.02'

/**
 * A local burner wallet ("session key") that auto-signs high-frequency
 * per-action transactions (logAction) without a wallet popup per call.
 * Funded once from the player's connected wallet via `fundSession`.
 */
export function useSessionKey() {
  const { isConnected } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()

  const [sessionAddress, setSessionAddress] = useState<`0x${string}` | null>(null)
  const [balance, setBalance] = useState(0n)
  const [txCount, setTxCount] = useState(0)
  const [isFunding, setIsFunding] = useState(false)
  const [fundError, setFundError] = useState<string | null>(null)

  const clientRef = useRef<ReturnType<typeof createSessionWalletClient> | null>(null)
  const nonceRef = useRef<number | null>(null)

  // Create/load the burner account once, client-side only.
  useEffect(() => {
    const account = getSessionAccount()
    setSessionAddress(account.address)
    clientRef.current = createSessionWalletClient()
    sessionPublicClient
      .getTransactionCount({ address: account.address, blockTag: 'pending' })
      .then((n) => {
        nonceRef.current = n
      })
      .catch(() => {
        nonceRef.current = null
      })
  }, [])

  const refreshBalance = useCallback(async () => {
    if (!sessionAddress) return
    try {
      const bal = await sessionPublicClient.getBalance({ address: sessionAddress })
      setBalance(bal)
    } catch {
      // Non-fatal — balance just stays stale until the next refresh.
    }
  }, [sessionAddress])

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  /** Explicit, user-initiated transfer of test CELO from the connected wallet to the burner. */
  const fundSession = useCallback(
    async (amount: string = DEFAULT_FUND_AMOUNT) => {
      if (!sessionAddress) return
      setFundError(null)
      setIsFunding(true)
      try {
        await sendTransactionAsync({
          to: sessionAddress,
          value: parseEther(amount),
          chainId: celoAlfajores.id,
        })
        await refreshBalance()
      } catch (err) {
        setFundError(err instanceof Error ? err.message.split('\n')[0] : 'Funding failed')
      } finally {
        setIsFunding(false)
      }
    },
    [sessionAddress, sendTransactionAsync, refreshBalance]
  )

  /**
   * Fire-and-forget: logs one gameplay action on-chain via the session key.
   * Never awaited by callers — gameplay must not stall on block time.
   * actionType: 0 = fire, 1 = move
   */
  const logAction = useCallback(
    (actionType: number) => {
      const client = clientRef.current
      if (!client || nonceRef.current === null || balance < MIN_FUNDED_BALANCE) return

      const nonce = nonceRef.current
      nonceRef.current += 1

      client
        .writeContract({
          address: SHOOTER_SCORE_ADDRESS,
          abi: SHOOTER_SCORE_ABI,
          functionName: 'logAction',
          args: [actionType],
          nonce,
          chain: celoAlfajores,
        })
        .then(() => setTxCount((c) => c + 1))
        .catch((err) => {
          console.warn('logAction transaction failed', err)
        })
    },
    [balance]
  )

  return {
    sessionAddress,
    balance,
    balanceFormatted: formatEther(balance),
    isFunded: balance >= MIN_FUNDED_BALANCE,
    isFunding,
    fundError,
    txCount,
    fundSession,
    refreshBalance,
    logAction,
    isMainWalletConnected: isConnected,
    contractConfigured: SHOOTER_SCORE_ADDRESS !== '0x0000000000000000000000000000000000000000',
  }
}
