'use client';

import { useState, type FC } from 'react';
import { useSession } from 'next-auth/react';
import { getAddress, formatEther } from 'viem';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Layers, X, History } from 'lucide-react';
import { UserInfo, GoldButton } from '@/components/ui-components';
import { useWalletData } from '@/hooks/use-wallet-data';

const HistoryModal: FC<{
  isOpen: boolean;
  onClose: () => void;
  transactions: any[];
  isLoading: boolean;
  error: string | null;
  walletAddress: `0x${string}` | undefined;
  onRefresh: () => void;
}> = ({ isOpen, onClose, transactions, isLoading, error, walletAddress, onRefresh }) => {
  if (!isOpen) return null;

  const TransactionIcon: FC<{ type: 'in' | 'out' }> = ({ type }) => {
    const isIncoming = type === 'in';
    const Icon = isIncoming ? ArrowDownLeft : ArrowUpRight;
    return (
      <div className={`p-2 rounded-full ${isIncoming ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
        <Icon className={isIncoming ? 'text-green-400' : 'text-red-400'} size={20} />
      </div>
    );
  };

  const TransactionItem: FC<{ tx: any }> = ({ tx }) => {
    if (!walletAddress) return null;
    const isIncoming = getAddress(tx.to) === getAddress(walletAddress);
    const amount = parseFloat(formatEther(BigInt(tx.value))).toFixed(4);
    const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleDateString();
    let type = isIncoming ? 'Recibido' : 'Enviado';
    if (getAddress(tx.from) === '0x13861894fc9fb57a911fff500c6f460e69cb9ef1') {
        type = isIncoming ? 'Recompensa / Unstake' : 'Stake';
    }
    return (
      <div className="flex items-center justify-between py-4 px-2 hover:bg-yellow-500/5 rounded-lg transition-colors">
        <div className="flex items-center gap-4"><TransactionIcon type={isIncoming ? 'in' : 'out'} />
          <div><p className="font-semibold text-white">{type}</p><p className="text-xs text-gray-400">{date}</p></div>
        </div>
        <p className={`font-bold ${isIncoming ? 'text-green-400' : 'text-white'}`}>{isIncoming ? '+' : '-'} {amount} NXG</p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-gray-900/80 border-2 border-yellow-500/30 rounded-2xl shadow-2xl shadow-yellow-500/10 p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Historial de Transacciones</h2>
          <button onClick={onRefresh} disabled={isLoading} className="text-gray-400 hover:text-white transition disabled:opacity-50"><RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center py-8"><Layers className="animate-spin text-yellow-400 inline-block" /><p className="mt-2 text-gray-300">Cargando...</p></div>
          ) : error ? (
            <p className="text-center text-red-400 py-8">{error}</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron transacciones.</p>
          ) : (
            <div className="divide-y divide-yellow-500/10">{transactions.map(tx => <TransactionItem key={tx.hash} tx={tx} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

const WalletPage: FC = () => {
  const { balance, transactions, isLoading, error, fetchWalletData } = useWalletData();
  const { data: session } = useSession();
  const walletAddress = session?.user?.walletAddress as `0x${string}` | undefined;
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex items-start justify-center p-4 pt-8 font-sans"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="w-full max-w-md mx-auto text-white animate-fade-in space-y-6">
        <UserInfo />
        <div className="bg-black/30 backdrop-blur-lg border border-yellow-500/20 rounded-2xl p-6 text-center">
          <p className="text-gray-300 text-sm">Balance Total de NXG</p>
          {isLoading && !balance ? (
            <div className="h-12 flex items-center justify-center"><Layers className="animate-spin text-yellow-400" /></div>
          ) : (
            <p className="text-4xl font-bold text-yellow-400 my-2">{parseFloat(balance).toLocaleString('es', { minimumFractionDigits: 4 })}</p>
          )}
          <p className="text-xs text-gray-500 font-mono break-all">{walletAddress}</p>
        </div>
        <GoldButton onClick={() => setIsModalOpen(true)} disabled={isLoading}>
          <History className="inline-block mr-2" size={20}/>
          Ver Historial de Transacciones
        </GoldButton>
      </div>
      <HistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transactions={transactions}
        isLoading={isLoading}
        error={error}
        walletAddress={walletAddress}
        onRefresh={fetchWalletData}
      />
    </div>
  );
};

export default WalletPage;
