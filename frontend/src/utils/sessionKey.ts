import { ethers } from 'ethers';
import { type Address, type Hex } from 'viem';

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
 * This allows an EOA to temporarily delegate transaction signing to a contract
 */
export interface EIP7702Authorization {
    chainId: bigint;
    address: Address;  // The contract address to authorize (delegation target)
    nonce: bigint;
    r?: Hex;
    s?: Hex;
    yParity?: number;
}

/**
 * Request EIP-7702 authorization signature from wallet using Viem
 * This will prompt the user to sign the authorization in their Ambire Wallet
 * 
 * @param provider - The EIP-1193 provider from wallet
 * @param userAddress - The connected user's address
 * @param chainId - The chain ID (must be number for Viem)
 * @param contract Address - The contract to authorize
 * @param nonce - Current nonce
 */
export async function requestAuthorizationSignature(
    provider: any,
    userAddress: string,
    chainId: number,
    contractAddress: string,
    nonce: number
): Promise<EIP7702Authorization> {
    try {
        console.log('Creating EIP-7702 authorization...');
        console.log('Contract to authorize:', contractAddress);
        console.log('Chain ID:', chainId);
        console.log('Nonce:', nonce);
        console.log('User address:', userAddress);

        // Try direct RPC call for EIP-7702 authorization first
        // This is experimental and may not be supported by all wallets yet
        try {
            console.log('Attempting wallet_signAuthorization (EIP-7702)...');

            const authorizationParams = {
                chainId: `0x${chainId.toString(16)}`,
                address: contractAddress,
                nonce: `0x${nonce.toString(16)}`,
            };

            const authResult = await provider.request({
                method: 'wallet_signAuthorization',
                params: [authorizationParams],
            });

            console.log('EIP-7702 authorization signed successfully:', authResult);

            return {
                chainId: BigInt(chainId),
                address: contractAddress as Address,
                nonce: BigInt(nonce),
                r: authResult.r as Hex,
                s: authResult.s as Hex,
                yParity: authResult.yParity || (authResult.v === 27 ? 0 : 1),
            };
        } catch (rpcError: any) {
            console.log('Direct EIP-7702 RPC not supported:', rpcError.message);
            console.log('Falling back to EIP-712 signature...');
        }

        // Fallback: Use eth_signTypedData_v4 (EIP-712)
        // This provides cryptographic proof of user consent
        // Note: This is a demo/PoC approach until EIP-7702 has wider wallet support
        console.log('Using EIP-712 typed data signature as authorization proof');

        // Proper EIP-712 structure with EIP712Domain type definition
        const typedData = {
            types: {
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                ],
                Authorization: [
                    { name: 'contract', type: 'address' },
                    { name: 'nonce', type: 'uint256' },
                ],
            },
            primaryType: 'Authorization',
            domain: {
                name: 'One Recurr Session Authorization',
                version: '1',
                chainId: chainId,
            },
            message: {
                contract: contractAddress,
                nonce: nonce,
            },
        };

        // Custom replacer to handle any BigInt values (defensive)
        const bigIntReplacer = (_key: string, value: any) => {
            return typeof value === 'bigint' ? value.toString() : value;
        };

        const signature = await provider.request({
            method: 'eth_signTypedData_v4',
            params: [userAddress, JSON.stringify(typedData, bigIntReplacer)],
        }) as Hex;

        // Parse signature components
        const r = ('0x' + signature.slice(2, 66)) as Hex;
        const s = ('0x' + signature.slice(66, 130)) as Hex;
        const v = parseInt(signature.slice(130, 132), 16);

        console.log('EIP-712 signature received and parsed successfully');

        return {
            chainId: BigInt(chainId),
            address: contractAddress as Address,
            nonce: BigInt(nonce),
            r,
            s,
            yParity: v === 27 ? 0 : 1,
        };
    } catch (error: any) {
        console.error('Failed to get authorization signature:', error);

        // Provide more helpful error messages
        if (error.message?.includes('reject')) {
            throw new Error('User rejected the authorization request');
        } else if (error.code === 4001) {
            throw new Error('User rejected the authorization request');
        } else {
            throw new Error(`Authorization failed: ${error.message || 'Unknown error'}. Please ensure you're using the latest Ambire Wallet.`);
        }
    }
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
