# Frontend Integration with FHEVM

Building user interfaces for FHEVM applications requires handling encrypted data on the client side. This tutorial covers everything you need to create a modern, responsive frontend that seamlessly works with encrypted smart contracts.

## 🎯 What You'll Learn

- Setting up FHEVM client-side encryption
- Building React components for encrypted data
- Wallet integration with RainbowKit and Wagmi
- State management for encrypted operations
- Error handling and user experience patterns
- Testing frontend encryption/decryption

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
@zama-fhe/relayer-sdk

// State management
TanStack Query (React Query)

// Notifications
Sonner toast system
```

## 🔧 Project Structure Deep Dive

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page component
│   ├── globals.css        # Global Tailwind styles
│   └── loading.tsx        # Loading UI component
├── components/
│   ├── fhevm/             # FHEVM-specific components
│   │   ├── Counter.tsx    # Main counter interface
│   │   └── EncryptionStatus.tsx  # Connection status
│   ├── ui/                # shadcn/ui reusable components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── toast.tsx
│   └── providers.tsx      # React context providers
├── hooks/
│   ├── useFHEVM.ts       # Main FHEVM operations hook
│   ├── useContract.ts    # Contract interaction hook
│   └── useEncryption.ts  # Encryption utilities hook
├── lib/
│   ├── fhevm.ts          # FHEVM client configuration
│   ├── contracts.ts      # Contract ABI and addresses
│   ├── wallet.ts         # Wallet configuration
│   └── utils.ts          # Utility functions
└── types/
    ├── fhevm.ts          # FHEVM type definitions
    └── contracts.ts      # Contract type definitions
```

## 🔐 FHEVM Client Setup

### Core FHEVM Configuration

```typescript
// lib/fhevm.ts
import { createInstance, FhevmInstance } from "@zama-fhe/relayer-sdk";

export interface FHEVMConfig {
  relayerUrl: string;
  chainId: number;
  publicKey?: string;
}

export class FHEVMClient {
  private static instance: FhevmInstance | null = null;

  public static async initialize(config: FHEVMConfig): Promise<FhevmInstance> {
    if (!this.instance) {
      try {
        this.instance = await createInstance({
          relayerUrl: config.relayerUrl,
          chainId: config.chainId,
          publicKey: config.publicKey,
        });
        console.log("FHEVM instance created successfully");
      } catch (error) {
        console.error("Failed to create FHEVM instance:", error);
        throw new Error("FHEVM initialization failed");
      }
    }
    return this.instance;
  }

  public static getInstance(): FhevmInstance | null {
    return this.instance;
  }

  public static async encrypt32(value: number): Promise<{
    handles: Uint8Array[];
    inputProof: Uint8Array;
  }> {
    if (!this.instance) {
      throw new Error("FHEVM instance not initialized");
    }

    try {
      const encrypted = await this.instance.encrypt32(value);
      return encrypted;
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt value");
    }
  }

  public static async decrypt32(handle: string): Promise<number> {
    if (!this.instance) {
      throw new Error("FHEVM instance not initialized");
    }

    try {
      const decrypted = await this.instance.decrypt32(handle);
      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt value");
    }
  }
}

// Environment configuration
export const fhevmConfig: FHEVMConfig = {
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || "https://relayer.testnet.zama.cloud",
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111,
  publicKey: process.env.NEXT_PUBLIC_FHE_PUBLIC_KEY,
};
```

### Custom Hook for FHEVM Operations

```typescript
// hooks/useFHEVM.ts
import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { FHEVMClient, fhevmConfig } from '@/lib/fhevm';
import { FhevmInstance } from "@zama-fhe/relayer-sdk";

export interface FHEVMState {
  instance: FhevmInstance | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface EncryptedValue {
  handles: Uint8Array[];
  inputProof: Uint8Array;
}

export function useFHEVM() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();

  const [state, setState] = useState<FHEVMState>({
    instance: null,
    isInitialized: false,
    isLoading: false,
    error: null,
  });

  // Initialize FHEVM instance
  const initialize = useCallback(async () => {
    if (!isConnected || !address || state.isInitialized) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const instance = await FHEVMClient.initialize(fhevmConfig);
      setState(prev => ({
        ...prev,
        instance,
        isInitialized: true,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize FHEVM',
        isLoading: false,
      }));
    }
  }, [isConnected, address, state.isInitialized]);

  // Encrypt a 32-bit unsigned integer
  const encrypt32 = useCallback(async (value: number): Promise<EncryptedValue> => {
    if (!state.instance || !state.isInitialized) {
      throw new Error('FHEVM not initialized');
    }

    if (value < 0 || value > 4294967295) {
      throw new Error('Value must be a valid 32-bit unsigned integer');
    }

    try {
      return await FHEVMClient.encrypt32(value);
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [state.instance, state.isInitialized]);

  // Decrypt a 32-bit unsigned integer
  const decrypt32 = useCallback(async (handle: string): Promise<number> => {
    if (!state.instance || !state.isInitialized) {
      throw new Error('FHEVM not initialized');
    }

    try {
      return await FHEVMClient.decrypt32(handle);
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [state.instance, state.isInitialized]);

  // Auto-initialize when wallet connects
  useEffect(() => {
    if (isConnected && address && !state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [isConnected, address, initialize, state.isInitialized, state.isLoading]);

  return {
    ...state,
    initialize,
    encrypt32,
    decrypt32,
  };
}
```

## 🎮 Main Counter Component

```typescript
// components/fhevm/Counter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseAbi } from 'viem';
import { useFHEVM } from '@/hooks/useFHEVM';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Lock, Unlock, Plus, Minus, RotateCcw } from 'lucide-react';

const CONTRACT_ABI = parseAbi([
  'function increment(bytes32 inputHandle, bytes calldata inputProof) external',
  'function decrement(bytes32 inputHandle, bytes calldata inputProof) external',
  'function reset() external',
  'function getCount() external view returns (bytes32)',
  'function canUserDecrypt() external view returns (bool)',
  'event CountUpdated(address indexed user, string operation)',
]);

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_FHE_COUNTER_ADDRESS as `0x${string}`;

export function Counter() {
  const { address, isConnected } = useAccount();
  const {
    isInitialized: isFHEVMReady,
    isLoading: isFHEVMLoading,
    encrypt32,
    decrypt32,
    error: fhevmError
  } = useFHEVM();

  // Component state
  const [inputValue, setInputValue] = useState<string>('');
  const [decryptedCount, setDecryptedCount] = useState<number | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Contract interactions
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Read encrypted counter handle
  const { data: encryptedHandle, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCount',
  });

  // Check if user can decrypt
  const { data: canDecrypt, refetch: refetchCanDecrypt } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'canUserDecrypt',
  });

  // Handle successful transactions
  useEffect(() => {
    if (isSuccess) {
      toast.success('Transaction confirmed!');
      refetchCount();
      refetchCanDecrypt();
      setInputValue('');
    }
  }, [isSuccess, refetchCount, refetchCanDecrypt]);

  // Encrypt and submit operation
  const handleOperation = async (operation: 'increment' | 'decrement') => {
    if (!isFHEVMReady || !inputValue) return;

    try {
      const value = parseInt(inputValue);
      if (isNaN(value) || value <= 0) {
        toast.error('Please enter a valid positive number');
        return;
      }

      toast.loading('Encrypting value...');
      const encrypted = await encrypt32(value);

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: operation,
        args: [encrypted.handles[0], encrypted.inputProof],
      });

      toast.dismiss();
      toast.loading('Transaction pending...');
    } catch (error) {
      toast.dismiss();
      toast.error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reset counter
  const handleReset = async () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'reset',
    });
    toast.loading('Resetting counter...');
  };

  // Decrypt current count
  const handleDecrypt = async () => {
    if (!encryptedHandle || !isFHEVMReady || !canDecrypt) return;

    setIsDecrypting(true);
    try {
      const decrypted = await decrypt32(encryptedHandle as string);
      setDecryptedCount(decrypted);
      toast.success('Counter decrypted successfully!');
    } catch (error) {
      toast.error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  // Loading states
  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Connect Wallet</CardTitle>
          <CardDescription>Please connect your wallet to interact with the encrypted counter</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isFHEVMLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Initializing FHEVM
          </CardTitle>
          <CardDescription>Setting up encryption capabilities...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (fhevmError) {
    return (
      <Card className="w-full max-w-md mx-auto border-red-200">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600">FHEVM Error</CardTitle>
          <CardDescription className="text-red-500">{fhevmError}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="h-5 w-5" />
          Encrypted Counter
        </CardTitle>
        <CardDescription>
          Perform operations on encrypted data using FHEVM
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Count Display */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Current Count</p>
          {encryptedHandle ? (
            <div className="space-y-2">
              <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                🔒 {encryptedHandle.toString().substring(0, 32)}...
              </p>
              {canDecrypt && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecrypt}
                  disabled={isDecrypting}
                  className="w-full"
                >
                  {isDecrypting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Decrypting...
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Decrypt Value
                    </>
                  )}
                </Button>
              )}
              {decryptedCount !== null && (
                <p className="text-lg font-bold text-green-600">
                  Decrypted: {decryptedCount}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No count available</p>
          )}
        </div>

        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label htmlFor="value" className="block text-sm font-medium mb-2">
              Enter Value
            </label>
            <Input
              id="value"
              type="number"
              min="1"
              max="4294967295"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a positive number"
              disabled={isPending || isConfirming}
            />
          </div>

          {/* Operation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleOperation('increment')}
              disabled={!inputValue || isPending || isConfirming || !isFHEVMReady}
              className="w-full"
            >
              {(isPending || isConfirming) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Increment
            </Button>

            <Button
              variant="outline"
              onClick={() => handleOperation('decrement')}
              disabled={!inputValue || isPending || isConfirming || !isFHEVMReady}
              className="w-full"
            >
              {(isPending || isConfirming) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Minus className="h-4 w-4 mr-2" />
              )}
              Decrement
            </Button>
          </div>

          {/* Reset Button */}
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={isPending || isConfirming || !isFHEVMReady}
            className="w-full"
          >
            {(isPending || isConfirming) ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Reset Counter
          </Button>
        </div>

        {/* Status Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>✅ FHEVM: {isFHEVMReady ? 'Ready' : 'Not Ready'}</p>
          <p>🔐 Can Decrypt: {canDecrypt ? 'Yes' : 'No'}</p>
          <p>📡 Connected: {address?.substring(0, 6)}...{address?.substring(38)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🔄 State Management with React Query

```typescript
// hooks/useContract.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReadContract, useWriteContract } from 'wagmi';
import { useFHEVM } from './useFHEVM';

export function useCounterContract() {
  const queryClient = useQueryClient();
  const { encrypt32, decrypt32, isInitialized } = useFHEVM();

  // Query for encrypted count
  const {
    data: encryptedCount,
    isLoading: isLoadingCount,
    refetch: refetchCount,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getCount',
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Mutation for increment operation
  const incrementMutation = useMutation({
    mutationFn: async (value: number) => {
      if (!isInitialized) throw new Error('FHEVM not initialized');

      const encrypted = await encrypt32(value);
      // Return data needed for contract call
      return { encrypted, value };
    },
    onSuccess: () => {
      // Invalidate and refetch count
      queryClient.invalidateQueries({ queryKey: ['counter', 'count'] });
    },
  });

  // Mutation for decryption
  const decryptMutation = useMutation({
    mutationFn: async (handle: string) => {
      if (!isInitialized) throw new Error('FHEVM not initialized');
      return await decrypt32(handle);
    },
  });

  return {
    encryptedCount,
    isLoadingCount,
    refetchCount,
    incrementMutation,
    decryptMutation,
  };
}
```

## 🎨 UI Components and Styling

### Custom Loading Component

```typescript
// components/ui/loading.tsx
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Loading({ text = 'Loading...', size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin`} />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
}
```

### Toast Notifications

```typescript
// lib/toast.ts
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  loading: (message: string) => sonnerToast.loading(message),
  dismiss: () => sonnerToast.dismiss(),

  // FHEVM-specific toasts
  encryption: {
    start: () => sonnerToast.loading('🔒 Encrypting data...'),
    success: () => sonnerToast.success('✅ Data encrypted successfully'),
    error: (error: string) => sonnerToast.error(`❌ Encryption failed: ${error}`),
  },

  decryption: {
    start: () => sonnerToast.loading('🔓 Decrypting data...'),
    success: () => sonnerToast.success('✅ Data decrypted successfully'),
    error: (error: string) => sonnerToast.error(`❌ Decryption failed: ${error}`),
  },

  transaction: {
    pending: () => sonnerToast.loading('⏳ Transaction pending...'),
    success: () => sonnerToast.success('✅ Transaction confirmed'),
    error: (error: string) => sonnerToast.error(`❌ Transaction failed: ${error}`),
  },
};
```

## 🧪 Testing Frontend Components

### Component Testing

```typescript
// __tests__/Counter.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { Counter } from '@/components/fhevm/Counter';
import { useFHEVM } from '@/hooks/useFHEVM';
import { useAccount } from 'wagmi';

// Mock hooks
vi.mock('@/hooks/useFHEVM');
vi.mock('wagmi');

const mockUseFHEVM = useFHEVM as vi.MockedFunction<typeof useFHEVM>;
const mockUseAccount = useAccount as vi.MockedFunction<typeof useAccount>;

describe('Counter Component', () => {
  beforeEach(() => {
    mockUseAccount.mockReturnValue({
      address: '0x123...',
      isConnected: true,
    });

    mockUseFHEVM.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      encrypt32: vi.fn(),
      decrypt32: vi.fn(),
    });
  });

  it('renders counter interface when connected', () => {
    render(<Counter />);

    expect(screen.getByText('Encrypted Counter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a positive number')).toBeInTheDocument();
    expect(screen.getByText('Increment')).toBeInTheDocument();
    expect(screen.getByText('Decrement')).toBeInTheDocument();
  });

  it('shows connection prompt when wallet not connected', () => {
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    render(<Counter />);
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
  });

  it('handles increment operation', async () => {
    const mockEncrypt = vi.fn().mockResolvedValue({
      handles: [new Uint8Array()],
      inputProof: new Uint8Array(),
    });

    mockUseFHEVM.mockReturnValue({
      isInitialized: true,
      isLoading: false,
      error: null,
      encrypt32: mockEncrypt,
      decrypt32: vi.fn(),
    });

    render(<Counter />);

    const input = screen.getByPlaceholderText('Enter a positive number');
    const incrementButton = screen.getByText('Increment');

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(incrementButton);

    await waitFor(() => {
      expect(mockEncrypt).toHaveBeenCalledWith(5);
    });
  });
});
```

### Hook Testing

```typescript
// __tests__/useFHEVM.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useFHEVM } from '@/hooks/useFHEVM';
import { FHEVMClient } from '@/lib/fhevm';

vi.mock('@/lib/fhevm');
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x123', isConnected: true }),
  usePublicClient: () => ({}),
}));

describe('useFHEVM Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes FHEVM instance when wallet connected', async () => {
    const mockInitialize = vi.fn().mockResolvedValue({});
    (FHEVMClient.initialize as vi.Mock).mockImplementation(mockInitialize);

    const { result } = renderHook(() => useFHEVM());

    await act(async () => {
      await result.current.initialize();
    });

    expect(mockInitialize).toHaveBeenCalled();
    expect(result.current.isInitialized).toBe(true);
  });

  it('handles encryption errors gracefully', async () => {
    const mockEncrypt = vi.fn().mockRejectedValue(new Error('Encryption failed'));
    (FHEVMClient.encrypt32 as vi.Mock).mockImplementation(mockEncrypt);

    const { result } = renderHook(() => useFHEVM());

    await act(async () => {
      result.current.initialize();
    });

    await expect(result.current.encrypt32(42)).rejects.toThrow('Encryption failed');
  });
});
```

## 🚀 Performance Optimization

### Memoization and Optimization

```typescript
// components/fhevm/OptimizedCounter.tsx
import React, { memo, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

const OptimizedCounter = memo(function OptimizedCounter() {
  // Memoize expensive computations
  const formattedHandle = useMemo(() => {
    if (!encryptedHandle) return null;
    return `🔒 ${encryptedHandle.toString().substring(0, 32)}...`;
  }, [encryptedHandle]);

  // Debounce input validation
  const validateInput = useCallback(
    debounce((value: string) => {
      const num = parseInt(value);
      if (isNaN(num) || num <= 0 || num > 4294967295) {
        setInputError('Please enter a valid number (1-4294967295)');
      } else {
        setInputError(null);
      }
    }, 300),
    []
  );

  // Memoize operation handlers
  const handleIncrement = useCallback(async () => {
    if (!inputValue || inputError) return;
    await handleOperation('increment');
  }, [inputValue, inputError, handleOperation]);

  // ... rest of component
});
```

### Bundle Optimization

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  webpack: (config) => {
    // Optimize FHEVM dependencies
    config.resolve.alias = {
      ...config.resolve.alias,
      '@zama-fhe/relayer-sdk': require.resolve('@zama-fhe/relayer-sdk'),
    };

    return config;
  },
};

module.exports = nextConfig;
```

## 🔍 Error Handling Best Practices

```typescript
// lib/error-handling.ts
export class FHEVMError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'FHEVMError';
  }
}

export const handleFHEVMError = (error: unknown): string => {
  if (error instanceof FHEVMError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Handle specific error patterns
    if (error.message.includes('User rejected')) {
      return 'Transaction was cancelled by user';
    }

    if (error.message.includes('insufficient funds')) {
      return 'Insufficient funds for transaction';
    }

    if (error.message.includes('FHEVM not initialized')) {
      return 'Please wait for encryption to initialize';
    }

    return error.message;
  }

  return 'An unexpected error occurred';
};
```

## 🎯 Best Practices Summary

### Security
- ✅ Always validate inputs before encryption
- ✅ Handle decryption permissions properly
- ✅ Sanitize error messages to avoid information leakage
- ✅ Use secure random number generation for nonces

### Performance
- ✅ Memoize expensive computations
- ✅ Debounce user inputs
- ✅ Optimize bundle size with proper imports
- ✅ Use React Query for efficient data fetching

### User Experience
- ✅ Provide clear loading states
- ✅ Show meaningful error messages
- ✅ Implement proper offline handling
- ✅ Use optimistic updates where appropriate

### Development
- ✅ Write comprehensive tests
- ✅ Use TypeScript for type safety
- ✅ Implement proper error boundaries
- ✅ Follow React best practices

## 🚀 Next Steps

You've now built a complete frontend for your FHEVM application! The final step is deploying everything to production and ensuring it works correctly in a live environment.

---

**Ready to deploy?** Continue to [Deployment Guide](06-deployment.md) →

## 📚 Additional Resources

- [FHEVM Documentation](https://docs.zama.ai/protocol)
- [RainbowKit Documentation](https://rainbowkit.com)
- [Wagmi Documentation](https://wagmi.sh)
- [Next.js App Router Guide](https://nextjs.org/docs/app)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)