/**
 * @fileoverview Custom React Hook for FHEVM Counter Operations
 *
 * This module provides a comprehensive React hook for managing FHEVM counter
 * operations including initialization, encryption, decryption, and transaction
 * management with proper state management and error handling.
 *
 * @author Starfish
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
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
 */
export const useFHEVM = (contractAddress?: string): UseFHEVMReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();

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
  const [currentContractAddress, setCurrentContractAddress] = useState<string | undefined>(contractAddress);
  const [encryptedCount, setEncryptedCount] = useState<string | null>(null);
  const [decryptedCount, setDecryptedCount] = useState<number | null>(null);
  const [canDecrypt, setCanDecrypt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Computed isLoading for backward compatibility
  const isLoading = Object.values(loadingStates).some(loading => loading);

  // Stable refs to avoid useEffect dependency issues
  const isInitializedRef = useRef(false);
  const contractRef = useRef<ReturnType<typeof createFHECounterContract> | null>(null);
  const lastChainIdRef = useRef<number | undefined>(chainId);
  const lastAddressRef = useRef<string | undefined>(address);

  /**
   * Utility function to generate unique toast IDs for operations.
   * Ensures consistent ID format across all toast notifications.
   *
   * @param operation - The operation type (e.g., 'decrypt', 'increment')
   * @returns Unique toast ID string
   */
  const generateToastId = useCallback((operation: string): string => {
    return `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Retry configuration for different operation types.
   */
  const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 8000,  // 8 seconds max
  };

  /**
   * Determines if an error should trigger a retry attempt.
   * Filters out user rejections and permanent errors.
   *
   * @param error - Error object or message
   * @returns Whether the error is retryable
   */
  const isRetryableError = useCallback((error: Error | string): boolean => {
    const errorMessage = typeof error === 'string' ? error : error.message;

    // Never retry user rejections
    if (errorMessage.includes('User rejected') ||
        errorMessage.includes('user denied') ||
        errorMessage.includes('rejected signature') ||
        errorMessage.includes('ACTION_REJECTED')) {
      return false;
    }

    // Never retry invalid addresses or contract errors
    if (errorMessage.includes('invalid address') ||
        errorMessage.includes('contract not found') ||
        errorMessage.includes('invalid contract')) {
      return false;
    }

    // Retry network, timeout, and gas-related errors
    return errorMessage.includes('network') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('connection') ||
           errorMessage.includes('gas') ||
           errorMessage.includes('nonce') ||
           errorMessage.includes('underpriced') ||
           errorMessage.includes('replacement transaction underpriced') ||
           errorMessage.includes('failed to estimate gas');
  }, []);

  /**
   * Calculates exponential backoff delay for retry attempts.
   *
   * @param attempt - Current attempt number (0-based)
   * @returns Delay in milliseconds
   */
  const calculateBackoffDelay = useCallback((attempt: number): number => {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
  }, []);

  /**
   * Generic retry wrapper for async operations with exponential backoff.
   *
   * @param operation - Async function to execute
   * @param operationName - Name for logging and toast messages
   * @param abortSignal - AbortSignal for cancellation
   * @param toastId - Toast ID for progress updates
   * @returns Result of the operation
   */
  const withRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string,
    abortSignal?: AbortSignal,
    toastId?: string
  ): Promise<T> => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        // Check if operation was cancelled
        if (abortSignal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // Execute the operation
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if operation was cancelled
        if (abortSignal?.aborted) {
          throw new Error('Operation cancelled');
        }

        // Don't retry if error is not retryable
        if (!isRetryableError(lastError)) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === RETRY_CONFIG.maxRetries) {
          throw lastError;
        }

        // Calculate delay and show retry toast
        const delay = calculateBackoffDelay(attempt);
        const retryNumber = attempt + 1;

        if (toastId) {
          toast.loading(
            `${operationName} failed. Retrying ${retryNumber}/${RETRY_CONFIG.maxRetries} in ${delay/1000}s...`,
            { id: toastId }
          );
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));

        // Check if operation was cancelled during delay
        if (abortSignal?.aborted) {
          throw new Error('Operation cancelled');
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Unknown retry error');
  }, [isRetryableError, calculateBackoffDelay]);

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

      /**
       * Create contract instance only if address changed or not exists.
       * This prevents redundant contract re-initialization on every call.
       */
      let contractInstance = contractRef.current;
      if (!contractInstance || currentContractAddress !== contractAddress) {
        contractInstance = createFHECounterContract(contractAddress);
        setCurrentContractAddress(contractAddress);
      }
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

  /**
   * Type-safe Ethereum address validation.
   * Ensures address is a valid hex string with proper format.
   *
   * @param addr - Address to validate
   * @returns Type predicate confirming valid address
   */
  const isValidAddress = useCallback((addr: string | undefined): addr is string => {
    return typeof addr === 'string' && addr.length === 42 && addr.startsWith('0x');
  }, []);

  /**
   * Refresh the current encrypted count and user permissions.
   * Updates encrypted count value and checks if current user can decrypt.
   */
  const refreshCount = useCallback(async () => {
    if (!contract || !isValidAddress(address)) return;

    try {
      setLoadingStates(prev => ({ ...prev, refreshing: true }));

      // Use retry mechanism for refresh operations
      await withRetry(
        async () => {
          const count = await contract.getCount();
          setEncryptedCount(count);

          const canUserDecrypt = await contract.canUserDecryptCount(address);
          setCanDecrypt(canUserDecrypt);
          setDecryptedCount(null);
        },
        'Refresh count',
        undefined, // No abort signal for refresh
        undefined  // No toast for background refresh
      );

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh count';
      setError(errorMessage);
    } finally {
      setLoadingStates(prev => ({ ...prev, refreshing: false }));
    }
  }, [contract, address, isValidAddress]);

  /**
   * Decrypt the current encrypted count for the connected user.
   * Requires user authorization and valid decryption permissions.
   */
  const decryptCount = useCallback(async () => {
    if (!contract || !address) return;

    // Cancel any previous decryption
    if (abortControllersRef.current.decrypting) {
      abortControllersRef.current.decrypting.abort();
    }

    // Create new AbortController for this operation
    const abortController = new AbortController();
    abortControllersRef.current.decrypting = abortController;

    const decryptToastId = generateToastId('decrypt');

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
        // Improved permission error categorization
        const isUserRejection = errorMessage.includes('User rejected') ||
                              errorMessage.includes('user denied') ||
                              errorMessage.includes('rejected signature') ||
                              errorMessage.includes('ACTION_REJECTED');

        const isPermissionError = errorMessage.includes('not authorized') ||
                                 errorMessage.includes('permission denied') ||
                                 errorMessage.includes('unauthorized');

        if (isUserRejection) {
          // User rejection is not an error state - just dismiss toast quietly
          toast.dismiss(decryptToastId);
        } else if (isPermissionError) {
          // Show helpful permission error without setting error state
          toast.error('🔐 Grant decryption permission first by clicking "Allow Decryption"', {
            id: decryptToastId,
            duration: 4000
          });
        } else {
          // Other errors should be shown and set in error state
          setError(errorMessage);
          toast.error(errorMessage, { id: decryptToastId });
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

  /**
   * Increment the encrypted counter by specified value.
   * Encrypts the value client-side before sending to contract.
   */
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

    const txToastId = generateToastId('increment');

    try {
      setLoadingStates(prev => ({ ...prev, incrementing: true }));
      setError(null); // Clear previous errors
      toast.loading('Encrypting and sending transaction...', { id: txToastId });

      // Wrap the contract operation with retry logic
      const result = await withRetry(
        async () => {
          // Check if operation was cancelled
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          const contractResult = await contract.increment(value, address);

          // Check if operation was cancelled after async operation
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          // Throw error if contract operation failed (to trigger retry)
          if (!contractResult.success) {
            throw new Error(contractResult.error || 'Transaction failed');
          }

          return contractResult;
        },
        'Increment transaction',
        abortController.signal,
        txToastId
      );

      // Success case
      toast.success(`Successfully incremented by ${value}`, { id: txToastId });
      await refreshCount();
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

  /**
   * Decrement the encrypted counter by specified value.
   * Encrypts the value client-side before sending to contract.
   */
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

    const txToastId = generateToastId('decrement');

    try {
      setLoadingStates(prev => ({ ...prev, decrementing: true }));
      setError(null); // Clear previous errors
      toast.loading('Encrypting and sending transaction...', { id: txToastId });

      // Wrap the contract operation with retry logic
      const result = await withRetry(
        async () => {
          // Check if operation was cancelled
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          const contractResult = await contract.decrement(value, address);

          // Check if operation was cancelled after async operation
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          // Throw error if contract operation failed (to trigger retry)
          if (!contractResult.success) {
            throw new Error(contractResult.error || 'Transaction failed');
          }

          return contractResult;
        },
        'Decrement transaction',
        abortController.signal,
        txToastId
      );

      // Success case
      toast.success(`Successfully decremented by ${value}`, { id: txToastId });
      await refreshCount();
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

  /**
   * Reset the encrypted counter to zero.
   * Sends encrypted zero value to contract reset function.
   */
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

    const txToastId = generateToastId('reset');

    try {
      setLoadingStates(prev => ({ ...prev, resetting: true }));
      setError(null); // Clear previous errors
      toast.loading('Resetting counter...', { id: txToastId });

      // Wrap the contract operation with retry logic
      const result = await withRetry(
        async () => {
          // Check if operation was cancelled
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          const contractResult = await contract.reset();

          // Check if operation was cancelled after async operation
          if (abortController.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          // Throw error if contract operation failed (to trigger retry)
          if (!contractResult.success) {
            throw new Error(contractResult.error || 'Reset failed');
          }

          return contractResult;
        },
        'Reset transaction',
        abortController.signal,
        txToastId
      );

      // Success case
      toast.success('Counter reset to zero successfully', { id: txToastId });
      await refreshCount();
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

  // Cancel all operations when wallet disconnects or network changes
  useEffect(() => {
    if (!isConnected || !address || !walletClient) {
      cancelAllOperations();
      setIsInitialized(false);
      setContract(null);
      setEncryptedCount(null);
      setDecryptedCount(null);
      setCanDecrypt(false);
      setError(null);
    }
  }, [isConnected, address, walletClient, cancelAllOperations]);

  // Handle network changes
  useEffect(() => {
    if (lastChainIdRef.current !== undefined && lastChainIdRef.current !== chainId && isConnected) {
      // Network changed - reset everything
      cancelAllOperations();
      setIsInitialized(false);
      setContract(null);
      setEncryptedCount(null);
      setDecryptedCount(null);
      setCanDecrypt(false);
      setError(null);
      toast.info('Network changed. Please reconnect.');
    }
    lastChainIdRef.current = chainId;
  }, [chainId, isConnected, cancelAllOperations]);

  // Handle wallet/address changes
  useEffect(() => {
    if (lastAddressRef.current !== undefined && lastAddressRef.current !== address && isConnected && address) {
      // Wallet switched - clear cache and reinitialize
      console.info(`Wallet switched from ${lastAddressRef.current} to ${address}`);

      // Clear FHEVM client cache (important for keypair isolation)
      fhevmClient.clearKeypairCache();

      // Reset all state
      cancelAllOperations();
      setIsInitialized(false);
      setContract(null);
      setEncryptedCount(null);
      setDecryptedCount(null);
      setCanDecrypt(false);
      setError(null);

      toast.info('Wallet switched. Reinitializing...');
    }
    lastAddressRef.current = address;
  }, [address, isConnected, cancelAllOperations]);

  // Cleanup all operations on unmount
  useEffect(() => {
    return () => {
      cancelAllOperations();
    };
  }, [cancelAllOperations]);

  // Handle contract address changes
  useEffect(() => {
    if (contractAddress !== currentContractAddress && isInitialized) {
      // Contract address changed - reset and re-initialize
      setIsInitialized(false);
      setContract(null);
      setEncryptedCount(null);
      setDecryptedCount(null);
      setCanDecrypt(false);
      setCurrentContractAddress(contractAddress);
    }
  }, [contractAddress, currentContractAddress, isInitialized]);

  // Initialize when wallet connects - using refs to avoid dependency issues
  useEffect(() => {
    if (isConnected && address && walletClient && !isInitializedRef.current && !isInitializing) {
      initialize();
    }
  }, [isConnected, address, walletClient, isInitializing, contractAddress]); // Added contractAddress

  /**
   * Auto-refresh count when hook is initialized.
   * Uses existing refreshCount function to avoid code duplication.
   */
  useEffect(() => {
    if (isInitialized && contract && isValidAddress(address)) {
      refreshCount();
    }
  }, [isInitialized, contract, address, refreshCount]); // Use the existing refreshCount function

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