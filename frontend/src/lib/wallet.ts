import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { FHEVM_CONFIG } from './fhevm';

// Define the Sepolia testnet (correct for FHEVM)
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

// RainbowKit configuration
export const wagmiConfig = getDefaultConfig({
  appName: 'Hello FHEVM Tutorial',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  chains: [sepoliaTestnet, sepolia, mainnet],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

// Wallet connection utilities
export const SUPPORTED_CHAINS = [sepoliaTestnet, sepolia];

export const isChainSupported = (chainId: number): boolean => {
  return SUPPORTED_CHAINS.some(chain => chain.id === chainId);
};

export const getChainName = (chainId: number): string => {
  const chain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  return chain?.name || 'Unknown Chain';
};

export const getExplorerUrl = (chainId: number, txHash: string): string => {
  const chain = SUPPORTED_CHAINS.find(chain => chain.id === chainId);
  return chain?.blockExplorers.default.url + `/tx/${txHash}` || '#';
};