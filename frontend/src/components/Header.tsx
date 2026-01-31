import WalletConnect from './WalletConnect';

interface HeaderProps {
    connectedAddress?: string | null;
    onConnect?: (address: string) => void;
    onDisconnect?: () => void;
}

export default function Header({ connectedAddress, onConnect, onDisconnect }: HeaderProps) {
    return (
        <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">1R</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                One Recurr
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Gasless Session Payments
                            </p>
                        </div>
                    </div>

                    {/* Network Indicator and Wallet Connection */}
                    <div className="flex items-center gap-4">
                        {/* Network Badge */}
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                                Sepolia Testnet
                            </span>
                        </div>

                        {/* Wallet Connect Component */}
                        <WalletConnect
                            onConnect={onConnect}
                            onDisconnect={onDisconnect}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
