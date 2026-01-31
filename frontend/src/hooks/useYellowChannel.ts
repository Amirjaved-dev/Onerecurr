import { useState, useCallback, useEffect } from 'react';
import { yellowNetwork, type ConnectionStatus } from '../utils/yellowNetwork';
import { getSessionKeySigner } from './useSessionKey';

export interface TipTransaction {
    id: string;
    amount: string;
    timestamp: number;
    recipient: string;
    status: 'pending' | 'confirmed' | 'failed';
}

export interface ChannelState {
    isOpen: boolean;
    balance: string;
    channelId: string | null;
    recipient: string | null;
    history: TipTransaction[];
}

interface UseYellowChannelReturn {
    connectionStatus: ConnectionStatus;
    channelState: ChannelState;
    isConnecting: boolean;
    error: string | null;
    connect: () => Promise<void>;
    disconnect: () => void;
    openChannel: (recipientAddress: string, depositAmount: string) => Promise<void>;
    sendTip: (amount: string) => Promise<void>;
    closeChannel: () => Promise<void>;
}

const INITIAL_CHANNEL_STATE: ChannelState = {
    isOpen: false,
    balance: '0',
    channelId: null,
    recipient: null,
    history: [],
};

/**
 * React hook for managing Yellow Network state channels
 * Provides gasless off-chain tipping functionality
 */
export function useYellowChannel(contractAddress: string): UseYellowChannelReturn {
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [channelState, setChannelState] = useState<ChannelState>(INITIAL_CHANNEL_STATE);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Connect to Yellow Network
     */
    const connect = useCallback(async () => {
        setIsConnecting(true);
        setError(null);

        try {
            await yellowNetwork.connectToYellow();
            setConnectionStatus(yellowNetwork.getConnectionStatus());
            console.log('✅ Connected to Yellow Network');
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to connect to Yellow Network';
            setError(errorMsg);
            console.error('Yellow Network connection error:', err);
            setConnectionStatus('disconnected');
        } finally {
            setIsConnecting(false);
        }
    }, []);

    /**
     * Disconnect from Yellow Network
     */
    const disconnect = useCallback(() => {
        yellowNetwork.disconnectFromYellow();
        setConnectionStatus('disconnected');
        setChannelState(INITIAL_CHANNEL_STATE);
        console.log('Disconnected from Yellow Network');
    }, []);

    /**
     * Open a state channel with a recipient
     */
    const openChannel = useCallback(
        async (recipientAddress: string, depositAmount: string) => {
            if (!yellowNetwork.isConnected()) {
                setError('Not connected to Yellow Network');
                return;
            }

            setError(null);

            try {
                console.log('Opening channel:', { recipientAddress, depositAmount });

                // Get session key signer
                const signer = getSessionKeySigner(contractAddress);
                if (!signer) {
                    throw new Error('No active session key. Please start a session first.');
                }

                console.log('Using session key:', signer.address);


                // TODO: Yellow Network MessageSigner type is incompatible with ethers.Wallet
                // We need to create the message manually or use a compatible signer wrapper
                // For now, create a simplified Yellow Network RPC message

                console.log('Creating Yellow Network channel message...');
                const channelMessage = {
                    jsonrpc: '2.0',
                    method: 'channel_open',
                    params: {
                        participants: [signer.address, recipientAddress],
                        deposit: depositAmount,
                        appAddress: contractAddress,
                    },
                    id: Date.now(),
                };

                // Sign the message hash
                const messageHash = JSON.stringify(channelMessage);
                const signature = await signer.signMessage(messageHash);

                const signedMessage = {
                    ...channelMessage,
                    signature,
                };

                console.log('Sending channel message to Yellow Network...');
                yellowNetwork.sendMessage(signedMessage);


                // Update local state optimistically
                const newChannelState: ChannelState = {
                    isOpen: true,
                    balance: depositAmount,
                    channelId: `channel_${Date.now()}`, // Temp ID, will be updated by network response
                    recipient: recipientAddress,
                    history: [],
                };

                setChannelState(newChannelState);
                console.log('✅ Channel opened successfully');
            } catch (err: any) {
                const errorMsg = err.message || 'Failed to open channel';
                setError(errorMsg);
                console.error('Channel opening error:', err);
            }
        },
        [contractAddress]
    );

    /**
     * Send an off-chain tip (instant, gasless)
     */
    const sendTip = useCallback(async (amount: string) => {
        if (!channelState.isOpen || !channelState.recipient) {
            setError('Channel is not open');
            return;
        }

        setError(null);

        try {
            console.log('Sending tip:', amount);

            // Get session key signer
            const signer = getSessionKeySigner(contractAddress);
            if (!signer) {
                throw new Error('No active session key');
            }

            // Create payment message (off-chain state update)
            // TODO: Implement proper Yellow Network payment message format
            const paymentMessage = {
                type: 'payment',
                channelId: channelState.channelId,
                from: signer.address,
                to: channelState.recipient,
                amount: amount,
                timestamp: Date.now(),
            };

            // Sign the payment with session key
            const messageStr = JSON.stringify(paymentMessage);
            const signature = await signer.signMessage(messageStr);

            const signedPayment = {
                ...paymentMessage,
                signature,
            };

            console.log('Sending payment message...');
            yellowNetwork.sendMessage(signedPayment);

            // Update local balance instantly (off-chain)
            const currentBalance = parseFloat(channelState.balance);
            const tipAmount = parseFloat(amount);
            const newBalance = (currentBalance - tipAmount).toFixed(2);

            // Add to transaction history
            const newTip: TipTransaction = {
                id: `tip_${Date.now()}`,
                amount: amount,
                timestamp: Date.now(),
                recipient: channelState.recipient,
                status: 'confirmed', // Instant confirmation for off-chain
            };

            setChannelState(prev => ({
                ...prev,
                balance: newBalance,
                history: [newTip, ...prev.history],
            }));

            console.log('✅ Tip sent instantly!');
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to send tip';
            setError(errorMsg);
            console.error('Tip sending error:', err);
        }
    }, [channelState, contractAddress]);

    /**
     * Close the channel and settle on-chain
     */
    const closeChannel = useCallback(async () => {
        if (!channelState.isOpen) {
            setError('No open channel to close');
            return;
        }

        setError(null);

        try {
            console.log('Closing channel:', channelState.channelId);

            // Get session key signer
            const signer = getSessionKeySigner(contractAddress);
            if (!signer) {
                throw new Error('No active session key');
            }

            // Create channel close message
            // TODO: Implement proper Yellow Network close/settlement format
            const closeMessage = {
                type: 'close_channel',
                channelId: channelState.channelId,
                finalBalance: channelState.balance,
                timestamp: Date.now(),
            };

            // Sign with session key
            const messageStr = JSON.stringify(closeMessage);
            const signature = await signer.signMessage(messageStr);

            const signedClose = {
                ...closeMessage,
                signature,
            };

            console.log('Sending close message...');
            yellowNetwork.sendMessage(signedClose);

            // Clear channel state
            setChannelState(INITIAL_CHANNEL_STATE);
            console.log('✅ Channel closed and settled');
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to close channel';
            setError(errorMsg);
            console.error('Channel closing error:', err);
        }
    }, [channelState, contractAddress]);

    /**
     * Listen for Yellow Network messages
     */
    useEffect(() => {
        const unsubscribe = yellowNetwork.onMessage((message) => {
            console.log('Received Yellow Network message:', message);

            // TODO: Handle different message types from Yellow Network
            // - Channel opened confirmation
            // - Payment confirmations
            // - Channel close confirmations
            // Update channelState accordingly based on message type
        });

        return unsubscribe;
    }, []);

    /**
     * Update connection status periodically
     */
    useEffect(() => {
        const interval = setInterval(() => {
            const currentStatus = yellowNetwork.getConnectionStatus();
            if (currentStatus !== connectionStatus) {
                setConnectionStatus(currentStatus);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [connectionStatus]);

    return {
        connectionStatus,
        channelState,
        isConnecting,
        error,
        connect,
        disconnect,
        openChannel,
        sendTip,
        closeChannel,
    };
}
