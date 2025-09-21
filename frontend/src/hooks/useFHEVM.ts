import { useState, useEffect, useCallback } from 'react';
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
  refreshCount: () => Promise<void>;
  decryptCount: () => Promise<void>;
  error: string | null;
}

export const useFHEVM = (contractAddress?: string): UseFHEVMReturn => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState<ReturnType<typeof createFHECounterContract> | null>(null);
  const [encryptedCount, setEncryptedCount] = useState<string | null>(null);
  const [decryptedCount, setDecryptedCount] = useState<number | null>(null);
  const [canDecrypt, setCanDecrypt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [permissionHint, setPermissionHint] = useState<string | null>(null);

  // Initialize FHEVM client and contract
  const initialize = useCallback(async () => {
    if (!walletClient || !address || !isConnected) return;

    try {
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
      setIsLoading(false);
    }
  }, [walletClient, address, isConnected, contractAddress]);

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

    try {
      setIsLoading(true);
      toast.loading('Requesting decryption... Preparing signature');  // UPDATED: Granular toast

      const decrypted = await contract.decryptCount(address);
      setDecryptedCount(decrypted);
      toast.success('Count decrypted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decrypt count';
      setError(errorMessage);
      toast.error(errorMessage.includes('not authorized') ? 'Grant permission first!' : errorMessage);
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

    let txToastId: string = '';

    try {
      setIsLoading(true);
      txToastId = String(toast.loading('Encrypting and sending transaction...'));

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
      if (txToastId) {
        toast.error(errorMessage, { id: txToastId });
      } else {
        toast.error(errorMessage);
      }
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

    let txToastId: string = '';

    try {
      setIsLoading(true);
      txToastId = String(toast.loading('Encrypting and sending transaction...'));

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
      if (txToastId) {
        toast.error(errorMessage, { id: txToastId });
      } else {
        toast.error(errorMessage);
      }
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [contract, address, refreshCount]);

  // Initialize when wallet connects
  useEffect(() => {
    if (isConnected && address && walletClient && !isInitialized) {
      initialize();
    }
  }, [isConnected, address, walletClient, isInitialized, initialize]);

  // Refresh count when initialized
  useEffect(() => {
    if (isInitialized && contract) {
      refreshCount();
    }
  }, [isInitialized, contract, refreshCount]);

  return {
    isInitialized,
    isLoading,
    contract,
    encryptedCount,
    decryptedCount,
    canDecrypt,
    incrementCounter,
    decrementCounter,
    refreshCount,
    decryptCount,
    error,
  };
};