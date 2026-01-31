import { useState } from 'react';
import { useYellowChannel } from '../hooks/useYellowChannel';
import { useSessionKey } from '../hooks/useSessionKey';

interface TippingStreamProps {
    contractAddress: string;
}

export function TippingStream({ contractAddress }: TippingStreamProps) {
    const {
        connectionStatus,
        channelState,
        isConnecting,
        error: channelError,
        connect,
        disconnect,
        openChannel,
        sendTip,
        closeChannel,
    } = useYellowChannel(contractAddress);

    const { isActive: isSessionActive } = useSessionKey(contractAddress);

    const [recipientInput, setRecipientInput] = useState('');
    const [tipInput, setTipInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConnect = async () => {
        await connect();
    };

    const handleOpenChannel = async () => {
        if (!recipientInput) {
            alert('Please enter recipient address');
            return;
        }

        setIsProcessing(true);
        try {
            // Open channel with default/virtual deposit (no actual USDC deposit needed)
            await openChannel(recipientInput, '0');
            setRecipientInput('');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSendTip = async (amount?: string) => {
        const tipAmount = amount || tipInput;
        if (!tipAmount || parseFloat(tipAmount) <= 0) {
            alert('Please enter a valid tip amount');
            return;
        }

        if (parseFloat(tipAmount) > parseFloat(channelState.balance)) {
            alert('Insufficient channel balance');
            return;
        }

        setIsProcessing(true);
        try {
            await sendTip(tipAmount);
            setTipInput('');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCloseChannel = async () => {
        if (!confirm('Are you sure you want to close this channel and settle on-chain?')) {
            return;
        }

        setIsProcessing(true);
        try {
            await closeChannel();
        } finally {
            setIsProcessing(false);
        }
    };

    // Connection Status Badge
    const getStatusColor = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'bg-green-500';
            case 'connecting':
                return 'bg-yellow-500 animate-pulse';
            case 'disconnected':
                return 'bg-red-500';
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'Connected';
            case 'connecting':
                return 'Connecting...';
            case 'disconnected':
                return 'Disconnected';
        }
    };

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Yellow Tipping</h3>
                        <p className="text-sm text-slate-400">Instant off-chain micropayments</p>
                    </div>
                </div>

                {/* Connection Status Badge */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
                    <span className="text-sm text-slate-300">{getStatusText()}</span>
                </div>
            </div>

            {/* Error Display */}
            {channelError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">⚠️ {channelError}</p>
                </div>
            )}

            {/* Session Key Warning */}
            {!isSessionActive && (
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                    <p className="text-sm text-yellow-400">⚠️ Please start a session first to use Yellow Network</p>
                </div>
            )}

            {/* Connection Control */}
            {connectionStatus === 'disconnected' && (
                <button
                    onClick={handleConnect}
                    disabled={!isSessionActive || isConnecting}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                    {isConnecting ? 'Connecting...' : 'Connect to Yellow Network'}
                </button>
            )}

            {connectionStatus === 'connected' && (
                <>
                    {/* Channel Status Panel */}
                    <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-400">Channel Status</span>
                            <span className={`text-sm font-semibold ${channelState.isOpen ? 'text-green-400' : 'text-slate-400'}`}>
                                {channelState.isOpen ? '🟢 Open' : '⚫ Closed'}
                            </span>
                        </div>

                        {channelState.isOpen && (
                            <>
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-3xl font-bold text-white">{channelState.balance}</span>
                                    <span className="text-sm text-slate-400">USDC</span>
                                </div>
                                <div className="text-xs text-slate-500 mb-3">
                                    Recipient: {channelState.recipient?.slice(0, 6)}...{channelState.recipient?.slice(-4)}
                                </div>
                                <button
                                    onClick={handleCloseChannel}
                                    disabled={isProcessing}
                                    className="w-full py-2 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
                                >
                                    Close Channel & Settle
                                </button>
                            </>
                        )}
                    </div>

                    {/* Open Channel Form */}
                    {!channelState.isOpen && (
                        <div className="mb-6 space-y-3">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Recipient Address</label>
                                <input
                                    type="text"
                                    value={recipientInput}
                                    onChange={(e) => setRecipientInput(e.target.value)}
                                    placeholder="0x..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                            </div>

                            <button
                                onClick={handleOpenChannel}
                                disabled={isProcessing || !recipientInput}
                                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Opening...' : '⚡ Open Channel (Gasless)'}
                            </button>
                        </div>
                    )}

                    {/* Tipping Interface */}
                    {channelState.isOpen && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-white mb-3">Send Tip</h4>

                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {['1', '5', '10'].map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => handleSendTip(amount)}
                                        disabled={isProcessing || parseFloat(amount) > parseFloat(channelState.balance)}
                                        className="py-2 bg-slate-700 text-white rounded-lg hover:bg-yellow-500 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
                                    >
                                        {amount} USDC
                                    </button>
                                ))}
                            </div>

                            {/* Custom Amount */}
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={tipInput}
                                    onChange={(e) => setTipInput(e.target.value)}
                                    placeholder="Custom amount"
                                    min="0"
                                    step="0.01"
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 transition-colors"
                                />
                                <button
                                    onClick={() => handleSendTip()}
                                    disabled={isProcessing || !tipInput}
                                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Send
                                </button>
                            </div>

                            <p className="text-xs text-slate-500 mt-2 text-center">
                                ⚡ Instant off-chain transactions • No gas fees
                            </p>
                        </div>
                    )}

                    {/* Transaction History */}
                    {channelState.isOpen && channelState.history.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-white mb-3">Recent Tips</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {channelState.history.map((tip) => (
                                    <div
                                        key={tip.id}
                                        className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 animate-fadeIn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                                <span className="text-green-400">✓</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{tip.amount} USDC</p>
                                                <p className="text-xs text-slate-500">
                                                    {new Date(tip.timestamp).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-green-400 font-semibold">Off-chain</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* In Development Badge */}
                    <div className="mt-4 text-center">
                        <span className="inline-block px-3 py-1 bg-slate-700 text-slate-400 text-xs rounded-full">
                            🚧 In Development
                        </span>
                    </div>

                    {/* Disconnect Button */}
                    <button
                        onClick={disconnect}
                        className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Disconnect from Yellow Network
                    </button>
                </>
            )}
        </div>
    );
}
