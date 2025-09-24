# Frontend Integration with FHEVM

Building user interfaces for FHEVM applications requires handling encrypted data on the client side. This tutorial covers everything you need to create a modern, responsive frontend that seamlessly works with encrypted smart contracts.

## 🎯 What You'll Learn

- Setting up FHEVM client-side encryption
- Building React components for encrypted data
- Wallet integration with RainbowKit and Wagmi
- State management for encrypted operations
- Error handling and user experience patterns
- Event listening and real-time updates

## 🛠️ Tech Stack Overview

Our frontend uses modern tools optimized for FHEVM development:

```typescript
// Core framework
Next.js 15 + App Router + TypeScript

// Styling and UI
Tailwind CSS + shadcn/ui components

// Web3 integration
RainbowKit + Wagmi + Viem

// FHEVM encryption
@zama-fhe/relayer-sdk/web

// State management
Built-in React hooks with optimizations

// Notifications
Sonner toast system

// Icons
Lucide React
```

## 🔧 Project Structure Deep Dive

```
frontend/
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── fhevm/
│   │   │   └── Counter.tsx
│   │   ├── ui/
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── sonner.tsx
│   │   │   └── textarea.tsx
│   │   ├── client-wrapper.tsx
│   │   └── providers.tsx
│   │
│   ├── hooks/
│   │   └── useFHEVM.ts
│   │
│   └── lib/
│       ├── contracts.ts
│       ├── fhevm.ts
│       ├── utils.ts
│       └── wallet.ts
│
└── .env.local.example
```

## 🔐 FHEVM Client Setup

### Core FHEVM Configuration

```typescript
// lib/fhevm.ts
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { ethers } from 'ethers';

/**
 * Configuration interface for FHEVM network settings.
 */
export interface FHEVMConfig {
  /** RPC endpoint for the Ethereum network */
  network: string;
  /** URL of the FHEVM relayer service */
  relayerUrl: string;
  /** Ethereum chain ID (e.g., 11155111 for Sepolia) */
  chainId: number;
  /** Gateway chain ID for FHEVM operations */
  gatewayChainId: number;
  /** FHEVM system contract addresses */
  contracts?: {
    executor?: string;
    acl?: string;
    hcuLimit?: string;
    kmsVerifier?: string;
    inputVerifier?: string;
    decryptionOracle?: string;
  };
}

/**
 * FHEVM Client for handling encrypted computations on blockchain.
 */
export class FHEVMClient {
  private instance: any = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private isInitialized = false;

  /**
   * Initialize the FHEVM client with Ethereum provider and signer.
   */
  async initialize(provider: ethers.Provider, signer: ethers.Signer) {
    if (this.isInitialized) {
      return this;
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('FHEVM client can only be initialized in browser environment');
    }

    try {
      this.provider = provider;
      this.signer = signer;

      // Initialize the SDK only once globally
      if (!sdkInitialized) {
        await initSDK();
        sdkInitialized = true;
      }

      // Use SepoliaConfig with window.ethereum for web environment
      const config = {
        ...SepoliaConfig,
        network: window.ethereum, // Use window.ethereum for web environment
      };

      this.instance = await createInstance(config);
      this.isInitialized = true;

      return this;
    } catch (error) {
      console.error('Error initializing FHEVM client:', error);
      throw new Error('Failed to initialize FHEVM client');
    }
  }

  /**
   * Encrypt a 32-bit unsigned integer for confidential smart contract operations.
   */
  async encryptUint32(value: number, userAddress: string, contractAddress: string) {
    if (!this.instance) {
      throw new Error('FHEVM client not initialized');
    }

    try {
      // Create encrypted input buffer
      const buffer = this.instance.createEncryptedInput(contractAddress, userAddress);
      // Add the 32-bit value to the buffer
      buffer.add32(value);
      // Encrypt the buffer to generate handles and proof
      const ciphertexts = await buffer.encrypt();

      return {
        inputEuint32: ciphertexts.handles[0],
        inputProof: ciphertexts.inputProof,
      };
    } catch (error) {
      console.error('Error encrypting value:', error);
      throw new Error('Failed to encrypt value');
    }
  }

  /**
   * Decrypt an encrypted value using the relayer with user authorization.
   */
  async decryptUint32(handle: string, contractAddress: string, userAddress: string, abortSignal?: AbortSignal): Promise<number | null> {
    if (!this.instance || !this.signer) {
      throw new Error('FHEVM client not initialized');
    }

    try {
      // Generate keypair for decryption
      const keypair = this.instance.generateKeypair();

      // Create EIP712 signature for verification
      const eip712 = this.instance.createEIP712(
        keypair.publicKey,
        [contractAddress],
        Math.floor(Date.now() / 1000), // timestamp
        1 // duration in days
      );

      // Sign the typed data
      const signature = await this.signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      // Perform user decryption
      const result = await this.instance.userDecrypt(
        [{ handle: handle, contractAddress: contractAddress }],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace(/^0x/, ''),
        [contractAddress],
        userAddress,
        Math.floor(Date.now() / 1000),
        1
      );

      return parseInt(result[handle], 10);
    } catch (error) {
      console.error('Error decrypting value:', error);
      return null;
    }
  }
}

// Global FHEVM client instance
export const fhevmClient = new FHEVMClient();

// Environment configuration with validation
export const FHEVM_CONFIG: FHEVMConfig = {
  network: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.public.blastapi.io',
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || 'https://relayer.testnet.zama.cloud',
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', 10),
  gatewayChainId: parseInt(process.env.NEXT_PUBLIC_GATEWAY_CHAIN_ID || '55815', 10),
  contracts: {
    executor: process.env.NEXT_PUBLIC_FHEVM_EXECUTOR_CONTRACT,
    acl: process.env.NEXT_PUBLIC_ACL_CONTRACT,
    hcuLimit: process.env.NEXT_PUBLIC_HCU_LIMIT_CONTRACT,
    kmsVerifier: process.env.NEXT_PUBLIC_KMS_VERIFIER_CONTRACT,
    inputVerifier: process.env.NEXT_PUBLIC_INPUT_VERIFIER_CONTRACT,
    decryptionOracle: process.env.NEXT_PUBLIC_DECRYPTION_ORACLE_CONTRACT,
  }
};
```

### Custom Hook for FHEVM Operations

```typescript
// hooks/useFHEVM.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { fhevmClient } from '@/lib/fhevm';
import { createFHECounterContract, type CounterOperationResult } from '@/lib/contracts';
import { toast } from 'sonner';

/**
 * Loading states for different FHEVM operations.
 */
interface LoadingStates {
  initializing: boolean;
  refreshing: boolean;
  decrypting: boolean;
  incrementing: boolean;
  decrementing: boolean;
  resetting: boolean;
}

/**
 * Return type for the useFHEVM hook.
 */
interface UseFHEVMReturn {
  /** Whether the FHEVM client and contract are initialized */
  isInitialized: boolean;
  /** Legacy loading state - true if any operation is loading */
  isLoading: boolean;
  /** Granular loading states for specific operations */
  loadingStates: LoadingStates;
  /** Initialized contract instance, null if not ready */
  contract: ReturnType<typeof createFHECounterContract> | null;
  /** Current encrypted counter value handle */
  encryptedCount: string | null;
  /** Decrypted counter value if available */
  decryptedCount: number | null;
  /** Whether current user can decrypt the counter */
  canDecrypt: boolean;
  /** Function to increment the counter by a value */
  incrementCounter: (value: number) => Promise<CounterOperationResult>;
  /** Function to decrement the counter by a value */
  decrementCounter: (value: number) => Promise<CounterOperationResult>;
  /** Function to reset the counter to zero */
  resetCounter: () => Promise<CounterOperationResult>;
  /** Function to refresh the encrypted counter value */
  refreshCount: () => Promise<void>;
  /** Function to decrypt the current counter value */
  decryptCount: () => Promise<void>;
  /** Function to cancel all ongoing operations */
  cancelAllOperations: () => void;
  /** Current error message if any operation failed */
  error: string | null;
}

/**
 * Custom React hook for managing FHEVM counter operations.
 */
export const useFHEVM = (contractAddress?: string): UseFHEVMReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    initializing: false,
    refreshing: false,
    decrypting: false,
    incrementing: false,
    decrementing: false,
    resetting: false,
  });
  const [contract, setContract] = useState<ReturnType<typeof createFHECounterContract> | null>(null);
  const [encryptedCount, setEncryptedCount] = useState<string | null>(null);
  const [decryptedCount, setDecryptedCount] = useState<number | null>(null);
  const [canDecrypt, setCanDecrypt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed isLoading for backward compatibility
  const isLoading = Object.values(loadingStates).some(loading => loading);

  // AbortController refs for operation cancellation
  const abortControllersRef = useRef<{
    initializing?: AbortController;
    refreshing?: AbortController;
    decrypting?: AbortController;
    incrementing?: AbortController;
    decrementing?: AbortController;
    resetting?: AbortController;
  }>({});

  // Initialize FHEVM client and contract
  const initialize = useCallback(async () => {
    if (!walletClient || !address || !isConnected) return;
    if (isInitialized) return;

    try {
      setLoadingStates(prev => ({ ...prev, initializing: true }));
      setError(null);

      // Convert wallet client to ethers provider and signer
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      // Initialize FHEVM client
      await fhevmClient.initialize(provider, signer);

      // Create contract instance
      const contractInstance = createFHECounterContract(contractAddress);
      contractInstance.initialize(signer);
      setContract(contractInstance);

      setIsInitialized(true);
      toast.success('FHEVM client initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize FHEVM';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, initializing: false }));
    }
  }, [walletClient, address, isConnected, contractAddress, isInitialized]);

  // Additional methods for counter operations...
  // (See actual implementation for complete hook methods)

  return {
    isInitialized,
    isLoading,
    loadingStates,
    contract,
    encryptedCount,
    decryptedCount,
    canDecrypt,
    incrementCounter: async (value: number) => {
      // Implementation details...
      return { success: true };
    },
    decrementCounter: async (value: number) => {
      // Implementation details...
      return { success: true };
    },
    resetCounter: async () => {
      // Implementation details...
      return { success: true };
    },
    refreshCount: async () => {
      // Implementation details...
    },
    decryptCount: async () => {
      // Implementation details...
    },
    cancelAllOperations: () => {
      // Implementation details...
    },
    error,
  };
};
```

## 🎨 Building the Counter Component

### Complete Counter Implementation

```typescript
// components/fhevm/Counter.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useFHEVM } from '@/hooks/useFHEVM';
import { validateUint32Input, formatEncryptedValue } from '@/lib/fhevm';
import { Loader2, Lock, Unlock, Plus, Minus, RefreshCw, Eye, RotateCcw } from 'lucide-react';

interface CounterProps {
  contractAddress?: string;
}

export function Counter({ contractAddress }: CounterProps) {
  const { isConnected } = useAccount();
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const {
    isInitialized,
    isLoading,
    encryptedCount,
    decryptedCount,
    canDecrypt,
    incrementCounter,
    decrementCounter,
    resetCounter,
    refreshCount,
    decryptCount,
    error,
  } = useFHEVM(contractAddress);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const validation = validateUint32Input(value);
    setInputError(validation.error || null);
  };

  const handleIncrement = async () => {
    const validation = validateUint32Input(inputValue);
    if (!validation.isValid) {
      setInputError(validation.error || 'Invalid input');
      return;
    }

    await incrementCounter(Number(inputValue));
    setInputValue('');
    setInputError(null);
  };

  const handleDecrypt = async () => {
    if (!canDecrypt) {
      toast.warning('Grant permission first by performing an increment or decrement operation!');
      return;
    }
    await decryptCount();
  };

  // Event listener for contract events
  useEffect(() => {
    if (!isInitialized || !contractAddress) return;

    const setupEventListener = async () => {
      try {
        const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum);
        const contract = new (await import('ethers')).ethers.Contract(
          contractAddress,
          [{
            "anonymous": false,
            "inputs": [
              {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
              {"indexed": false, "internalType": "string", "name": "operation", "type": "string"}
            ],
            "name": "CountUpdated",
            "type": "event"
          }],
          provider
        );

        const eventFilter = contract.filters.CountUpdated();
        const handleCountUpdated = (user: string, operation: string) => {
          console.log(`Count updated by ${user}: ${operation}`);
          setTimeout(() => refreshCount(), 2000);
        };

        contract.on(eventFilter, handleCountUpdated);
        return () => contract.off(eventFilter, handleCountUpdated);
      } catch (error) {
        console.warn('Failed to setup event listeners:', error);
      }
    };

    setupEventListener();
  }, [isInitialized, contractAddress, refreshCount]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-6 h-6" />
            Hello FHEVM Counter
          </CardTitle>
          <CardDescription>
            Connect your wallet to interact with the encrypted counter
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isInitialized ? (
              <Unlock className="w-6 h-6 text-green-500" />
            ) : (
              <Lock className="w-6 h-6 text-orange-500" />
            )}
            Hello FHEVM Counter
          </span>
          <ConnectButton showBalance={false} />
        </CardTitle>
        <CardDescription>
          Increment and decrement an encrypted counter using Fully Homomorphic Encryption
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Initialization Status */}
        {!isInitialized && (
          <div className="flex items-center justify-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Initializing FHEVM client...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Counter Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Current Count</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCount}
              disabled={isLoading || !isInitialized}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Encrypted Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm break-all">
                  {encryptedCount ? formatEncryptedValue(encryptedCount) : 'No data'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Decrypted Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {decryptedCount !== null ? (
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {decryptedCount}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {canDecrypt ? 'Ready to decrypt' : 'No access yet'}
                    </span>
                  )}
                  {canDecrypt && (
                    <Button size="sm" variant="outline" onClick={handleDecrypt} disabled={isLoading}>
                      <Eye className="w-4 h-4 mr-1" />
                      {decryptedCount !== null ? 'Re-decrypt' : 'Decrypt'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {canDecrypt ? (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              ✓ You can decrypt this value
            </Badge>
          ) : (
            <div className="space-y-1">
              <Badge variant="secondary">
                🔒 Only authorized users can decrypt
              </Badge>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Perform an increment or decrement operation first to grant yourself permission.
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="increment-value">Value to Add/Subtract</Label>
            <Input
              id="increment-value"
              type="number"
              min={0}
              max={4294967295}
              placeholder="Enter a number (0-4294967295)"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isLoading || !isInitialized}
              className={inputError ? 'border-red-500' : ''}
            />
            {inputError && (
              <p className="text-sm text-red-500">{inputError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleIncrement}
              disabled={isLoading || !isInitialized || !inputValue || !!inputError}
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Increment
            </Button>

            <Button
              variant="outline"
              onClick={() => decrementCounter(Number(inputValue))}
              disabled={isLoading || !isInitialized || !inputValue || !!inputError}
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Minus className="w-4 h-4" />}
              Decrement
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={resetCounter}
              disabled={isLoading || !isInitialized}
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              Reset Counter to Zero
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How it works:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Values are encrypted on the client side before being sent</li>
            <li>• All operations happen on encrypted data</li>
            <li>• Only authorized users can decrypt the results</li>
            <li>• The blockchain never sees your actual values</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🔧 Contract Integration Library

### Smart Contract Wrapper

```typescript
// lib/contracts.ts
import { ethers } from 'ethers';
import { fhevmClient } from './fhevm';

export const FHE_COUNTER_ABI = [
  {
    "inputs": [],
    "name": "getCount",
    "outputs": [{"internalType": "euint32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "externalEuint32", "name": "inputEuint32", "type": "bytes32"},
      {"internalType": "bytes", "name": "inputProof", "type": "bytes"}
    ],
    "name": "increment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "canUserDecrypt",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  // Additional ABI entries...
];

export interface CounterOperationResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export class FHECounterContract {
  private contract: ethers.Contract | null = null;
  private contractAddress: string;

  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  initialize(signer: ethers.Signer): void {
    this.contract = new ethers.Contract(
      this.contractAddress,
      FHE_COUNTER_ABI,
      signer
    );
  }

  async getCount(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }
    return await this.contract.getCount();
  }

  async increment(value: number, userAddress: string): Promise<CounterOperationResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Encrypt the input value
      const encrypted = await fhevmClient.encryptUint32(
        value,
        userAddress,
        this.contractAddress
      );

      // Send transaction
      const tx = await this.contract.increment(
        encrypted.inputEuint32,
        encrypted.inputProof
      );

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async canUserDecryptCount(userAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.canUserDecrypt();
    } catch (error) {
      console.error('Error checking decrypt permission:', error);
      return false;
    }
  }

  async decryptCount(userAddress: string, abortSignal?: AbortSignal): Promise<number | null> {
    try {
      const encryptedHandle = await this.getCount();

      return await fhevmClient.decryptUint32(
        encryptedHandle,
        this.contractAddress,
        userAddress,
        abortSignal
      );
    } catch (error) {
      console.error('Error decrypting count:', error);
      return null;
    }
  }
}

export const createFHECounterContract = (contractAddress?: string): FHECounterContract => {
  const address = contractAddress || process.env.NEXT_PUBLIC_FHE_COUNTER_ADDRESS;

  if (!address) {
    throw new Error('FHECounter contract address not found');
  }

  return new FHECounterContract(address);
};
```

## 🚀 Performance Optimization

### Key Performance Features

Our implementation includes several performance optimizations:

```typescript
// Performance features in actual implementation:

1. **Keypair Caching**: FHEVM client caches keypairs for 1 hour to avoid regeneration
2. **Operation Cancellation**: AbortController support for all async operations
3. **Retry Logic**: Exponential backoff for network-related failures
4. **Loading States**: Granular loading indicators for better UX
5. **Input Validation**: Client-side validation before encryption
6. **Event Listening**: Real-time updates via contract events
```

### Environment Configuration

```bash
# .env.local.example - Actual environment variables used
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.public.blastapi.io
NEXT_PUBLIC_RELAYER_URL=https://relayer.testnet.zama.cloud
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_GATEWAY_CHAIN_ID=55815

# FHEVM System Contracts (Sepolia Testnet)
NEXT_PUBLIC_FHEVM_EXECUTOR_CONTRACT=0x848B0066793BcC60346Da1F49049357399B8D595
NEXT_PUBLIC_ACL_CONTRACT=0x687820221192C5B662b25367F70076A37bc79b6c
NEXT_PUBLIC_HCU_LIMIT_CONTRACT=0x594BB474275918AF9609814E68C61B1587c5F838
NEXT_PUBLIC_KMS_VERIFIER_CONTRACT=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
NEXT_PUBLIC_INPUT_VERIFIER_CONTRACT=0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4
NEXT_PUBLIC_DECRYPTION_ORACLE_CONTRACT=0xa02Cda4Ca3a71D7C46997716F4283aa851C28812

# Application Contract Address
NEXT_PUBLIC_FHE_COUNTER_ADDRESS=0xff4f5B2aa7D5999136671D43F96146Aee7d8a3Fd

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
```

## 🔍 Error Handling & User Experience

Our implementation provides comprehensive error handling:

```typescript
// Key error handling features:

1. **User Rejection Handling**: Graceful handling of cancelled transactions
2. **Permission Management**: Clear feedback on decryption permissions
3. **Network Error Recovery**: Retry logic for transient failures
4. **Toast Notifications**: Contextual user feedback with Sonner
5. **Loading States**: Visual feedback for all operations
6. **Input Validation**: Real-time validation with error messages
```

## 🎯 Best Practices Summary

### Security ✅
- Input validation before encryption
- Proper decryption permission management
- Error message sanitization
- Secure keypair generation and caching

### Performance ✅
- Keypair caching for reduced overhead
- Operation cancellation support
- Exponential backoff retry logic
- Granular loading states

### User Experience ✅
- Clear visual feedback for all states
- Helpful error messages and hints
- Permission guidance for new users
- Real-time updates via contract events

### Development ✅
- TypeScript for complete type safety
- Comprehensive JSDoc documentation
- Modular architecture with separation of concerns
- Consistent error handling patterns

## 🎮 Contract Event Integration

### Real-time Updates

```typescript
// Event listener implementation from Counter component
useEffect(() => {
  if (!isInitialized || !contractAddress) return;

  const setupEventListener = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, ABI, provider);

      const eventFilter = contract.filters.CountUpdated();
      const handleCountUpdated = (user: string, operation: string) => {
        console.log(`Count updated by ${user}: ${operation}`);
        // Refresh count after blockchain state update
        setTimeout(() => refreshCount(), 2000);
      };

      contract.on(eventFilter, handleCountUpdated);

      // Cleanup on unmount
      return () => contract.off(eventFilter, handleCountUpdated);
    } catch (error) {
      console.warn('Failed to setup event listeners:', error);
    }
  };

  setupEventListener();
}, [isInitialized, contractAddress, refreshCount]);
```

## 🚀 Next Steps

You've now built a complete frontend for your FHEVM application! The final step is deploying everything to production and ensuring it works correctly in a live environment.

---

**Ready to deploy?** Continue to [Deployment Guide](06-deployment.md) →

## 📚 Additional Resources

- [FHEVM Documentation](https://docs.zama.ai/protocol)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)