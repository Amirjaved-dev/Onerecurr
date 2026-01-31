import { useSessionKey } from '../hooks/useSessionKey';
import { useWallet } from '../context/WalletContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

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
        expiresAt,
        createSession,
        clearSession,
    } = useSessionKey(contractAddress);

    const truncateAddress = (addr: string) => `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;

    const formatTimeRemaining = (expiry: number | null) => {
        if (!expiry) return '';
        const diff = expiry - Date.now();
        if (diff <= 0) return 'Expired';
        const mins = Math.floor(diff / 60000);
        return diff > 3600000 ? '> 1h' : `${mins}m left`;
    };

    if (!connectedAddress) return null;

    return (
        <Card className={`border-l-4 ${isActive ? 'border-l-emerald-500' : 'border-l-purple-500'}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">Session Key</h3>
                        <Badge
                            status={isActive ? 'success' : 'neutral'}
                            text={isActive ? 'Active' : 'Inactive'}
                            pulse={isActive}
                        />
                    </div>

                    <p className="text-sm text-gray-400 mb-3">
                        {isActive
                            ? "Gasless mode enabled. Transactions will be signed automatically."
                            : "Enable session keys to perform transactions without wallet popups."}
                    </p>

                    {isActive && (
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-500 bg-black/20 p-2 rounded-lg inline-flex">
                            <span>Key: {truncateAddress(sessionAddress!)}</span>
                            <span className="w-px h-3 bg-white/10" />
                            <span className="text-emerald-500">{formatTimeRemaining(expiresAt)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {!isActive ? (
                        <Button
                            onClick={createSession}
                            isLoading={isCreating}
                            className="w-full md:w-auto"
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            }
                        >
                            Start Session
                        </Button>
                    ) : (
                        <Button variant="danger" onClick={clearSession} className="w-full md:w-auto">
                            End Session
                        </Button>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    {error}
                </div>
            )}
        </Card>
    );
}
