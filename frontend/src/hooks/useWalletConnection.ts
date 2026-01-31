import { useState, useEffect, useCallback } from 'react';
import { createStore, type EIP1193Provider } from 'mipd';

// LocalStorage keys
const STORAGE_KEYS = {
    CONNECTED_ADDRESS: 'oneRecurr_connectedAddress',
    SELECTED_WALLET_UUID: 'oneRecurr_selectedWalletUuid',
};

export interface WalletInfo {
    uuid: string;
    name: string;
    icon?: string;
    rdns: string;
    provider: EIP1193Provider;
}

export function useWalletConnection() {
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Detect available wallets using EIP-6963
    useEffect(() => {
        const store = createStore();

        const updateWallets = () => {
            const detectedWallets = store.getProviders();

            if (!detectedWallets) {
                setWallets([]);
                return;
            }

            // Convert Map to array of entries
            const walletList: WalletInfo[] = [];
            detectedWallets.forEach((provider, uuid) => {
                walletList.push({
                    uuid: String(uuid),
                    name: provider.info.name,
                    icon: provider.info.icon,
                    rdns: provider.info.rdns,
                    provider: provider.provider,
                });
            });

            setWallets(walletList);
            console.log('Detected wallets:', walletList.map(w => w.name));
        };

        // Initial detection
        updateWallets();

        // Listen for new wallets being announced
        const unsubscribe = store.subscribe(updateWallets);

        return () => {
            unsubscribe();
        };
    }, []);

    // Auto-reconnect on mount if wallet was previously connected
    useEffect(() => {
        const attemptAutoReconnect = async () => {
            const savedAddress = localStorage.getItem(STORAGE_KEYS.CONNECTED_ADDRESS);
            const savedWalletUuid = localStorage.getItem(STORAGE_KEYS.SELECTED_WALLET_UUID);

            if (!savedAddress || !savedWalletUuid || wallets.length === 0) {
                return;
            }

            console.log('Attempting auto-reconnect to wallet:', savedWalletUuid);

            // Find the previously connected wallet
            const wallet = wallets.find(w => w.uuid === savedWalletUuid);
            if (!wallet) {
                console.log('Previously connected wallet not found, clearing storage');
                localStorage.removeItem(STORAGE_KEYS.CONNECTED_ADDRESS);
                localStorage.removeItem(STORAGE_KEYS.SELECTED_WALLET_UUID);
                return;
            }

            try {
                // Use eth_accounts instead of eth_requestAccounts to avoid popup
                const accounts = await wallet.provider.request({
                    method: 'eth_accounts',
                }) as string[];

                if (accounts && accounts.length > 0) {
                    setSelectedWallet(wallet);
                    setConnectedAddress(accounts[0]);
                    console.log('Auto-reconnected to', wallet.name, ':', accounts[0]);
                } else {
                    console.log('No accounts available, clearing storage');
                    localStorage.removeItem(STORAGE_KEYS.CONNECTED_ADDRESS);
                    localStorage.removeItem(STORAGE_KEYS.SELECTED_WALLET_UUID);
                }
            } catch (err) {
                console.error('Auto-reconnect failed:', err);
                localStorage.removeItem(STORAGE_KEYS.CONNECTED_ADDRESS);
                localStorage.removeItem(STORAGE_KEYS.SELECTED_WALLET_UUID);
            }
        };

        attemptAutoReconnect();
    }, [wallets]);

    // Connect to a specific wallet
    const connect = useCallback(async (wallet?: WalletInfo) => {
        setIsConnecting(true);
        setError(null);

        try {
            let targetWallet = wallet;

            // If no wallet specified, try to find Ambire or use first available
            if (!targetWallet) {
                console.log('No specific wallet requested. Searching for Ambire or falling back to first available...');
                console.log('Available wallets:', wallets.map(w => w.name));

                const ambire = wallets.find(w =>
                    w.name.toLowerCase().includes('ambire') ||
                    w.rdns.includes('ambire')
                );

                targetWallet = ambire || wallets[0];

                if (targetWallet) {
                    console.log(`Selected wallet: ${targetWallet.name} (${targetWallet.rdns})`);
                } else {
                    console.log('No wallets found in detected list.');
                }
            }

            if (!targetWallet) {
                throw new Error('No wallet available. Please install Ambire Wallet or another Web3 wallet.');
            }

            // Request accounts from the wallet
            const accounts = await targetWallet.provider.request({
                method: 'eth_requestAccounts',
            }) as string[];

            if (accounts && accounts.length > 0) {
                setSelectedWallet(targetWallet);
                setConnectedAddress(accounts[0]);

                // Save to localStorage for persistence
                localStorage.setItem(STORAGE_KEYS.CONNECTED_ADDRESS, accounts[0]);
                localStorage.setItem(STORAGE_KEYS.SELECTED_WALLET_UUID, targetWallet.uuid);

                console.log('Connected to', targetWallet.name, ':', accounts[0]);
                return accounts[0];
            } else {
                throw new Error('No accounts returned from wallet');
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to connect wallet';
            setError(errorMessage);
            console.error('Wallet connection error:', err);
            throw err;
        } finally {
            setIsConnecting(false);
        }
    }, [wallets]);

    // Disconnect wallet
    const disconnect = useCallback(() => {
        setSelectedWallet(null);
        setConnectedAddress(null);
        setError(null);

        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.CONNECTED_ADDRESS);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_WALLET_UUID);

        console.log('Wallet disconnected');
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (!selectedWallet) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else {
                setConnectedAddress(accounts[0]);
                console.log('Account changed to:', accounts[0]);
            }
        };

        const handleChainChanged = () => {
            // Reload page on chain change (recommended by MetaMask)
            window.location.reload();
        };

        const handleDisconnect = () => {
            disconnect();
        };

        // Add event listeners
        selectedWallet.provider.on?.('accountsChanged', handleAccountsChanged);
        selectedWallet.provider.on?.('chainChanged', handleChainChanged);
        selectedWallet.provider.on?.('disconnect', handleDisconnect);

        return () => {
            // Clean up listeners
            selectedWallet.provider.removeListener?.('accountsChanged', handleAccountsChanged);
            selectedWallet.provider.removeListener?.('chainChanged', handleChainChanged);
            selectedWallet.provider.removeListener?.('disconnect', handleDisconnect);
        };
    }, [selectedWallet, disconnect]);

    // Get current chain ID
    const getChainId = useCallback(async (): Promise<string | null> => {
        if (!selectedWallet) return null;

        try {
            const chainId = await selectedWallet.provider.request({
                method: 'eth_chainId',
            }) as string;
            return chainId;
        } catch (err) {
            console.error('Failed to get chain ID:', err);
            return null;
        }
    }, [selectedWallet]);

    // Get provider for signing transactions
    const getProvider = useCallback((): EIP1193Provider | null => {
        return selectedWallet?.provider || null;
    }, [selectedWallet]);

    return {
        wallets,
        selectedWallet,
        connectedAddress,
        isConnecting,
        error,
        connect,
        disconnect,
        getChainId,
        getProvider,
    };
}
