import { useActionExecutor } from '../hooks/useActionExecutor';
import { useWallet } from '../context/WalletContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export default function ActionExecutorDemo() {
    const { connectedAddress } = useWallet();
    const { actionCount, isLoading, error, txHash, performAction, readActionCount } = useActionExecutor();

    if (!connectedAddress) return null;

    return (
        <Card className="h-full flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">Action Executor</h3>
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>

                <div className="text-center py-8">
                    <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">Total Actions</p>
                    <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 font-mono">
                        {actionCount ?? '-'}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {txHash && (
                    <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-center text-emerald-400 hover:text-emerald-300 transition-colors truncate px-2"
                    >
                        Confirmed: {txHash}
                    </a>
                )}

                {error && (
                    <p className="text-xs text-center text-red-400">{error}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" onClick={readActionCount} disabled={isLoading}>
                        Refresh
                    </Button>
                    <Button onClick={performAction} isLoading={isLoading}>
                        Execute
                    </Button>
                </div>
            </div>
        </Card>
    );
}
