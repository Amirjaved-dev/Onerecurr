import { ethers } from 'ethers';

/**
 * Generate a new ephemeral session key pair
 * This key will be used to sign transactions during the session
 * IMPORTANT: Keys are stored in memory only for security
 */
export function generateSessionKey(): ethers.Wallet {
    return ethers.Wallet.createRandom();
}

/**
 * EIP-7702 Authorization structure
 * This allows an EOA to temporarily delegate transaction signing to a session key
 */
export interface EIP7702Authorization {
    chainId: bigint;
    address: string;  // The contract address to authorize (e.g., ActionExecutor)
    nonce: bigint;
    signature?: string;
}

/**
 * Construct EIP-7702 typed data for signing
 * This creates the structured data that Ambire Wallet will prompt the user to sign
 * 
 * @param chainId - The chain ID (e.g., 11155111 for Sepolia)
 * @param contractAddress - The contract to authorize (e.g., ActionExecutor address)
 * @param sessionKeyAddress - The ephemeral session key's address
 * @param nonce - The current nonce for the EOA account
 */
export function constructEIP7702TypedData(
    chainId: number,
    contractAddress: string,
    sessionKeyAddress: string,
    nonce: number
) {
    // EIP-712 domain for EIP-7702
    const domain = {
        name: 'EIP-7702 Authorization',
        version: '1',
        chainId: chainId,
    };

    // EIP-7702 authorization types
    const types = {
        Authorization: [
            { name: 'chainId', type: 'uint256' },
            { name: 'address', type: 'address' },
            { name: 'nonce', type: 'uint64' },
        ],
    };

    // Authorization message
    const value = {
        chainId: BigInt(chainId),
        address: contractAddress,  // Contract to authorize
        nonce: BigInt(nonce),
    };

    return {
        domain,
        types,
        value,
        primaryType: 'Authorization' as const,
    };
}

/**
 * Request EIP-7702 authorization signature from wallet
 * This will prompt the user to sign the authorization in their Ambire Wallet
 * 
 * @param provider - The EIP-1193 provider from wallet
 * @param userAddress - The connected user's address
 * @param chainId - The chain ID
 * @param contractAddress - The contract to authorize
 * @param nonce - Current nonce
 */
export async function requestAuthorizationSignature(
    provider: any,
    userAddress: string,
    chainId: number,
    contractAddress: string,
    nonce: number
): Promise<string> {
    const typedData = constructEIP7702TypedData(
        chainId,
        contractAddress,
        userAddress,
        nonce
    );

    try {
        // Request signature using eth_signTypedData_v4
        const signature = await provider.request({
            method: 'eth_signTypedData_v4',
            params: [
                userAddress,
                JSON.stringify({
                    domain: typedData.domain,
                    types: typedData.types,
                    primaryType: typedData.primaryType,
                    message: typedData.value,
                }),
            ],
        });

        return signature;
    } catch (error) {
        console.error('Failed to get authorization signature:', error);
        throw new Error('User rejected authorization or wallet does not support EIP-712');
    }
}

/**
 * Format authorization for EIP-7702 transaction
 * This prepares the authorization data to be included in a transaction
 */
export function formatAuthorizationForTransaction(
    authorization: EIP7702Authorization
): string {
    // Format: chainId (32 bytes) + address (20 bytes) + nonce (8 bytes) + signature (65 bytes)
    const chainIdHex = authorization.chainId.toString(16).padStart(64, '0');
    const addressHex = authorization.address.replace('0x', '').padStart(40, '0');
    const nonceHex = authorization.nonce.toString(16).padStart(16, '0');
    const signatureHex = authorization.signature?.replace('0x', '') || '';

    return '0x' + chainIdHex + addressHex + nonceHex + signatureHex;
}

/**
 * Get the current nonce for an address
 */
export async function getNonce(
    provider: any,
    address: string
): Promise<number> {
    try {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const nonce = await ethersProvider.getTransactionCount(address);
        return nonce;
    } catch (error) {
        console.error('Failed to get nonce:', error);
        return 0;
    }
}

/**
 * Validate that a session key is still valid
 * Session keys should be ephemeral and expire
 */
export function isSessionKeyValid(
    createdAt: number,
    expiryDurationMs: number = 3600000 // Default: 1 hour
): boolean {
    const now = Date.now();
    return now - createdAt < expiryDurationMs;
}
