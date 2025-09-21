/**
 * @fileoverview Wallet configuration and chain utilities for FHEVM dApp
 *
 * This module configures wallet connectivity using RainbowKit and wagmi,
 * defines supported blockchain networks, and provides utilities for
 * chain validation and blockchain explorer integration.
 *
 * @author Starfish
 * @version 1.0.0
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { FHEVM_CONFIG } from './fhevm';

/**
 * Sepolia testnet configuration optimized for FHEVM operations.
 *
 * This chain configuration uses the custom RPC endpoint for FHEVM
 * and includes proper block explorer settings for transaction verification.
 *
 * @constant {Chain} sepoliaTestnet
 */
export const sepoliaTestnet = {
  id: 11155111,
  name: 'Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [FHEVM_CONFIG.network],
    },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
} as const;

/**
 * RainbowKit and wagmi configuration for the FHEVM dApp.
 *
 * This configuration enables wallet connectivity with support for multiple
 * Ethereum networks including the FHEVM-compatible Sepolia testnet.
 *
 * @constant {Config} wagmiConfig
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'Hello FHEVM Tutorial',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [sepoliaTestnet, sepolia, mainnet],
  ssr: true, // Enable server-side rendering support
});

/**
 * List of blockchain networks supported by the FHEVM dApp.
 *
 * @constant {Chain[]} SUPPORTED_CHAINS
 */
export const SUPPORTED_CHAINS = [sepoliaTestnet, sepolia];

/**
 * Checks if a given chain ID is supported by the application.
 *
 * @param chainId - The blockchain network chain ID to check
 * @returns True if the chain is supported, false otherwise
 *
 * @example
 * ```typescript
 * if (isChainSupported(11155111)) {
 *   console.log('Sepolia is supported!');
 * }
 * ```
 */
export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAINS.some(chain => chain.id === chainId);
};

/**
 * Gets the human-readable name for a given chain ID.
 *
 * @param chainId - The blockchain network chain ID
 * @returns The chain name or 'Unknown Chain' if not found
 *
 * @example
 * ```typescript
 * const name = getChainName(11155111); // 'Sepolia Testnet'
 * ```
 */
export const getChainName = (chainId: number): string => {
  const chain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  return chain?.name || 'Unknown Chain';
};

/**
 * Generates a block explorer URL for a transaction hash on a specific chain.
 *
 * @param chainId - The blockchain network chain ID
 * @param txHash - The transaction hash to link to
 * @returns Full URL to view the transaction in a block explorer
 *
 * @example
 * ```typescript
 * const url = getExplorerUrl(11155111, '0xabc123...');
 * // Returns: 'https://sepolia.etherscan.io/tx/0xabc123...'
 * ```
 */
export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const chain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  return chain?.blockExplorers.default.url + `/tx/${txHash}` || '#';
};