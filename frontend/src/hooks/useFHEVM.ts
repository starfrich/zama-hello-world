/**
 * @fileoverview Custom React Hook for FHEVM Counter Operations
 *
 * This module provides a comprehensive React hook for managing FHEVM counter
 * operations including initialization, encryption, decryption, and transaction
 * management with proper state management and error handling.
 *
 * @author FHEVM Tutorial Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { fhevmClient } from '@/lib/fhevm';
import { createFHECounterContract, type CounterOperationResult } from '@/lib/contracts';
import { toast } from 'sonner';

/**
 * Loading states for different FHEVM operations.
 *
 * This interface provides granular loading state management for better UX,
 * allowing the UI to show specific loading indicators for each operation.
 *
 * @interface LoadingStates
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
 *
 * This interface defines all the state, functions, and utilities provided
 * by the useFHEVM hook for managing FHEVM counter operations.
 *
 * @interface UseFHEVMReturn
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
 *
 * This hook provides a complete interface for interacting with FHEVM counter contracts,
 * handling initialization, state management, encrypted operations, and error handling.
 * It integrates with wagmi for wallet management and provides granular loading states
 * for optimal user experience.
 *
 * Features:
 * - Automatic FHEVM client and contract initialization
 * - Encrypted counter operations (increment, decrement, reset)
 * - Secure decryption with user authorization
 * - Comprehensive error handling and user feedback
 * - Operation cancellation support with AbortController
 * - Real-time state synchronization
 *
 * @param contractAddress - Optional contract address (uses env default if not provided)
 *
 * @returns Object containing all counter operations, state, and utilities
 *
 * @example
 * ```typescript
 * function CounterComponent() {
 *   const {
 *     isInitialized,
 *     encryptedCount,
 *     decryptedCount,
 *     canDecrypt,
 *     incrementCounter,
 *     decryptCount,
 *     loadingStates,
 *     error
 *   } = useFHEVM();
 *
 *   const handleIncrement = async () => {
 *     const result = await incrementCounter(5);
 *     if (result.success) {
 *       console.log('Counter incremented!');
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <p>Encrypted: {encryptedCount}</p>
 *       <p>Decrypted: {decryptedCount}</p>
 *       <button onClick={handleIncrement} disabled={loadingStates.incrementing}>
 *         {loadingStates.incrementing ? 'Processing...' : 'Increment'}
 *       </button>
 *       {canDecrypt && (
 *         <button onClick={decryptCount} disabled={loadingStates.decrypting}>
 *           Decrypt
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const useFHEVM = (contractAddress?: string): UseFHEVMReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
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

  // Stable refs to avoid useEffect dependency issues
  const isInitializedRef = useRef(false);
  const contractRef = useRef<ReturnType<typeof createFHECounterContract> | null>(null);

  // AbortController refs for operation cancellation
  const abortControllersRef = useRef<{
    initializing?: AbortController;
    refreshing?: AbortController;
    decrypting?: AbortController;
    incrementing?: AbortController;
    decrementing?: AbortController;
    resetting?: AbortController;
  }>({});

  // Update refs when state changes
  useEffect(() => {
    isInitializedRef.current = isInitialized;
    contractRef.current = contract;
  });

  // Cleanup function to cancel all ongoing operations
  const cancelAllOperations = useCallback(() => {
    Object.values(abortControllersRef.current).forEach(controller => {
      if (controller && !controller.signal.aborted) {
        controller.abort();
      }
    });
    abortControllersRef.current = {};
  }, []);

  // Initialize FHEVM client and contract
  const initialize = useCallback(async () => {
    if (!walletClient || !address || !isConnected) return;

    // Prevent concurrent initialization calls
    if (isInitialized || isInitializing) return;

    // Cancel any previous initialization
    if (abortControllersRef.current.initializing) {
      abortControllersRef.current.initializing.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllersRef.current.initializing = abortController;

    try {
      setIsInitializing(true);
      setLoadingStates(prev => ({ ...prev, initializing: true }));
      setError(null);

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      // Convert wallet client to ethers provider and signer
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      // Initialize FHEVM client
      await fhevmClient.initialize(provider, signer);

      // Check if operation was cancelled after async operation
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      // Create contract instance
      const contractInstance = createFHECounterContract(contractAddress);
      contractInstance.initialize(signer);
      setContract(contractInstance);

      setIsInitialized(true);
      toast.success('FHEVM client initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize FHEVM';
      // Don't show error if operation was cancelled
      if (!abortController.signal.aborted) {
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      // Clean up AbortController reference
      if (abortControllersRef.current.initializing === abortController) {
        delete abortControllersRef.current.initializing;
      }
      setIsInitializing(false);
      setLoadingStates(prev => ({ ...prev, initializing: false }));
    }
  }, [walletClient, address, isConnected, contractAddress, isInitialized, isInitializing]);

  // Refresh the current count
  const refreshCount = useCallback(async () => {
    if (!contract || !address) return;

    try {
      setLoadingStates(prev => ({ ...prev, refreshing: true }));
      const count = await contract.getCount();
      setEncryptedCount(count);

      const canUserDecrypt = await contract.canUserDecryptCount(address);
      setCanDecrypt(canUserDecrypt);
      setDecryptedCount(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh count';
      setError(errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, refreshing: false }));
    }
  }, [contract, address]);

  // Decrypt the current count
  const decryptCount = useCallback(async () => {
    if (!contract || !address) return;

    // Cancel any previous decryption
    if (abortControllersRef.current.decrypting) {
      abortControllersRef.current.decrypting.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllersRef.current.decrypting = abortController;

    const decryptToastId = `decrypt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setLoadingStates(prev => ({ ...prev, decrypting: true }));
      setError(null); // Clear previous errors
      toast.loading('Requesting decryption... Preparing signature', { id: decryptToastId });

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      const decrypted = await contract.decryptCount(address, abortController.signal);

      // Check if operation was cancelled after async operation
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      // Check if decryption returned null (could be user rejection or auth issue)
      if (decrypted === null) {
        // Just dismiss the toast quietly - user might have cancelled
        toast.dismiss(decryptToastId);
        return;
      }

      setDecryptedCount(decrypted);
      toast.success('Count decrypted successfully', { id: decryptToastId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt count';

      // Don't show error if operation was cancelled
      if (!abortController.signal.aborted) {
        // Check for user rejection - don't set as error state
        if (errorMessage.includes('User rejected') || errorMessage.includes('user denied') || errorMessage.includes('rejected signature')) {
          // User rejection is not an error state - just dismiss toast quietly
          toast.dismiss(decryptToastId);
          // Don't set error state for user rejections
        } else {
          setError(errorMessage);
          const finalError = errorMessage.includes('not authorized') ? 'Grant permission first!' : errorMessage;
          toast.error(finalError, { id: decryptToastId });
        }
      }
    } finally {
      // Clean up AbortController reference
      if (abortControllersRef.current.decrypting === abortController) {
        delete abortControllersRef.current.decrypting;
      }
      setLoadingStates(prev => ({ ...prev, decrypting: false }));
    }
  }, [contract, address]);

  // Increment counter
  const incrementCounter = useCallback(async (value: number): Promise<CounterOperationResult> => {
    if (!contract || !address) {
      const error = 'Contract not initialized or wallet not connected';
      toast.error(error);
      return { success: false, error };
    }

    // Cancel any previous increment
    if (abortControllersRef.current.incrementing) {
      abortControllersRef.current.incrementing.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllersRef.current.incrementing = abortController;

    const txToastId = `increment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setLoadingStates(prev => ({ ...prev, incrementing: true }));
      setError(null); // Clear previous errors
      toast.loading('Encrypting and sending transaction...', { id: txToastId });

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      const result = await contract.increment(value, address);

      // Check if operation was cancelled after async operation
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      if (result.success) {
        toast.success(`Successfully incremented by ${value}`, { id: txToastId });
        await refreshCount();
      } else {
        toast.error(result.error || 'Transaction failed', { id: txToastId });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to increment counter';

      // Don't show error if operation was cancelled
      if (!abortController.signal.aborted) {
        // Check for user rejection - don't treat as error
        if (errorMessage.includes('User rejected') || errorMessage.includes('user denied') || errorMessage.includes('ACTION_REJECTED') || errorMessage.includes('rejected')) {
          // Dismiss loading toast quietly for user rejection
          toast.dismiss(txToastId);
        } else {
          toast.error(errorMessage, { id: txToastId });
        }
      }

      return { success: false, error: errorMessage };
    } finally {
      // Clean up AbortController reference
      if (abortControllersRef.current.incrementing === abortController) {
        delete abortControllersRef.current.incrementing;
      }
      setLoadingStates(prev => ({ ...prev, incrementing: false }));
    }
  }, [contract, address, refreshCount]);

  // Decrement counter
  const decrementCounter = useCallback(async (value: number): Promise<CounterOperationResult> => {
    if (!contract || !address) {
      const error = 'Contract not initialized or wallet not connected';
      toast.error(error);
      return { success: false, error };
    }

    // Cancel any previous decrement
    if (abortControllersRef.current.decrementing) {
      abortControllersRef.current.decrementing.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllersRef.current.decrementing = abortController;

    const txToastId = `decrement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setLoadingStates(prev => ({ ...prev, decrementing: true }));
      setError(null); // Clear previous errors
      toast.loading('Encrypting and sending transaction...', { id: txToastId });

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      const result = await contract.decrement(value, address);

      // Check if operation was cancelled after async operation
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      if (result.success) {
        toast.success(`Successfully decremented by ${value}`, { id: txToastId });
        // Refresh count after successful transaction
        await refreshCount();
      } else {
        toast.error(result.error || 'Transaction failed', { id: txToastId });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrement counter';

      // Don't show error if operation was cancelled
      if (!abortController.signal.aborted) {
        // Check for user rejection - don't treat as error
        if (errorMessage.includes('User rejected') || errorMessage.includes('user denied') || errorMessage.includes('ACTION_REJECTED') || errorMessage.includes('rejected')) {
          // Dismiss loading toast quietly for user rejection
          toast.dismiss(txToastId);
        } else {
          toast.error(errorMessage, { id: txToastId });
        }
      }

      return { success: false, error: errorMessage };
    } finally {
      // Clean up AbortController reference
      if (abortControllersRef.current.decrementing === abortController) {
        delete abortControllersRef.current.decrementing;
      }
      setLoadingStates(prev => ({ ...prev, decrementing: false }));
    }
  }, [contract, address, refreshCount]);

  // Reset counter
  const resetCounter = useCallback(async (): Promise<CounterOperationResult> => {
    if (!contract || !address) {
      const error = 'Contract not initialized or wallet not connected';
      toast.error(error);
      return { success: false, error };
    }

    // Cancel any previous reset
    if (abortControllersRef.current.resetting) {
      abortControllersRef.current.resetting.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllersRef.current.resetting = abortController;

    const txToastId = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setLoadingStates(prev => ({ ...prev, resetting: true }));
      setError(null); // Clear previous errors
      toast.loading('Resetting counter...', { id: txToastId });

      // Check if operation was cancelled
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      const result = await contract.reset();

      // Check if operation was cancelled after async operation
      if (abortController.signal.aborted) {
        throw new Error('Operation cancelled');
      }

      if (result.success) {
        toast.success('Counter reset to zero successfully', { id: txToastId });
        await refreshCount();
      } else {
        toast.error(result.error || 'Reset failed', { id: txToastId });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset counter';

      // Don't show error if operation was cancelled
      if (!abortController.signal.aborted) {
        // Check for user rejection - don't treat as error
        if (errorMessage.includes('User rejected') || errorMessage.includes('user denied') || errorMessage.includes('ACTION_REJECTED') || errorMessage.includes('rejected')) {
          // Dismiss loading toast quietly for user rejection
          toast.dismiss(txToastId);
        } else {
          toast.error(errorMessage, { id: txToastId });
        }
      }

      return { success: false, error: errorMessage };
    } finally {
      // Clean up AbortController reference
      if (abortControllersRef.current.resetting === abortController) {
        delete abortControllersRef.current.resetting;
      }
      setLoadingStates(prev => ({ ...prev, resetting: false }));
    }
  }, [contract, address, refreshCount]);

  // Cancel all operations when wallet disconnects
  useEffect(() => {
    if (!isConnected || !address || !walletClient) {
      cancelAllOperations();
    }
  }, [isConnected, address, walletClient, cancelAllOperations]);

  // Cleanup all operations on unmount
  useEffect(() => {
    return () => {
      cancelAllOperations();
    };
  }, [cancelAllOperations]);

  // Initialize when wallet connects - using refs to avoid dependency issues
  useEffect(() => {
    if (isConnected && address && walletClient && !isInitializedRef.current && !isInitializing) {
      initialize();
    }
  }, [isConnected, address, walletClient, isInitializing]); // Removed callback dependencies

  // Refresh count when initialized - using refs to avoid dependency issues
  useEffect(() => {
    if (isInitializedRef.current && contractRef.current && address) {
      const refreshData = async () => {
        try {
          setLoadingStates(prev => ({ ...prev, refreshing: true }));
          const count = await contractRef.current!.getCount();
          setEncryptedCount(count);

          const canUserDecrypt = await contractRef.current!.canUserDecryptCount(address);
          setCanDecrypt(canUserDecrypt);
          setDecryptedCount(null);

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to refresh count';
          setError(errorMessage);
        } finally {
          setLoadingStates(prev => ({ ...prev, refreshing: false }));
        }
      };

      refreshData();
    }
  }, [isInitialized, contract, address]); // Safe dependencies

  return {
    isInitialized,
    isLoading, // Computed value for backward compatibility
    loadingStates,
    contract,
    encryptedCount,
    decryptedCount,
    canDecrypt,
    incrementCounter,
    decrementCounter,
    resetCounter,
    refreshCount,
    decryptCount,
    cancelAllOperations,
    error,
  };
};