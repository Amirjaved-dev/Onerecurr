import { createContext, useContext, type ReactNode } from 'react';
import { useWalletConnection, type WalletInfo } from '../hooks/useWalletConnection';
import type { EIP1193Provider } from 'mipd';

interface WalletContextType {
    wallets: WalletInfo[];
    selectedWallet: WalletInfo | null;
    connectedAddress: string | null;
    isConnecting: boolean;
    error: string | null;
    connect: (wallet?: WalletInfo) => Promise<string | undefined>;
    disconnect: () => void;
    getChainId: () => Promise<string | null>;
    getProvider: () => EIP1193Provider | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    const wallet = useWalletConnection();

    return (
        <WalletContext.Provider value={wallet}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWallet() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWallet must be used within a WalletProvider');
    }
    return context;
}
