"use client"

import type React from "react"
import { LogOut } from 'lucide-react'
import { signOut, useSession } from "next-auth/react"
import { Marble } from "@worldcoin/mini-apps-ui-kit-react"

export const GoldButton: React.FC<any> = ({ children, className = "", ...props }) => (
  <button
    className={`bg-black border-2 border-yellow-500 text-yellow-500 transition-all duration-300 ease-in-out px-6 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-black hover:shadow-lg hover:shadow-yellow-500/50 disabled:bg-gray-800 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </button>
)

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`bg-black/70 border border-yellow-500/30 rounded-xl p-6 ${className}`}>{children}</div>
)

export const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="mt-6 text-yellow-500 text-center w-full hover:text-yellow-300 transition-colors">
    &larr; Volver al inicio
  </button>
)

export const InputGold: React.FC<any> = (props) => (
  <input
    className="bg-black/50 border border-yellow-500 text-white rounded-lg w-full p-2 text-center focus:ring-2 focus:ring-yellow-400 focus:outline-none"
    {...props}
  />
)

export const UserInfo = () => {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <div className="flex flex-row items-center justify-start gap-1 rounded-lg w-full p-2 text-white bg-black/50 border border-yellow-500/20">
      <Marble src={session.user.profilePictureUrl} className="w-10 h-10" />
      <div className="flex flex-col flex-grow ml-2">
        <span className="text-m font-semibold capitalize text-white">{session.user.username}</span>
        <span className="font-mono text-xs text-gray-400">
          {session.user.walletAddress?.substring(0, 6)}...{session.user.walletAddress?.slice(-4)}
        </span>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        title="Sign Out"
        className="ml-auto p-2 rounded-full hover:bg-gray-700"
      >
        <LogOut className="h-5 w-5 text-gray-400 hover:text-white" />
      </button>
    </div>
  )
}