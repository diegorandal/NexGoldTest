'use client';

import React, { useState, useEffect, FC, useCallback } from 'react';
import { Abi, createPublicClient, http, parseEther, formatEther } from 'viem';
import { worldchain } from 'viem/chains';
import { MiniKit } from '@worldcoin/minikit-js';
import { useWaitForTransactionReceipt } from '@worldcoin/minikit-react';
import { Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut, Info, Loader, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NEX_GOLD_STAKING_ABI from '@/abi/NEX_GOLD_STAKING_ABI.json'; 

const NEX_GOLD_STAKING_ADDRESS = '0x3c8acbee00a0304842a48293b6c1da63e3c6bc41';

//const NEX_GOLD_STAKING_ABI = NEX_GOLD_STAKING_ABI_JSON as Abi;

console.log(NEX_GOLD_STAKING_ABI);

const publicClient = createPublicClient({
    chain: worldchain,
    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
});

const useMiniKit = () => {
    const [transactionId, setTransactionId] = useState('');
    const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        isError: isTxError,
        error: txError,
    } = useWaitForTransactionReceipt({
        client: publicClient,
        appConfig: { app_id: process.env.NEXT_PUBLIC_APP_ID as `app_${string}` },
        transactionId: transactionId,
    });

    useEffect(() => {


        if (!transactionId) {
            console.log("Transaction ID no disponible, adios");
            return;
        }

        console.log("Transaction ID:", transactionId);

        if (isConfirming) {
            setStatus('pending');
        } else if (isConfirmed) {
            setStatus('success');
            setTimeout(() => setStatus('idle'), 4000);
        } else if (isTxError) {
            console.error('Transaction failed:', txError);
            setError(txError?.message || 'La transacción falló.');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 4000);
        }
    }, [isConfirming, isConfirmed, isTxError, txError, transactionId]);

    const sendTransaction = useCallback(async (txConfig: any) => {
        setTransactionId('');
        setStatus('pending');
        setError(null);

        try {
            const { finalPayload } = await MiniKit.commandsAsync.sendTransaction(txConfig);
            if (finalPayload.status === 'success') {
                console.log('Transaction sent successfully:', finalPayload);
                setTransactionId(finalPayload.transaction_id);
            } else {
                console.error('Submission failed:', finalPayload);
                setError('La transacción no pudo ser enviada.');
                setStatus('error');
            }
        } catch (err: any) {
            console.error('Error sending transaction:', err);
            setError(err.message || 'Error desconocido.');
            setStatus('error');
        }
    }, []);

    return { sendTransaction, status, error };
};
const GoldButton: FC<any> = ({ children, className = '', ...props }) => (
    <button className={`bg-black border-2 border-yellow-500 text-yellow-500 transition-all duration-300 ease-in-out px-6 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-500 hover:text-black hover:shadow-lg hover:shadow-yellow-500/50 disabled:bg-gray-800 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed ${className}`} {...props}>
        {children}
    </button>
);
const Card: FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-black/70 border border-yellow-500/30 rounded-xl p-6 ${className}`}>{children}</div>
);
const BackButton: FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="mt-6 text-yellow-500 text-center w-full hover:text-yellow-300 transition-colors">&larr; Volver al inicio</button>
);
const InputGold: FC<any> = (props) => (
    <input className="bg-black/50 border border-yellow-500 text-white rounded-lg w-full p-2 text-center focus:ring-2 focus:ring-yellow-400 focus:outline-none" {...props} />
);

const StakingAndMiningSection: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [amount, setAmount] = useState('');
    const { sendTransaction, status, error } = useMiniKit();
    const { data: session } = useSession();

    const [contractData, setContractData] = useState({
        stakedBalance: '1.0',
        stakingRewards: '1.0',
        miningRewards: '1.0',
        lockinEndDate: null as Date | null,
        isLoading: true,
    });

    const fetchContractData = useCallback(async () => {
        if (!session?.user?.walletAddress) return;
        setContractData(prev => ({ ...prev, isLoading: true }));
        try {
            
            const [staker, stakingRewards, miningRewards] = await Promise.all([
                publicClient.readContract({ address: NEX_GOLD_STAKING_ADDRESS, abi: NEX_GOLD_STAKING_ABI, functionName: 'stakers', args: [session.user.walletAddress],}) as unknown as [bigint, bigint, bigint, bigint],
                publicClient.readContract({ address: NEX_GOLD_STAKING_ADDRESS, abi: NEX_GOLD_STAKING_ABI, functionName: 'calculateStakingRewards', args: [session.user.walletAddress] }) as unknown as bigint,
                publicClient.readContract({ address: NEX_GOLD_STAKING_ADDRESS, abi: NEX_GOLD_STAKING_ABI, functionName: 'calculateMiningRewards', args: [session.user.walletAddress] }) as unknown as bigint,
            ]);
            setContractData({
                stakedBalance: formatEther(staker[0]),
                lockinEndDate: staker[1] > 0 ? new Date(Number(staker[1]) * 1000) : null,
                stakingRewards: formatEther(stakingRewards),
                miningRewards: formatEther(miningRewards),
                isLoading: false,
            });
        } catch (e) {
            console.error("Error fetching contract data:", e);
            setContractData(prev => ({ ...prev, isLoading: false }));
        }
    }, [session?.user?.walletAddress]);

    useEffect(() => {
        fetchContractData();
        console.log("Contract data en useEffect: ", contractData);
    }, [fetchContractData]);

    useEffect(() => {
        if (status === 'success') {
            fetchContractData();
            console.log("Contract data en useEffect (success): ", contractData);
        }
    }, [status, fetchContractData]);

    const handleStake = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;
        
        const worldIdProof = { root: 0, nullifierHash: 0, proof: [0,0,0,0,0,0,0,0] };
        const permit2Data = { permit: {}, signature: {} };

        await sendTransaction({
            transaction: [{
                to: NEX_GOLD_STAKING_ADDRESS,
                abi: NEX_GOLD_STAKING_ABI as any,
                functionName: 'stake',
                args: [parseEther(amount), worldIdProof.root, worldIdProof.nullifierHash, worldIdProof.proof, permit2Data.permit, permit2Data.signature],
            }]
        });
    };

    const handleUnstake = async () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;
        await sendTransaction({
            transaction: [{
                to: NEX_GOLD_STAKING_ADDRESS,
                abi: NEX_GOLD_STAKING_ABI as any,
                functionName: 'unstake',
                args: [parseEther(amount)],
            }]
        });
    };
    
    const handleClaim = async () => {
        await sendTransaction({
            transaction: [{
                to: NEX_GOLD_STAKING_ADDRESS,
                abi: NEX_GOLD_STAKING_ABI as any,
                functionName: 'claimAllRewards',
                args: [],
            }]
        });
    };

    useEffect(() => {
        
        const { data: session } = useSession();

        console.log("Debug llamada al contrato a la antigüita");
        let isMounted = true;

        async function fetchPrueba() {
            
            if (!session?.user?.walletAddress){
                console.log("Debug lacala walletAddress no disponible");
                return;
            } else {
                console.log("Debug lacala walletAddress:", session.user.walletAddress);
            }

            try{
            
                const user = await MiniKit.getUserByUsername(session.user.username);
                const walletAddress = user.walletAddress;
                if (!walletAddress) { return;}
                const client = createPublicClient({
                    chain: worldchain,
                    transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
                });
                const raw = await client.readContract({
                address: NEX_GOLD_STAKING_ADDRESS,
                abi: NEX_GOLD_STAKING_ABI,
                functionName: 'calculateMiningRewards',
                args: [walletAddress],
                });

                if (isMounted) console.log("Recompensas de Mining (debug):", raw);

            } catch (error) {
                console.error("Error en fx debug", error);
            }
        }

    }, []);

    const isProcessing = status === 'pending';
    const isLocked = contractData.lockinEndDate && contractData.lockinEndDate > new Date();

    return (
        <div className="animate-fade-in">
            <Card className="space-y-4">
                {contractData.isLoading ? <div className="text-center text-yellow-400"><Loader className="animate-spin inline-block" /> Cargando datos...</div> : <>
                    <div className="text-center">
                        <p className="text-lg text-gray-300">Balance en Staking</p>
                        <p className="text-3xl font-bold text-white">{parseFloat(contractData.stakedBalance).toFixed(4)} NXG</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-300">Recompensas Staking (APY)</p>
                            <p className="text-xl font-bold text-green-400">+{parseFloat(contractData.stakingRewards).toFixed(4)} NXG</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-300">Recompensas Mining (Fijo)</p>
                            <p className="text-xl font-bold text-yellow-400">+{parseFloat(contractData.miningRewards).toFixed(4)} NXG</p>
                        </div>
                    </div>

                    {contractData.lockinEndDate && parseFloat(contractData.stakedBalance) > 0 && (
                        <div className={`text-center p-2 rounded-md text-sm ${isLocked ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                            <Info className="inline-block mr-2 h-4 w-4" />
                            {isLocked ? `Bloqueado hasta: ${contractData.lockinEndDate.toLocaleString()}` : 'Fondos desbloqueados.'}
                        </div>
                    )}

                    <InputGold type="number" placeholder="Cantidad de NXG" value={amount} onChange={(e: any) => setAmount(e.target.value)} />
                    <div className="grid grid-cols-2 gap-4">
                        <GoldButton onClick={handleStake} disabled={isProcessing}>Stake</GoldButton>
                        <GoldButton onClick={handleUnstake} disabled={isProcessing || parseFloat(contractData.stakedBalance) <= 0}>Unstake</GoldButton>
                    </div>
                    <GoldButton onClick={handleClaim} className="w-full" disabled={isProcessing || parseFloat(contractData.stakedBalance) <= 0}>Reclamar Recompensas</GoldButton>
                </>}
                
                <div className="h-10 text-center text-sm flex items-center justify-center">
                    {status === 'pending' && <p className="text-yellow-400 flex items-center gap-2"><Loader className="animate-spin" />Procesando...</p>}
                    {status === 'success' && <p className="text-green-400 flex items-center gap-2"><CheckCircle />¡Éxito!</p>}
                    {status === 'error' && <p className="text-red-400 flex items-center gap-2"><XCircle />Error: {error}</p>}
                </div>
            </Card>
            <BackButton onClick={onBack} />
        </div>
    );
};

function MainAppContent() {
    const [activeSection, setActiveSection] = useState<'dashboard' | 'staking'>('dashboard');
    const { data: session } = useSession();

    const UserInfo = () => {
        if (!session?.user) return null;
        return (
            <div className="flex flex-row items-center justify-start gap-1 rounded-lg w-full p-2 text-white bg-black/50 border border-yellow-500/20">
                <Marble src={session.user.profilePictureUrl} className="w-10 h-10" />
                <div className="flex flex-col flex-grow ml-2">
                    <span className="text-m font-semibold capitalize text-white">{session.user.username}</span>
                    <span className="font-mono text-xs text-gray-400">{session.user.walletAddress?.substring(0, 6)}...{session.user.walletAddress?.slice(-4)}</span>
                </div>
                <button onClick={() => signOut({ callbackUrl: '/' })} title="Sign Out" className="ml-auto p-2 rounded-full hover:bg-gray-700">
                    <LogOut className="h-5 w-5 text-gray-400 hover:text-white" />
                </button>
            </div>
        );
    };

    const renderSection = () => {
        const goBack = () => setActiveSection('dashboard');
        switch (activeSection) {
            case 'dashboard': return <GoldButton className="w-full" onClick={() => setActiveSection('staking')}>📈 Acceder a Staking & Mining</GoldButton>;
            case 'staking': return <StakingAndMiningSection onBack={goBack} />;
            default: return <GoldButton onClick={() => setActiveSection('staking')}>📈 Acceder a Staking & Mining</GoldButton>;
        }
    };

    return (
        <div className="w-full">
            <div className="mb-6"><UserInfo /></div>
            <main>{renderSection()}</main>
        </div>
    );
};

export default function HomePage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center text-yellow-400 bg-gray-900">Cargando...</div>;
    }

    if (status === 'authenticated') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={{
                backgroundImage: "url('/background.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed'
            }}>
                <div className="w-full max-w-md mx-auto bg-black/80 backdrop-blur-lg border border-yellow-500/20 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6">
                    <header className="text-center mb-6">
                        <h1 className="text-4xl font-bold text-white">
                            <span className="text-yellow-400">Nex</span>Gold
                        </h1>
                        <p className="text-yellow-500 text-lg">NXG Official App</p>
                    </header>
                    <MainAppContent />
                </div>
            </div>
        );
    }
    
    return null;
}
