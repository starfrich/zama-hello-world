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
    chains: [sepoliaTestnet],
    ssr: true, // Enable server-side rendering support
  });