import { useSessionKey } from '../hooks/useSessionKey';
import { useWallet } from '../context/WalletContext';

interface SessionKeyManagerProps {
    contractAddress: string;
}

export default function SessionKeyManager({ contractAddress }: SessionKeyManagerProps) {
    const { connectedAddress } = useWallet();
    const {
        sessionAddress,
        isActive,
        isCreating,
        error,
        createdAt,
        expiresAt,
        createSession,
        clearSession,
    } = useSessionKey(contractAddress);

    const truncateAddress = (addr: string) => {
        return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
    };

    const formatTimeRemaining = (expiresAt: number | null): string => {
        if (!expiresAt) return '';

        const remaining = expiresAt - Date.now();
        if (remaining <= 0) return 'Expired';

        const minutes = Math.floor(remaining / 60000);
        if (minutes < 60) {
            return `${minutes}m remaining`;
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m remaining`;
    };

    if (!connectedAddress) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Session Key Manager
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            EIP-7702 Gasless Sessions
                        </p>
                    </div>
                </div>

                <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Connect your wallet to create a session key
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${isActive ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'} rounded-lg flex items-center justify-center`}>
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Session Key Manager
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        EIP-7702 Gasless Sessions
                    </p>
                </div>
                {isActive && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Active
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            {!isActive ? (
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            What are Session Keys?
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Session keys allow you to sign transactions without repeatedly approving them in your wallet.
                            Using EIP-7702, your wallet delegates signing authority to a temporary key for gasless transactions.
                        </p>
                    </div>

                    <button
                        onClick={createSession}
                        disabled={isCreating}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isCreating ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Session...
                            </span>
                        ) : (
                            '🔑 Start Session'
                        )}
                    </button>

                    <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                        You'll be asked to sign an EIP-7702 authorization
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Session Key Address
                                </p>
                                <p className="text-sm font-mono text-green-700 dark:text-green-300 break-all">
                                    {sessionAddress ? truncateAddress(sessionAddress) : 'N/A'}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Created
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {createdAt ? new Date(createdAt).toLocaleTimeString() : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Expires
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {formatTimeRemaining(expiresAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                Session is active! You can now perform gasless transactions without wallet popups for the next hour.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={clearSession}
                        className="w-full px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors duration-200"
                    >
                        🔒 End Session
                    </button>
                </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Authorized for contract: <span className="font-mono">{truncateAddress(contractAddress)}</span>
                </p>
            </div>
        </div>
    );
}
