"use client";

import React, { useState, useEffect, FC, useCallback } from 'react';
import { Abi } from 'viem';
import { MiniKit, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js';
import { Marble, Button as MiniKitButton } from '@worldcoin/mini-apps-ui-kit-react';
import { SessionProvider, useSession, signOut, signIn } from 'next-auth/react';
import { LogOut, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';

const TOKEN_ABI: Abi = [
    {
        "constant": true,
        "inputs": [{ "name": "_owner", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "name": "balance", "type": "uint256" }],
        "type": "function",
        "stateMutability": "view"
    },
    {
        "constant": false,
        "inputs": [
            { "name": "_spender", "type": "address" },
            { "name": "_value", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [{ "name": "", "type": "bool" }],
        "type": "function",
        "stateMutability": "nonpayable"
    }
];
const STAKING_ABI: Abi = [
    {
        "constant": false,
        "inputs": [{ "name": "_amount", "type": "uint256" }],
        "name": "stake",
        "outputs": [],
        "type": "function",
        "stateMutability": "nonpayable"
    },
    {
        "constant": false,
        "inputs": [{ "name": "_amount", "type": "uint256" }],
        "name": "unstake",
        "outputs": [],
        "type": "function",
        "stateMutability": "nonpayable"
    },
    {
        "constant": false,
        "inputs": [],
        "name": "claimRewards",
        "outputs": [],
        "type": "function",
        "stateMutability": "nonpayable"
    }
];
const MINING_ABI: Abi = [
    {
        "constant": false,
        "inputs": [],
        "name": "claim",
        "outputs": [],
        "type": "function",
        "stateMutability": "nonpayable"
    }
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

const AuthButton = ({ className, ...props }: any) => {
    const [isPending, setIsPending] = useState(false);
    const isInstalled = MiniKit.isInstalled();

    const onClick = useCallback(async () => {
        if (!isInstalled || isPending) return;
        setIsPending(true);
        try {
            const nonceRes = await fetch('/api/auth/nonce');
            if (!nonceRes.ok) throw new Error("Could not get nonce.");
            const { nonce, signedNonce } = await nonceRes.json();
            const authPayload = await MiniKit.commandsAsync.walletAuth(nonce);
            if (authPayload.finalPayload.status !== 'success') throw new Error("User cancelled authentication.");
            await signIn('credentials', {
                nonce,
                signedNonce,
                finalPayloadJson: JSON.stringify(authPayload.finalPayload),
                redirect: false,
            });
        } catch (error) {
            console.error('Authentication flow error:', error);
        } finally {
            setIsPending(false);
        }
    }, [isInstalled, isPending]);

    return (
        <MiniKitButton onClick={onClick} disabled={isPending || !isInstalled} className={clsx("w-full bg-yellow-500 text-black hover:bg-yellow-400", className)} {...props}>
            {isPending ? 'Connecting...' : 'Sign In with Wallet'}
        </MiniKitButton>
    );
};

const VerifyComponent: React.FC<{ onSuccess: () => void; }> = ({ onSuccess }) => {
    const { data: session } = useSession();
    const walletAddress = session?.user?.walletAddress;
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(null);

    const handleVerificationClick = async () => {
        if (!walletAddress) {
            setVerificationError("Wallet address not available. Please sign in again.");
            return;
        }
        setIsVerifying(true);
        setVerificationError(null);
        try {
            const { finalPayload } = await MiniKit.commandsAsync.verify({
                action: 'nexg-login',
                signal: walletAddress,
                verification_level: VerificationLevel.Orb,
            });
            if (finalPayload.status === 'error') throw new Error(finalPayload.error_code ?? 'Verification cancelled.');
            const verifyResponse = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payload: finalPayload as ISuccessResult }),
            });
            const verifyResponseJson = await verifyResponse.json();
            if (verifyResponse.ok && verifyResponseJson.success) {
                onSuccess();
            } else {
                throw new Error(verifyResponseJson.detail || 'Server-side verification failed.');
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            setVerificationError(err.message || "An unexpected error occurred.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="w-full max-w-sm flex flex-col items-center text-center mt-4">
            <h3 className="text-2xl font-bold text-white mb-2">One Last Step</h3>
            <p className="mb-4 text-slate-300">Verify your humanity with World ID to access the NexGold platform.</p>
            <button onClick={handleVerificationClick} disabled={isVerifying} className="relative inline-flex items-center justify-center p-0.5 mb-2 me-2 overflow-hidden text-base font-medium text-gray-900 rounded-lg group bg-gradient-to-br from-purple-600 to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                <span className="relative flex items-center px-6 py-3 transition-all ease-in duration-150 bg-gray-900 rounded-md group-hover:bg-opacity-0">
                    <ShieldCheck className="w-5 h-5 me-2 text-white" aria-hidden="true" />
                    <span className="text-white">Verify Humanity</span>
                </span>
            </button>
            <div className="h-10 mt-2 text-sm flex flex-col items-center justify-center">
                {isVerifying && <p className="text-yellow-400">Opening World App to verify...</p>}
                {verificationError && <p className="text-red-400">{verificationError}</p>}
            </div>
        </div>
    );
};

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

const MainAppContent = () => {
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

function AppFlowManager() {
    const { data: session, status, update } = useSession();

    const handleVerificationSuccess = async () => {
        await update({ isHumanVerified: true });
    };

    if (status === 'loading') {
        return <div className="text-center text-yellow-400">Loading...</div>;
    }

    if (!session) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to NexGold</h2>
                <p className="text-slate-300 mb-6">Sign in with your wallet to begin.</p>
                <AuthButton />
            </div>
        );
    }
   
    /*
    if (!session.user.isHumanVerified) {
        return <VerifyComponent onSuccess={handleVerificationSuccess} />;
    }
    */

    return <MainAppContent />;
}

export default function AppWrapper() {
    return (
        <SessionProvider>
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
                        <AppFlowManager />
                    </div>
                </div>
        </SessionProvider>
    );
}
