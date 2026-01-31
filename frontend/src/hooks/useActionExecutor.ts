import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import ActionExecutorABI from '../contracts/abis/ActionExecutor.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_ACTION_EXECUTOR_ADDRESS || '0x29e26275177A5DD5cc92bE0dF2700D1BE2F9D6BE';

export function useActionExecutor() {
    const { getProvider, connectedAddress } = useWallet();

    const [actionCount, setActionCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    // Get the contract instance
    const getContract = useCallback((): ethers.Contract | null => {
        const provider = getProvider();
        if (!provider) return null;

        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ActionExecutorABI.abi,
                ethersProvider
            );
            return contract;
        } catch (err) {
            console.error('Failed to create contract instance:', err);
            return null;
        }
    }, [getProvider]);

    // Read current action count
    const readActionCount = useCallback(async () => {
        const contract = getContract();
        if (!contract) {
            setError('Contract not available');
            return;
        }

        try {
            const count = await contract.actionCount();
            setActionCount(Number(count));
            setError(null);
        } catch (err: any) {
            console.error('Failed to read action count:', err);
            setError('Failed to read action count');
        }
    }, [getContract]);

    // Perform action (write transaction)
    const performAction = useCallback(async (): Promise<boolean> => {
        if (!connectedAddress) {
            setError('Please connect your wallet');
            return false;
        }

        const provider = getProvider();
        if (!provider) {
            setError('Provider not available');
            return false;
        }

        setIsLoading(true);
        setError(null);
        setTxHash(null);

        try {
            const ethersProvider = new ethers.BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ActionExecutorABI.abi,
                signer
            );

            console.log('Calling performAction...');
            const tx = await contract.performAction();
            console.log('Transaction sent:', tx.hash);
            setTxHash(tx.hash);

            console.log('Waiting for confirmation...');
            const receipt = await tx.wait();
            console.log('Transaction confirmed:', receipt);

            // Read updated count
            await readActionCount();

            return true;
        } catch (err: any) {
            console.error('Failed to perform action:', err);
            const errorMessage = err.reason || err.message || 'Failed to perform action';
            setError(errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [connectedAddress, getProvider, readActionCount]);

    // Auto-read action count when wallet connects
    useEffect(() => {
        if (connectedAddress) {
            readActionCount();
        }
    }, [connectedAddress, readActionCount]);

    return {
        actionCount,
        isLoading,
        error,
        txHash,
        performAction,
        readActionCount,
        contractAddress: CONTRACT_ADDRESS,
    };
}
