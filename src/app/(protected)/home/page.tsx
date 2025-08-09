"use client";

import React, { useState, useEffect, FC } from 'react';
import { Abi } from 'viem';
import { Marble } from '@worldcoin/mini-apps-ui-kit-react';
import { useSession, signOut } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TOKEN_ABI: Abi = [
    {"constant": true, "inputs": [{"name": "_owner", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "balance", "type": "uint256"}], "type": "function", "stateMutability": "view"},
    {"constant": false, "inputs": [{"name": "_spender", "type": "address"},{"name": "_value", "type": "uint256"}], "name": "approve", "outputs": [{"name": "", "type": "bool"}], "type": "function", "stateMutability": "nonpayable"}
];
const STAKING_ABI: Abi = [
    {"constant": false, "inputs": [{"name": "_amount", "type": "uint256"}], "name": "stake", "outputs": [], "type": "function", "stateMutability": "nonpayable"},
    {"constant": false, "inputs": [{"name": "_amount", "type": "uint256"}], "name": "unstake", "outputs": [], "type": "function", "stateMutability": "nonpayable"},
    {"constant": false, "inputs": [], "name": "claimRewards", "outputs": [], "type": "function", "stateMutability": "nonpayable"}
];
const MINING_ABI: Abi = [
    {"constant": false, "inputs": [], "name": "claim", "outputs": [], "type": "function", "stateMutability": "nonpayable"}
];

const TOKEN_CONTRACT_ADDRESS = '0x...';
const STAKING_CONTRACT_ADDRESS = '0x...';
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

const Dashboard: FC<{ onNavigate: (section: SectionId) => void }> = ({ onNavigate }) => {
    return (
        <div className="animate-fade-in grid grid-cols-2 gap-4">
             <GoldButton onClick={() => onNavigate('staking')}>📈 Staking</GoldButton>
             <GoldButton onClick={() => onNavigate('mining')}>⛏️ Mining</GoldButton>
        </div>
    );
};
const StakingSection: FC<{ onBack: () => void }> = ({ onBack }) => { return <div><Card><p>Staking interface goes here.</p></Card><BackButton onClick={onBack} /></div>; };
const MiningSection: FC<{ onBack: () => void }> = ({ onBack }) => { return <div><Card><p>Mining interface goes here.</p></Card><BackButton onClick={onBack} /></div>; };

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
    const { status, data: session } = useSession();
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
