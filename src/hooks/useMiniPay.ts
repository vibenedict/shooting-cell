'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { celo } from 'wagmi/chains'
import { isMiniPay, hasInjectedWallet } from '@/lib/wagmi'

export function useMiniPay() {
  const { address, isConnected, chain } = useAccount()
  const { connect, isPending: isConnecting, error: connectError } = useConnect()
  const { disconnect } = useDisconnect()
  const [miniPayDetected, setMiniPayDetected] = useState(false)
  const [walletAvailable, setWalletAvailable] = useState(false)
  const [connectAttempted, setConnectAttempted] = useState(false)

  useEffect(() => {
    setMiniPayDetected(isMiniPay())
    setWalletAvailable(hasInjectedWallet())
  }, [])

  // Auto-connect in MiniPay — it injects before the page loads
  useEffect(() => {
    if (miniPayDetected && !isConnected && !connectAttempted) {
      setConnectAttempted(true)
      connect({ connector: injected() })
    }
  }, [miniPayDetected, isConnected, connectAttempted, connect])

  const connectWallet = () => {
    if (!walletAvailable) {
      window.open('https://metamask.io/download/', '_blank')
      return
    }
    connect({ connector: injected() })
  }

  const isOnCelo = chain?.id === celo.id

  return {
    address,
    isConnected,
    isConnecting,
    miniPayDetected,
    walletAvailable,
    isOnCelo,
    connectError,
    connectWallet,
    disconnect,
  }
}
