"use client";
// test github
import React, { useState, useEffect, FC } from 'react';
import { Abi, parseEther } from 'viem';
import { Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TOKEN_ABI: Abi = [
    {"constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function", "stateMutability": "view"},
    {"constant": false, "inputs": [{"name": "_spender", "type": "address"},{"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function", "stateMutability": "nonpayable"}
];
const MINING_ABI: Abi = [
    {"constant": false, "inputs": [], "name": "claim", "outputs": [], "type": "function", "stateMutability": "nonpayable"}
];

const TOKEN_CONTRACT_ADDRESS = '0x...';
const MINING_CONTRACT_ADDRESS = '0x...';

type SectionId = 'dashboard' | 'staking' | 'mining';

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

const useMiniKitTransaction = () => {
    const [transactionState, setTransactionState] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
    const [isConfirming, setIsConfirming] = useState(false);
    const [transactionError, setTransactionError] = useState<string | null>(null);

    const sendTransaction = async (config: any) => {
        setTransactionState('pending');
        setIsConfirming(true);
        setTransactionError(null);
        
        return new Promise(resolve => setTimeout(() => {
            const success = Math.random() > 0.2;
            if (success) {
                setTransactionState('success');
                resolve({ status: 'success' });
            } else {
                setTransactionState('failed');
                setTransactionError("La transacción fue rechazada.");
                resolve({ status: 'failed' });
            }
            setIsConfirming(false);
        }, 2000));
    };
    return { sendTransaction, transactionState, isConfirming, transactionError };
};

const Dashboard: FC<{ onNavigate: (section: SectionId) => void }> = ({ onNavigate }) => {
    return (
        <div className="animate-fade-in grid grid-cols-2 gap-4">
             <GoldButton onClick={() => onNavigate('staking')}>📈 Staking</GoldButton>
             <GoldButton onClick={() => onNavigate('mining')}>⛏️ Mining</GoldButton>
        </div>
    );
};

const StakingSection: FC<{ onBack: () => void }> = ({ onBack }) => {
    const [balance, setBalance] = useState(0);
    const [rewards, setRewards] = useState(0);
    const [amount, setAmount] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const APY = 0.12;
        const ratePerSecond = APY / (365 * 24 * 60 * 60);
        const interval = setInterval(() => {
            if (balance > 0) {
                setRewards(prev => prev + balance * ratePerSecond);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [balance]);

    const updateStatus = (message: string) => {
        setStatus(message);
        setTimeout(() => setStatus(''), 3000);
    };

    const handleStake = () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0) return;
        setBalance(prev => prev + value);
        setAmount('');
        updateStatus(`Stake de ${value.toFixed(2)} NXG exitoso.`);
    };

    const handleUnstake = () => {
        const value = parseFloat(amount);
        if (isNaN(value) || value <= 0 || value > balance) return;
        setBalance(prev => prev - value);
        setAmount('');
        updateStatus(`Unstake de ${value.toFixed(2)} NXG exitoso.`);
    };

    const handleClaim = () => {
        if (rewards <= 0) return;
        const claimed = rewards;
        setRewards(0);
        updateStatus(`Reclamaste ${claimed.toFixed(4)} NXG en recompensas.`);
    };
    
    return (
        <div className="animate-fade-in">
            <Card className="space-y-4">
                <div className="text-center">
                    <p className="text-lg text-gray-300">Tasa de Recompensa (APY)</p>
                    <p className="text-2xl font-bold text-green-400">12%</p>
                </div>
                <div className="text-center">
                    <p className="text-lg text-gray-300">Balance en Staking</p>
                    <p className="text-2xl font-bold text-white">{balance.toFixed(4)} NXG</p>
                </div>
                <div className="text-center">
                    <p className="text-lg text-gray-300">Recompensas Acumuladas</p>
                    <p className="text-2xl font-bold text-white">{rewards.toFixed(4)} NXG</p>
                </div>
                <InputGold type="number" placeholder="Cantidad de NXG" value={amount} onChange={(e: any) => setAmount(e.target.value)} />
                <div className="grid grid-cols-2 gap-4">
                    <GoldButton onClick={handleStake}>Stake</GoldButton>
                    <GoldButton onClick={handleUnstake}>Unstake</GoldButton>
                </div>
                <GoldButton onClick={handleClaim} className="w-full">Reclamar Recompensas</GoldButton>
                <div className="h-5 text-center text-green-400 text-sm">{status}</div>
            </Card>
            <BackButton onClick={onBack} />
        </div>
    );
};

const MiningSection: FC<{ onBack: () => void }> = ({ onBack }) => {
    const { sendTransaction, transactionState, isConfirming, transactionError } = useMiniKitTransaction();
    const [minedAmount] = useState(0);
    const [isMining, setIsMining] = useState(false);
    const [depositAmount, setDepositAmount] = useState('');
    const [poolBalance, setPoolBalance] = useState(10000); 

    const handleClaim = async () => {
        const claimConfig = {
            transaction: [{
                address: MINING_CONTRACT_ADDRESS,
                abi: MINING_ABI,
                functionName: 'claim',
                args: [],
            }]
        };
        await sendTransaction(claimConfig);
    };

    const handleDeposit = async () => {
        const value = parseFloat(depositAmount);
        if (isNaN(value) || value <= 0) {
            alert("Por favor, introduce una cantidad válida.");
            return;
        }
        const depositConfig = {
            transaction: [{
                address: TOKEN_CONTRACT_ADDRESS,
                abi: TOKEN_ABI,
                functionName: 'transfer',
                args: [
                    MINING_CONTRACT_ADDRESS,
                    parseEther(value.toString()).toString()
                ],
            }]
        };
        await sendTransaction(depositConfig);
        if (!transactionError) {
             setPoolBalance(prev => prev + value);
             setDepositAmount('');
        }
    };

    const isLoading = transactionState === 'pending' || isConfirming;

    return (
        <div className="animate-fade-in">
            <Card className="space-y-4 text-center">
                <h4 className="text-xl font-semibold text-yellow-400 border-b border-yellow-400/20 pb-2">Tu Minado</h4>
                <p className="text-lg text-gray-300">NXG Minado (Reclamable)</p>
                <p className="text-4xl font-bold text-white font-mono">{minedAmount.toFixed(6)}</p>
                <GoldButton onClick={() => setIsMining(true)} disabled={isMining}>Iniciar Minado</GoldButton>
                <GoldButton onClick={handleClaim} disabled={!isMining || isLoading}>
                    {isLoading ? 'Procesando...' : 'Reclamar Minado'}
                </GoldButton>
                
                <div className="border-t border-yellow-400/20 pt-4 mt-4">
                    <h4 className="text-xl font-semibold text-yellow-400 pb-2">Fondo de Recompensas</h4>
                    <p className="text-lg text-gray-300">Tokens Disponibles en el Fondo</p>
                    <p className="text-2xl font-bold text-white">{poolBalance.toFixed(2)} NXG</p>
                    <div className="flex gap-2 mt-4">
                        <InputGold type="number" placeholder="Cantidad a depositar" value={depositAmount} onChange={(e: any) => setDepositAmount(e.target.value)} />
                        <GoldButton onClick={handleDeposit} disabled={isLoading}>
                             {isLoading ? '...' : 'Depositar'}
                        </GoldButton>
                    </div>
                </div>

                 {transactionState && transactionState !== 'idle' && (
                    <div className={`text-center p-2 rounded-md mt-2 text-sm ${
                        transactionState === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}>
                        {transactionState === 'success' && '¡Transacción exitosa!'}
                        {transactionState === 'failed' && `Error: ${transactionError || 'La transacción falló'}`}
                    </div>
                )}
            </Card>
            <BackButton onClick={onBack} />
        </div>
    );
};

function MainAppContent() {
    const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
    const { data: session } = useSession();

    const UserInfo = () => {
        if (!session?.user) return null;
        const { user } = session;
        return (
            <div className="flex flex-row items-center justify-start gap-1 rounded-lg w-full p-2 text-white bg-black/50 border border-yellow-500/20">
                <Marble src={user.profilePictureUrl} className="w-10 h-10" />
                <div className="flex flex-col flex-grow ml-2">
                    <span className="text-m font-semibold capitalize text-white">{user.username}</span>
                    <span className="font-mono text-xs text-gray-400">{user.walletAddress?.substring(0, 6)}...{user.walletAddress?.slice(-4)}</span>
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
            case 'dashboard': return <Dashboard onNavigate={setActiveSection} />;
            case 'staking': return <StakingSection onBack={goBack} />;
            case 'mining': return <MiningSection onBack={goBack} />;
            default: return <Dashboard onNavigate={setActiveSection} />;
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
                backgroundImage: "url('https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2020&auto=format&fit=crop')",
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
