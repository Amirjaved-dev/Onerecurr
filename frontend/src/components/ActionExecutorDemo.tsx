import { useActionExecutor } from '../hooks/useActionExecutor';
import { useWallet } from '../context/WalletContext';

export default function ActionExecutorDemo() {
    const { connectedAddress } = useWallet();
    const { actionCount, isLoading, error, txHash, performAction, readActionCount, contractAddress } = useActionExecutor();

    const truncateAddress = (addr: string) => {
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    const handlePerformAction = async () => {
        const success = await performAction();
        if (success) {
            console.log('Action performed successfully!');
        }
    };

    if (!connectedAddress) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Action Executor
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Smart Contract Interaction
                        </p>
                    </div>
                </div>

                <div className="text-center py-4">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                        Connect your wallet to interact with the contract
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Action Executor
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Smart Contract Interaction
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
            )}

            <div className="space-y-4">
                {/* Action Count Display */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Current Action Count
                        </p>
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                            {actionCount !== null ? actionCount : '...'}
                        </div>
                        {actionCount !== null && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Total actions performed on this contract
                            </p>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handlePerformAction}
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Processing...
                        </span>
                    ) : (
                        '⚡ Perform Action'
                    )}
                </button>

                {/* Transaction Hash Display */}
                {txHash && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                                    Transaction Confirmed!
                                </p>
                                <p className="text-xs font-mono text-green-600 dark:text-green-400 break-all">
                                    {txHash}
                                </p>
                                <a
                                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                                >
                                    View on Etherscan
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Refresh Button */}
                <button
                    onClick={readActionCount}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    🔄 Refresh Count
                </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Contract: <span className="font-mono">{truncateAddress(contractAddress)}</span>
                </p>
            </div>
        </div>
    );
}
