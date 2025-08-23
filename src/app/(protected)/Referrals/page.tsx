'use client'

import { useContractDataRef } from "@/hooks/use-contract-data-ref"
import { MiniKit } from "@worldcoin/minikit-js"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useMiniKit } from "@/hooks/use-minikit"
import NEX_GOLD_REFERRAL_ABI from "@/abi/NEX_GOLD_REFERRAL_ABI.json"
import { Card, GoldButton, BackButton} from "@/components/ui-components"
import { Loader, CheckCircle, XCircle, Copy } from 'lucide-react'

export default function ReferralsPage() {
    const { contractDataRef, fetchContractDataRef } = useContractDataRef()
    const [referral, setReferral] = useState<string | null>(null)
    const [referral_name, setReferralName] = useState<string | null>(null)
    const [rewardAddress, setRewardAddress] = useState('');
    const { data: session } = useSession()
    const { sendTransaction, status, error } = useMiniKit()
    const [linkStatus, setLinkStatus] = useState<'copy' | 'copied' | 'error'>('copy');
    
    const isProcessing = status === "pending"
    const NEX_GOLD_REFERRAL_ADDRESS = "0x23f3f8c7f97c681f822c80cad2063411573cf8d3"

    useEffect(() => {
        const storedReferral = localStorage.getItem('referrer');
        if (storedReferral) {
            setReferral(storedReferral);
            const fetchUser = async () => {
                const user = await MiniKit.getUserByAddress(storedReferral);
                setReferralName(user?.username || null);
            };
            fetchUser();
        }
    }, []);

    useEffect(() => {
        if (status === "success") { fetchContractDataRef() }
    }, [status, fetchContractDataRef])

    const handleCopyReferralLink = async () => {
        if (!session?.user?.walletAddress) return
        const ref = session.user.walletAddress
        const enlace = `https://world.org/mini-app?app_id=app_48bf75430fa1e83c8063dc451b9decde&path=/invite?ref=${ref}`
        try {
            await navigator.clipboard.writeText(enlace)
            setLinkStatus('copied');
            setTimeout(() => setLinkStatus('copy'), 2000); // Vuelve al estado original después de 2 segundos
        } catch (error) {
            console.error("Error al copiar el enlace de referido:", error)
            setLinkStatus('error');
            setTimeout(() => setLinkStatus('copy'), 2000); // Vuelve al estado original después de 2 segundos
        }
    }

    const handleSendReward = async () => {
        const addressToSend = referral || rewardAddress;
        if (!addressToSend) {
            console.error("No hay una dirección para recompensar.");
            return;
        }
        try {
            await sendTransaction({
                transaction: [{
                    address: NEX_GOLD_REFERRAL_ADDRESS,
                    abi: NEX_GOLD_REFERRAL_ABI as any,
                    functionName: "rewardUser",
                    args: [addressToSend],
                }],
            });
        } catch (error) {
            console.error("Error al enviar recompensa:", error)
        }
    }

    const renderCopyButtonContent = () => {
        switch (linkStatus) {
            case 'copied':
                return (
                    <>
                        <CheckCircle />
                        <span>¡Copiado!</span>
                    </>
                );
            case 'error':
                return (
                    <>
                        <XCircle />
                        <span>Error al copiar</span>
                    </>
                );
            case 'copy':
            default:
                return (
                    <>
                        <Copy />
                        <span>Copiar mi enlace</span>
                    </>
                );
        }
    }

    return (
    <div className="animate-fade-in mx-4 mt-4 mb-60">
        <Card className="space-y-4">
            {contractDataRef.isLoading ? (
                <div className="text-center text-yellow-400"><Loader className="animate-spin inline-block" /> Cargando datos...</div>
            ) : (
                <>
                    <div className="text-center mb-4"><p className="text-sm text-gray-300">Mis Referidos</p><p className="text-3xl font-bold text-yellow-400">{contractDataRef.rewardCount}</p></div>
                    <div className="text-center mb-4"><p className="text-sm text-gray-300">Recompensa por referido</p><p className="text-3xl font-bold text-yellow-400">{contractDataRef.rewardAmount} NXG</p></div>
                    <div className="text-center mb-4"><p className="text-sm text-gray-300">Referido por:</p><p className="text-xl font-bold text-white">{referral_name ? referral_name : "Nadie"}</p></div>
                    {contractDataRef.canReward && !referral && (
                        <div className="flex flex-col space-y-4">
                            <label className="text-gray-300 text-sm">Dirección a recompensar:</label>
                            <input type="text" value={rewardAddress} onChange={(e) => setRewardAddress(e.target.value)} placeholder="0x..." className="p-2 rounded-lg bg-gray-800 text-white border border-yellow-400 focus:outline-none focus:ring-1 focus:ring-yellow-500" />
                        </div>
                    )}
                    <div className="flex flex-col space-y-4 mb-4">
                        {contractDataRef.canReward && (<GoldButton onClick={handleSendReward} className="w-full" disabled={isProcessing || (!referral && !rewardAddress)}>Enviar recompensa</GoldButton>)}
                        <GoldButton onClick={handleCopyReferralLink} className="w-full">
                            {renderCopyButtonContent()}
                        </GoldButton>
                    </div>
                    <div className="text-center"><h2 className="text-2xl font-bold text-yellow-400">TOP 3 Referidos</h2></div>
                    {contractDataRef.isLoading ? (
                        <div className="text-center text-yellow-400"><Loader className="animate-spin inline-block" /> Cargando datos...</div>
                    ) : (
                        <div className="space-y-2">
                            {contractDataRef.top3Addresses.map((address, index) => (
                                <div key={index} className="flex justify-between items-center text-white p-2 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                    <p className="font-bold text-lg">{index + 1}.</p>
                                    <p className="flex-1 text-sm md:text-md lg:text-lg ml-4 truncate">{address}</p>
                                    <p className="font-bold text-yellow-400">{contractDataRef.top3Counts[index]}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
            {status && (
                <div className="min-h-10 text-center text-sm flex items-center justify-center">
                    {status === "pending" && <p className="text-yellow-400 flex items-center gap-2"><Loader className="animate-spin" />Procesando...</p>}
                    {status === "success" && <p className="text-green-400 flex items-center gap-2"><CheckCircle />¡Éxito!</p>}
                    {status === "error" && <p className="text-red-400 flex items-center gap-2"><XCircle />Error: {error}</p>}
                </div>
            )}
        </Card>
    </div>
);
}
