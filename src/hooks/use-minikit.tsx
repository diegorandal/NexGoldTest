"use client"

import { useState, useEffect, useCallback } from "react"
import { createPublicClient, http } from "viem"
import { worldchain } from "viem/chains"
import { MiniKit } from "@worldcoin/minikit-js"
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react"

const publicClient = createPublicClient({
  chain: worldchain,
  transport: http("https://worldchain-mainnet.g.alchemy.com/public"),
})

export const useMiniKit = () => {
  const [transactionId, setTransactionId] = useState("")
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
    error: txError,
  } = useWaitForTransactionReceipt({
    client: publicClient,
    appConfig: { app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}` },
    transactionId: transactionId,
  })

  useEffect(() => {
    if (!transactionId) return

    if (isConfirming) {
      setStatus("pending")
    } else if (isConfirmed) {
      setStatus("success")
      setTimeout(() => setStatus("idle"), 4000)
    } else if (isTxError) {
      console.error("Transaction failed:", txError)
      setError(txError?.message || "La transacción falló.")
      setStatus("error")
      setTimeout(() => setStatus("idle"), 4000)
    }
  }, [isConfirming, isConfirmed, isTxError, txError, transactionId])

  const sendTransaction = useCallback(async (txConfig: any) => {
    setTransactionId("")
    setStatus("pending")
    setError(null)

    try {
      const { finalPayload } = await MiniKit.commandsAsync.sendTransaction(txConfig)
      if (finalPayload.status === "success") {
        setTransactionId(finalPayload.transaction_id)
      } else {
        setError("La transacción no pudo ser enviada.")
        setStatus("error")
      }
    } catch (err: any) {
      console.error("Error sending transaction:", err)
      setError(err.message || "Error desconocido.")
      setStatus("error")
    }
  }, [])

  return { sendTransaction, status, error }
}