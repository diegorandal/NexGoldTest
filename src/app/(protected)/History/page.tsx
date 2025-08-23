'use client';
import { getAddress, formatEther } from "viem"
import { useSession } from "next-auth/react"
import { Loader, XCircle } from 'lucide-react'
import { Card } from "@/components/ui-components"
import { useState, useEffect, type FC, useCallback } from "react"

const NEX_GOLD_STAKING_ADDRESS = "0xd025b92f1b56ada612bfdb0c6a40dfe27a0b4183"

// Define los tipos si no los tienes en un archivo de tipos global
interface Transaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
}

const useWalletData = () => {
    const { data: session } = useSession();
    const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWalletData = useCallback(async () => {
        if (!walletAddress) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/history?address=${walletAddress}`);

            if (!response.ok) {
                throw new Error('La respuesta de la red no fue válida.');
            }
            const data = await response.json();
            if (data.status === '1') {
                setTransactions(data.result);
            } else if (data.message === 'No transactions found') {
                setTransactions([]);
            } else {
                throw new Error(data.message || 'Error al obtener las transacciones');
            }
        } catch (e: any) {
            setError(e.message || 'No se pudieron cargar los datos.');
        } finally {
            setIsLoading(false);
        }
    }, [walletAddress]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    return { transactions, isLoading, error, fetchWalletData };
};


export default function HistoryPage() {
    const { transactions, isLoading, error } = useWalletData();
    const { data: session } = useSession();
    const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;

    const TransactionItem: FC<{ tx: Transaction }> = ({ tx }) => {
        if (!walletAddress) return null;
        const isIncoming = getAddress(tx.to) === getAddress(walletAddress);
        const amount = parseFloat(formatEther(BigInt(tx.value))).toFixed(4);
        const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleString();
        let type = isIncoming ? 'Recibido' : 'Enviado';
        if (getAddress(tx.from) === NEX_GOLD_STAKING_ADDRESS) {
            type = isIncoming ? 'Recompensa / Unstake' : 'Stake';
        }

        return (
            <div className="bg-white/10 p-4 rounded-lg flex flex-col justify-between items-start md:items-center space-y-2">
                {/* Fila superior: Fecha y Enlace */}
                <div className="flex justify-between items-center w-full">
                    <p className="text-xs text-gray-500">{date}</p>
                    <a href={`https://worldscan.org/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-yellow-400 text-sm hover:underline">
                        Ver Transacción
                    </a>
                </div>
                {/* Fila inferior: Cantidad y Dirección */}
                <div className="flex justify-between items-center w-full">
                    <p className={`font-bold break-all ${isIncoming ? 'text-green-400' : 'text-red-400'}`}>{isIncoming ? '+' : '-'} {amount} NXG</p>
                    <p className="text-sm text-gray-400 break-all">{isIncoming ? `De: ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}` : `A: ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in mx-4 mt-4 pb-24">
            <Card className="space-y-4">
                <h2 className="text-xl font-bold text-yellow-400 text-center">Historial de Transacciones</h2>
                {isLoading ? (
                    <div className="text-center text-yellow-400 p-4"><Loader className="animate-spin inline-block mr-2" /> Cargando...</div>
                ) : error ? (
                    <div className="text-center text-red-400 p-4"><XCircle className="inline-block mr-2" /> {error}</div>
                ) : transactions.length > 0 ? (
                    <div className="space-y-4 pr-2">{transactions.map((tx) => (<TransactionItem key={tx.hash} tx={tx} />))}</div>
                ) : (
                    <div className="text-center text-gray-400 p-4"><p>No se encontraron transacciones.</p></div>
                )}
            </Card>
        </div>
    );
}
