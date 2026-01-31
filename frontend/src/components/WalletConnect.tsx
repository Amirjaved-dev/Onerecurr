import { useWallet } from '../context/WalletContext';

export default function WalletConnect() {
    const { wallets, connect, disconnect, connectedAddress, isConnecting, error } = useWallet();

    const handleConnect = async () => {
        try {
            await connect();
        } catch (err) {
            // Error is handled in the hook and stored in error state
            console.error('Connection failed:', err);
        }
    };

    const truncateAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="wallet-connect">
            {error && (
                <div className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {!connectedAddress ? (
                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isConnecting ? (
                            <span className="flex items-center justify-center gap-2">
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
                    {wallets.length === 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            No wallets detected. Please install Ambire Wallet.
                        </p>
                    )}
                    {wallets.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            Detected: {wallets.map(w => w.name).join(', ')}
                        </p>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-mono text-green-700 dark:text-green-300">
                            {truncateAddress(connectedAddress)}
                        </span>
                    </div>
                    <button
                        onClick={disconnect}
                        className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-200"
                    >
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}
