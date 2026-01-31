import { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import {
    generateSessionKey,
    requestAuthorizationSignature,
    getNonce,
    isSessionKeyValid,
    type EIP7702Authorization,
} from '../utils/sessionKey';

interface SessionKeyState {
    sessionKey: ethers.Wallet | null;
    authorization: EIP7702Authorization | null;
    createdAt: number | null;
    isActive: boolean;
}

const SESSION_EXPIRY_MS = 3600000; // 1 hour

// Helper functions for localStorage
const getSessionStorageKey = (contractAddress: string, key: string) =>
    `oneRecurr_${key}_${contractAddress}`;

const saveSessionToLocalStorage = (
    contractAddress: string,
    sessionKey: ethers.Wallet,
    authorization: EIP7702Authorization,
    createdAt: number
) => {
    try {
        const sessionKeyKey = getSessionStorageKey(contractAddress, 'sessionKey');
        const authorizationKey = getSessionStorageKey(contractAddress, 'authorization');
        const createdAtKey = getSessionStorageKey(contractAddress, 'createdAt');

        console.log('💾 Saving session to localStorage:', {
            contractAddress,
            sessionAddress: sessionKey.address,
            createdAt: new Date(createdAt).toLocaleString(),
            keys: { sessionKeyKey, authorizationKey, createdAtKey }
        });

        // Custom replacer to handle BigInt serialization
        const bigIntReplacer = (_key: string, value: any) => {
            return typeof value === 'bigint' ? value.toString() : value;
        };

        localStorage.setItem(sessionKeyKey, sessionKey.privateKey);
        localStorage.setItem(authorizationKey, JSON.stringify(authorization, bigIntReplacer));
        localStorage.setItem(createdAtKey, createdAt.toString());

        console.log('✅ Session saved successfully to localStorage');

        // Verify save worked
        const verification = {
            sessionKey: !!localStorage.getItem(sessionKeyKey),
            authorization: !!localStorage.getItem(authorizationKey),
            createdAt: !!localStorage.getItem(createdAtKey)
        };
        console.log('Verification:', verification);
    } catch (err) {
        console.error('❌ Failed to save session to localStorage:', err);
    }
};

const loadSessionFromLocalStorage = (
    contractAddress: string
): SessionKeyState | null => {
    try {
        const privateKey = localStorage.getItem(
            getSessionStorageKey(contractAddress, 'sessionKey')
        );
        const authorizationJson = localStorage.getItem(
            getSessionStorageKey(contractAddress, 'authorization')
        );
        const createdAtStr = localStorage.getItem(
            getSessionStorageKey(contractAddress, 'createdAt')
        );

        if (!privateKey || !authorizationJson || !createdAtStr) {
            return null;
        }

        const createdAt = parseInt(createdAtStr, 10);

        // Check if session is expired
        if (!isSessionKeyValid(createdAt, SESSION_EXPIRY_MS)) {
            console.log('Stored session is expired, clearing...');
            clearSessionFromLocalStorage(contractAddress);
            return null;
        }

        const sessionKey = new ethers.Wallet(privateKey);
        const authorization = JSON.parse(authorizationJson);

        // Convert string values back to BigInt
        authorization.chainId = BigInt(authorization.chainId);
        authorization.nonce = BigInt(authorization.nonce);

        console.log('Session restored from localStorage');

        return {
            sessionKey,
            authorization,
            createdAt,
            isActive: true,
        };
    } catch (err) {
        console.error('Failed to load session from localStorage:', err);
        clearSessionFromLocalStorage(contractAddress);
        return null;
    }
};

const clearSessionFromLocalStorage = (contractAddress: string) => {
    try {
        localStorage.removeItem(getSessionStorageKey(contractAddress, 'sessionKey'));
        localStorage.removeItem(getSessionStorageKey(contractAddress, 'authorization'));
        localStorage.removeItem(getSessionStorageKey(contractAddress, 'createdAt'));
        console.log('Session cleared from localStorage');
    } catch (err) {
        console.error('Failed to clear session from localStorage:', err);
    }
};

export function useSessionKey(contractAddress: string) {
    const { connectedAddress, getProvider, getChainId } = useWallet();

    const [sessionState, setSessionState] = useState<SessionKeyState>({
        sessionKey: null,
        authorization: null,
        createdAt: null,
        isActive: false,
    });
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-clear expired session keys
    useEffect(() => {
        if (!sessionState.createdAt || !sessionState.isActive) return;

        const interval = setInterval(() => {
            if (!isSessionKeyValid(sessionState.createdAt!, SESSION_EXPIRY_MS)) {
                console.log('Session key expired, clearing...');
                clearSession();
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [sessionState.createdAt, sessionState.isActive]);

    // Restore session from localStorage on mount
    // Using a ref to track if we've already attempted restoration
    const hasAttemptedRestore = useRef(false);

    useEffect(() => {
        // Only attempt restore once when wallet first connects
        if (!connectedAddress || hasAttemptedRestore.current) {
            return;
        }

        console.log('Attempting to restore session from localStorage...');
        hasAttemptedRestore.current = true;

        const restoredSession = loadSessionFromLocalStorage(contractAddress);
        if (restoredSession) {
            console.log('✅ Session restored successfully:', {
                address: restoredSession.sessionKey?.address,
                createdAt: new Date(restoredSession.createdAt!).toLocaleString(),
                isActive: restoredSession.isActive
            });
            setSessionState(restoredSession);
        } else {
            console.log('ℹ️ No valid session found in localStorage');
        }
    }, [connectedAddress, contractAddress]);

    // Reset restore flag when wallet disconnects
    useEffect(() => {
        if (!connectedAddress) {
            hasAttemptedRestore.current = false;
        }
    }, [connectedAddress]);

    // Create a new session key and request authorization
    const createSession = useCallback(async () => {
        if (!connectedAddress) {
            setError('Please connect your wallet first');
            return null;
        }

        setIsCreating(true);
        setError(null);

        try {
            const provider = getProvider();
            if (!provider) {
                throw new Error('No provider available');
            }

            // Get chain ID
            const chainIdHex = await getChainId();
            if (!chainIdHex) {
                throw new Error('Failed to get chain ID');
            }
            const chainId = parseInt(chainIdHex, 16);

            // Generate ephemeral session key
            console.log('Generating session key...');
            const sessionKey = generateSessionKey();
            console.log('Session key generated:', sessionKey.address);

            // Get current nonce
            console.log('Getting nonce for', connectedAddress);
            const nonce = await getNonce(provider, connectedAddress);
            console.log('Current nonce:', nonce);

            // Request EIP-7702 authorization signature from user
            console.log('Requesting authorization signature...');
            const authorization = await requestAuthorizationSignature(
                provider,
                connectedAddress,
                chainId,
                contractAddress,
                nonce
            );
            console.log('Authorization received:', authorization);

            // Store session key and authorization in state (memory only!)
            const newState: SessionKeyState = {
                sessionKey,
                authorization,
                createdAt: Date.now(),
                isActive: true,
            };

            setSessionState(newState);
            console.log('Session key created successfully');

            // Save to localStorage
            saveSessionToLocalStorage(
                contractAddress,
                sessionKey,
                authorization,
                newState.createdAt!
            );

            return sessionKey;
        } catch (err: any) {
            const errorMessage = err.message || 'Failed to create session key';
            setError(errorMessage);
            console.error('Session key creation error:', err);
            return null;
        } finally {
            setIsCreating(false);
        }
    }, [connectedAddress, contractAddress, getProvider, getChainId]);

    // Clear the session key
    const clearSession = useCallback(() => {
        setSessionState({
            sessionKey: null,
            authorization: null,
            createdAt: null,
            isActive: false,
        });
        setError(null);

        // Clear from localStorage
        clearSessionFromLocalStorage(contractAddress);

        console.log('Session cleared');
    }, [contractAddress]);

    // Sign a message with the session key
    const signWithSessionKey = useCallback(
        async (message: string): Promise<string | null> => {
            if (!sessionState.sessionKey || !sessionState.isActive) {
                setError('No active session key');
                return null;
            }

            try {
                const signature = await sessionState.sessionKey.signMessage(message);
                return signature;
            } catch (err: any) {
                setError('Failed to sign message');
                console.error('Signing error:', err);
                return null;
            }
        },
        [sessionState.sessionKey, sessionState.isActive]
    );

    // Sign a transaction with the session key
    const signTransactionWithSessionKey = useCallback(
        async (transaction: ethers.TransactionRequest): Promise<string | null> => {
            if (!sessionState.sessionKey || !sessionState.isActive) {
                setError('No active session key');
                return null;
            }

            try {
                const signedTx = await sessionState.sessionKey.signTransaction(transaction);
                return signedTx;
            } catch (err: any) {
                setError('Failed to sign transaction');
                console.error('Transaction signing error:', err);
                return null;
            }
        },
        [sessionState.sessionKey, sessionState.isActive]
    );

    // Auto-clear session when wallet disconnects
    useEffect(() => {
        if (!connectedAddress && sessionState.isActive) {
            console.log('Wallet disconnected, clearing session...');
            clearSession();
        }
    }, [connectedAddress, sessionState.isActive, clearSession]);

    // Check if session is still valid
    const isSessionValid = useCallback((): boolean => {
        if (!sessionState.createdAt || !sessionState.isActive) return false;
        return isSessionKeyValid(sessionState.createdAt, SESSION_EXPIRY_MS);
    }, [sessionState.createdAt, sessionState.isActive]);

    return {
        sessionKey: sessionState.sessionKey,
        sessionAddress: sessionState.sessionKey?.address || null,
        authorization: sessionState.authorization,
        isActive: sessionState.isActive && isSessionValid(),
        isCreating,
        error,
        createdAt: sessionState.createdAt,
        expiresAt: sessionState.createdAt ? sessionState.createdAt + SESSION_EXPIRY_MS : null,
        createSession,
        clearSession,
        signWithSessionKey,
        signTransactionWithSessionKey,
    };
}
