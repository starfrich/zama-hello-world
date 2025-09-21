import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import { fhevmClient } from '@/lib/fhevm';
import { createFHECounterContract, type CounterOperationResult } from '@/lib/contracts';
import { toast } from 'sonner';

interface UseFHEVMReturn {
  isInitialized: boolean;
  isLoading: boolean;
  contract: ReturnType<typeof createFHECounterContract> | null;
  encryptedCount: string | null;
  decryptedCount: number | null;
  canDecrypt: boolean;
  incrementCounter: (value: number) => Promise<CounterOperationResult>;
  decrementCounter: (value: number) => Promise<CounterOperationResult>;
  resetCounter: () => Promise<CounterOperationResult>;
  refreshCount: () => Promise<void>;
  decryptCount: () => Promise<void>;
  error: string | null;
}

export const useFHEVM = (contractAddress?: string): UseFHEVMReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<ReturnType<typeof createFHECounterContract> | null>(null);
  const [encryptedCount, setEncryptedCount] = useState<string | null>(null);
  const [decryptedCount, setDecryptedCount] = useState<number | null>(null);
  const [canDecrypt, setCanDecrypt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable refs to avoid useEffect dependency issues
  const isInitializedRef = useRef(false);
  const contractRef = useRef<ReturnType<typeof createFHECounterContract> | null>(null);

  // Update refs when state changes
  useEffect(() => {
    isInitializedRef.current = isInitialized;
    contractRef.current = contract;
  });

  // Initialize FHEVM client and contract
  const initialize = useCallback(async () => {
    if (!walletClient || !address || !isConnected) return;

    // Prevent concurrent initialization calls
    if (isInitialized || isInitializing) return;

    try {
      setIsInitializing(true);
      setIsLoading(true);
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
      setIsInitializing(false);
      setIsLoading(false);
    }
  }, [walletClient, address, isConnected, contractAddress, isInitialized, isInitializing]);

  // Refresh the current count
  const refreshCount = useCallback(async () => {
    if (!contract || !address) return;

    try {
      setIsLoading(true);
      const count = await contract.getCount();
      setEncryptedCount(count);

      const canUserDecrypt = await contract.canUserDecryptCount(address);
      setCanDecrypt(canUserDecrypt);
      setDecryptedCount(null); 

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh count';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contract, address]);

  // Decrypt the current count
  const decryptCount = useCallback(async () => {
    if (!contract || !address) return;

    const decryptToastId = `decrypt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      toast.loading('Requesting decryption... Preparing signature', { id: decryptToastId });

      const decrypted = await contract.decryptCount(address);
      setDecryptedCount(decrypted);
      toast.success('Count decrypted successfully', { id: decryptToastId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt count';
      setError(errorMessage);
      const finalError = errorMessage.includes('not authorized') ? 'Grant permission first!' : errorMessage;

      toast.error(finalError, { id: decryptToastId });
    } finally {
      setIsLoading(false);
    }
  }, [contract, address]);

  // Increment counter
  const incrementCounter = useCallback(async (value: number): Promise<CounterOperationResult> => {
    if (!contract || !address) {
      const error = 'Contract not initialized or wallet not connected';
      toast.error(error);
      return { success: false, error };
    }

    const txToastId = `increment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      toast.loading('Encrypting and sending transaction...', { id: txToastId });

      const result = await contract.increment(value, address);

      if (result.success) {
        toast.success(`Successfully incremented by ${value}`, { id: txToastId });
        await refreshCount();
      } else {
        toast.error(result.error || 'Transaction failed', { id: txToastId });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to increment counter';
      toast.error(errorMessage, { id: txToastId });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [contract, address, refreshCount]);

  // Decrement counter
  const decrementCounter = useCallback(async (value: number): Promise<CounterOperationResult> => {
    if (!contract || !address) {
      const error = 'Contract not initialized or wallet not connected';
      toast.error(error);
      return { success: false, error };
    }

    const txToastId = `decrement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      toast.loading('Encrypting and sending transaction...', { id: txToastId });

      const result = await contract.decrement(value, address);

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
      toast.error(errorMessage, { id: txToastId });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [contract, address, refreshCount]);

  // Reset counter
  const resetCounter = useCallback(async (): Promise<CounterOperationResult> => {
    if (!contract || !address) {
      const error = 'Contract not initialized or wallet not connected';
      toast.error(error);
      return { success: false, error };
    }

    const txToastId = `reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      setIsLoading(true);
      setError(null); // Clear previous errors
      toast.loading('Resetting counter...', { id: txToastId });

      const result = await contract.reset();

      if (result.success) {
        toast.success('Counter reset to zero successfully', { id: txToastId });
        await refreshCount();
      } else {
        toast.error(result.error || 'Reset failed', { id: txToastId });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset counter';
      toast.error(errorMessage, { id: txToastId });
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [contract, address, refreshCount]);

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
          setIsLoading(true);
          const count = await contractRef.current!.getCount();
          setEncryptedCount(count);

          const canUserDecrypt = await contractRef.current!.canUserDecryptCount(address);
          setCanDecrypt(canUserDecrypt);
          setDecryptedCount(null);

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to refresh count';
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      refreshData();
    }
  }, [isInitialized, contract, address]); // Safe dependencies

  return {
    isInitialized,
    isLoading,
    contract,
    encryptedCount,
    decryptedCount,
    canDecrypt,
    incrementCounter,
    decrementCounter,
    resetCounter,
    refreshCount,
    decryptCount,
    error,
  };
};