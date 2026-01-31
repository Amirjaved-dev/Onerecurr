import { useState } from 'react';

interface WalletConnectProps {
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            // Check if ethereum is available (MetaMask/Ambire)
            if (typeof window.ethereum !== 'undefined') {
                // Request account access
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });

                if (accounts && accounts.length > 0) {
                    const address = accounts[0];
                    setConnectedAddress(address);
                    onConnect?.(address);
                }
            } else {
                alert('Please install a Web3 wallet (e.g., Ambire Wallet)');
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet. Please try again.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setConnectedAddress(null);
        onDisconnect?.();
    };

    const truncateAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="wallet-connect">
            {!connectedAddress ? (
                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isConnecting ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Connecting...
                        </span>
                    ) : (
                        'Connect Wallet'
                    )}
                </button>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-mono text-green-700 dark:text-green-300">
                            {truncateAddress(connectedAddress)}
                        </span>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-200"
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}

// Extend Window interface for TypeScript
declare global {
    interface Window {
        ethereum?: any;
    }
}
