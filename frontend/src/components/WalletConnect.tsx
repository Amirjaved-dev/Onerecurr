import { useWallet } from '../context/WalletContext';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { useState } from 'react';

export default function WalletConnect() {
    const { wallets, connect, disconnect, connectedAddress, isConnecting, error } = useWallet();
    const [showWallets, setShowWallets] = useState(false);

    const handleConnect = async () => {
        // If no wallets detected, guide user to install one
        if (wallets.length === 0) {
            window.open('https://www.ambire.com/', '_blank');
            return;
        }

        try {
            if (wallets.length > 1) {
                setShowWallets(!showWallets);
            } else {
                await connect();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const truncateAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    if (connectedAddress) {
        return (
            <div className="flex items-center gap-3">
                <Badge status="success" text={truncateAddress(connectedAddress)} pulse />
                <Button
                    variant="secondary"
                    onClick={disconnect}
                    className="!py-1.5 !px-3 text-sm !rounded-lg"
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <div className="relative">
            <Button
                variant="primary"
                onClick={handleConnect}
                isLoading={isConnecting}
                className="!py-2 !px-4 text-sm"
                icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                }
            >
                {wallets.length === 0 ? 'Install Wallet' : 'Connect Wallet'}
            </Button>

            {error && (
                <div className="absolute top-full right-0 mt-2 w-64 p-3 bg-red-900/90 border border-red-500/50 rounded-lg text-xs text-red-200 backdrop-blur-md animate-fade-in z-50">
                    {error}
                </div>
            )}
        </div>
    );
}
