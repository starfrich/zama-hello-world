/**
 * @fileoverview FHEVM Smart Contract Integration Library
 *
 * This module provides high-level abstractions for interacting with FHEVM smart contracts,
 * specifically the FHECounter contract. It handles encrypted value operations, transaction
 * management, and user authorization workflows.
 *
 * @author Starfish
 * @version 1.0.0
 */

import { ethers } from 'ethers';
import { fhevmClient } from './fhevm';

/**
 * Application Binary Interface (ABI) for the FHECounter smart contract.
 *
 * This ABI defines the interface for a confidential counter contract that uses
 * Fully Homomorphic Encryption (FHE) to keep the counter value private while
 * allowing arithmetic operations.
 *
 * @constant {Array} FHE_COUNTER_ABI
 */
export const FHE_COUNTER_ABI = [
  {
    "inputs": [],
    "name": "getCount",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "inputEuint32",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "increment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "inputEuint32",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "decrement",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "canUserDecrypt",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reset",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "operation",
        "type": "string"
      }
    ],
    "name": "CountUpdated",
    "type": "event"
  }
];

/**
 * Contract deployment addresses for different networks.
 *
 * These addresses are populated from environment variables after contract deployment.
 * For development, use the addresses from your local deployment or testnet.
 *
 * @constant {Object} CONTRACT_ADDRESSES
 */
export const CONTRACT_ADDRESSES = {
  /** FHECounter contract address from environment variable */
  FHECounter: process.env.NEXT_PUBLIC_FHE_COUNTER_ADDRESS || '',
};

/**
 * Result interface for counter operations.
 *
 * This interface standardizes the response format for all counter operations
 * including increment, decrement, and reset functions.
 *
 * @interface CounterOperationResult
 */
export interface CounterOperationResult {
  /** Whether the operation completed successfully */
  success: boolean;
  /** Transaction hash if the operation was successful */
  transactionHash?: string;
  /** Error message if the operation failed */
  error?: string;
}

/**
 * High-level wrapper for the FHECounter smart contract.
 *
 * This class provides a TypeScript-friendly interface for interacting with
 * the FHECounter contract, handling encrypted operations, transaction management,
 * and error handling automatically.
 *
 * @example
 * ```typescript
 * const contract = new FHECounterContract('0x1234...');
 * contract.initialize(signer);
 *
 * // Increment the counter
 * const result = await contract.increment(5, userAddress);
 * if (result.success) {
 *   console.log('Transaction hash:', result.transactionHash);
 * }
 *
 * // Decrypt the counter value
 * const count = await contract.decryptCount(userAddress);
 * console.log('Current count:', count);
 * ```
 *
 * @class FHECounterContract
 */
export class FHECounterContract {
  /** @private Ethers.js contract instance */
  private contract: ethers.Contract | null = null;

  /** @private Contract address on the blockchain */
  private contractAddress: string;

  /**
   * Creates a new FHECounterContract instance.
   *
   * @param contractAddress - The deployed contract address
   */
  constructor(contractAddress: string) {
    this.contractAddress = contractAddress;
  }

  /**
   * Initializes the contract instance with an Ethereum signer.
   *
   * This method must be called before any contract operations can be performed.
   * It creates an ethers.js Contract instance with the provided signer for
   * transaction signing and state reading.
   *
   * @param signer - Ethereum signer for transaction signing
   *
   * @example
   * ```typescript
   * const contract = new FHECounterContract('0x1234...');
   * const signer = await provider.getSigner();
   * contract.initialize(signer);
   * ```
   */
  initialize(signer: ethers.Signer): void {
    this.contract = new ethers.Contract(
      this.contractAddress,
      FHE_COUNTER_ABI,
      signer
    );
  }

  /**
   * Retrieves the current encrypted counter value from the smart contract.
   *
   * This method calls the contract's `getCount()` function to fetch the encrypted
   * counter value. The returned value is a handle that can be used for decryption
   * if the user has proper authorization.
   *
   * @returns Promise resolving to the encrypted counter handle (hex string)
   *
   * @throws {Error} When contract is not initialized
   * @throws {Error} When contract call fails
   *
   * @example
   * ```typescript
   * const encryptedHandle = await contract.getCount();
   * console.log('Encrypted handle:', encryptedHandle);
   * ```
   */
  async getCount(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first with a valid signer.');
    }

    try {
      const result = await this.contract.getCount();

      // Validate the result format
      if (typeof result !== 'string' || !result.startsWith('0x')) {
        throw new Error('Invalid response format from contract');
      }

      return result;  // Now decodes correctly as bytes32 (hex string)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Categorize different types of errors
      if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        console.error('Network error getting count:', error);
        throw new Error('Network error: Unable to connect to the blockchain. Please check your connection.');
      } else if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
        console.error('Contract execution error getting count:', error);
        throw new Error('Contract error: The smart contract rejected the request.');
      } else if (errorMessage.includes('Invalid response format')) {
        console.error('Data format error getting count:', error);
        throw new Error('Data error: Unexpected response format from contract.');
      } else {
        console.error('Unexpected error getting count:', error);
        throw new Error(`Failed to get count: ${errorMessage}`);
      }
    }
  }

  /**
   * Increments the counter by an encrypted value.
   *
   * This method encrypts the increment value and submits it to the smart contract.
   * The operation is performed homomorphically, meaning the contract can add to
   * the counter without knowing the actual values involved.
   *
   * @param value - The amount to increment (positive integer, 0 to 4,294,967,295)
   * @param userAddress - Ethereum address of the user performing the increment
   *
   * @returns Promise resolving to operation result with success status and transaction hash
   *
   * @throws {Error} When contract is not initialized
   *
   * @example
   * ```typescript
   * const result = await contract.increment(5, '0x1234...');
   * if (result.success) {
   *   console.log('Increment successful, tx:', result.transactionHash);
   * } else {
   *   console.error('Increment failed:', result.error);
   * }
   * ```
   */
  async increment(value: number, userAddress: string): Promise<CounterOperationResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first with a valid signer.');
    }

    // Input validation
    if (!Number.isInteger(value) || value < 0 || value > 4294967295) {
      return {
        success: false,
        error: 'Invalid increment value. Must be a positive integer between 0 and 4,294,967,295.',
      };
    }

    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return {
        success: false,
        error: 'Invalid user address format. Must be a valid Ethereum address.',
      };
    }

    try {
      // Encrypt the input value
      const encrypted = await fhevmClient.encryptUint32(
        value,
        userAddress,
        this.contractAddress
      );

      // Call the contract
      const tx = await this.contract.increment(
        encrypted.inputEuint32,
        encrypted.inputProof
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Validate the transaction receipt
      const validation = validateTransactionReceipt(receipt);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Transaction validation failed: ${validation.error}`,
        };
      }

      return {
        success: true,
        transactionHash: validation.transactionHash!,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle user rejection gracefully (don't log as error)
      if (errorMessage.includes('User rejected') || errorMessage.includes('user denied') || errorMessage.includes('ACTION_REJECTED') || errorMessage.includes('rejected')) {
        // Don't log user rejections as errors
        return {
          success: false,
          error: 'Transaction cancelled by user',
        };
      }

      // Only log actual errors
      console.error('Error incrementing counter:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Decrements the counter by an encrypted value.
   *
   * This method encrypts the decrement value and submits it to the smart contract.
   * The operation is performed homomorphically, meaning the contract can subtract from
   * the counter without knowing the actual values involved.
   *
   * @param value - The amount to decrement (positive integer, 0 to 4,294,967,295)
   * @param userAddress - Ethereum address of the user performing the decrement
   *
   * @returns Promise resolving to operation result with success status and transaction hash
   *
   * @throws {Error} When contract is not initialized
   *
   * */
  async decrement(value: number, userAddress: string): Promise<CounterOperationResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized. Call initialize() first with a valid signer.');
    }

    // Input validation
    if (!Number.isInteger(value) || value < 0 || value > 4294967295) {
      return {
        success: false,
        error: 'Invalid decrement value. Must be a positive integer between 0 and 4,294,967,295.',
      };
    }

    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return {
        success: false,
        error: 'Invalid user address format. Must be a valid Ethereum address.',
      };
    }

    try {
      // Encrypt the input value
      const encrypted = await fhevmClient.encryptUint32(
        value,
        userAddress,
        this.contractAddress
      );

      // Call the contract
      const tx = await this.contract.decrement(
        encrypted.inputEuint32,
        encrypted.inputProof
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Validate the transaction receipt
      const validation = validateTransactionReceipt(receipt);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Transaction validation failed: ${validation.error}`,
        };
      }

      return {
        success: true,
        transactionHash: validation.transactionHash!,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle user rejection gracefully (don't log as error)
      if (errorMessage.includes('User rejected') || errorMessage.includes('user denied') || errorMessage.includes('ACTION_REJECTED') || errorMessage.includes('rejected')) {
        // Don't log user rejections as errors
        return {
          success: false,
          error: 'Transaction cancelled by user',
        };
      }

      // Only log actual errors
      console.error('Error decrementing counter:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Reset the counter to encrypted zero
   */
  async reset(): Promise<CounterOperationResult> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // Call the reset function (no parameters needed)
      const tx = await this.contract.reset();

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Validate the transaction receipt
      const validation = validateTransactionReceipt(receipt);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Transaction validation failed: ${validation.error}`,
        };
      }

      return {
        success: true,
        transactionHash: validation.transactionHash!,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Handle user rejection gracefully (don't log as error)
      if (errorMessage.includes('User rejected') || errorMessage.includes('user denied') || errorMessage.includes('ACTION_REJECTED') || errorMessage.includes('rejected')) {
        // Don't log user rejections as errors
        return {
          success: false,
          error: 'Transaction cancelled by user',
        };
      }

      // Only log actual errors
      console.error('Error resetting counter:', error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Checks if the current user can decrypt the counter value.
   *
   * This method verifies that the connected wallet address has permission
   * to decrypt the encrypted counter value. In FHEVM, decryption permissions
   * are typically managed through access control lists.
   *
   * @param userAddress - Ethereum address to check permissions for
   * @returns Promise resolving to true if user can decrypt, false otherwise
   *
   * @throws {Error} When contract is not initialized
   *
   * @example
   * ```typescript
   * const canDecrypt = await contract.canUserDecryptCount('0x1234...');
   * if (canDecrypt) {
   *   const count = await contract.decryptCount(userAddress);
   * }
   * ```
   */
  async canUserDecryptCount(userAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      // The contract's canUserDecrypt function uses msg.sender from the transaction
      // We call it from the user's address context to check their permissions
      const isAllowed = await this.contract.canUserDecrypt();
      return isAllowed;
    } catch (error) {
      console.error('Error checking decrypt permission for', userAddress, ':', error);
      return false;
    }
  }

  /**
   * Decrypt the current encrypted count value with enhanced validation and error handling.
   *
   * This method retrieves the encrypted handle from the contract and attempts to decrypt it
   * using the FHEVM client. It includes comprehensive validation and better error categorization.
   *
   * @param userAddress - User address for decryption permission check
   * @param abortSignal - Optional abort signal for cancellation
   * @returns Promise resolving to decrypted number or null if failed
   *
   * @throws {Error} When operation is cancelled or user lacks permission
   *
   * @example
   * ```typescript
   * try {
   *   const count = await contract.decryptCount('0x1234...', abortController.signal);
   *   if (count !== null) {
   *     console.log('Current count:', count);
   *   }
   * } catch (error) {
   *   if (error.message.includes('cancelled')) {
   *     console.log('Decryption was cancelled');
   *   }
   * }
   * ```
   */
  async decryptCount(userAddress: string, abortSignal?: AbortSignal): Promise<number | null> {
    // Input validation
    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      console.error('Invalid user address for decryption');
      return null;
    }

    // Check if operation was already cancelled
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled');
    }

    try {
      // First check if user has permission to decrypt
      const canDecrypt = await this.canUserDecryptCount(userAddress);
      if (!canDecrypt) {
        console.warn('User does not have permission to decrypt the counter value');
        return null;
      }

      // Get the encrypted handle
      const encryptedHandle = await this.getCount();

      // Validate the handle format before attempting decryption
      if (!encryptedHandle || typeof encryptedHandle !== 'string' || !encryptedHandle.startsWith('0x')) {
        console.error('Invalid encrypted handle format:', encryptedHandle);
        return null;
      }

      // Check if operation was cancelled during handle retrieval
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled');
      }

      // Attempt decryption with the FHEVM client
      const result = await fhevmClient.decryptUint32(
        encryptedHandle,
        this.contractAddress,
        userAddress,
        abortSignal
      );

      // Handle null result (user cancellation or permission denied)
      if (result === null) {
        // Don't log as error - this is expected for cancellation or no permission
        return null;
      }

      // Validate decrypted result (only for non-null values)
      if (typeof result !== 'number' || result < 0 || !Number.isInteger(result)) {
        console.error('Invalid decryption result:', result);
        return null;
      }

      return result;
    } catch (error) {
      // Re-throw cancellation errors immediately
      if (abortSignal?.aborted || (error instanceof Error && error.message.includes('Operation cancelled'))) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Categorize different types of decryption errors
      if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
        console.warn('Decryption failed: Insufficient permissions');
        return null;
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        console.error('Network error during decryption:', error);
        return null;
      } else if (errorMessage.includes('Invalid encrypted handle')) {
        console.error('Data format error during decryption:', error);
        return null;
      } else {
        console.error('Unexpected error decrypting count:', error);
        return null;
      }
    }
  }
}

// Factory function to create a counter contract instance
export const createFHECounterContract = (contractAddress?: string): FHECounterContract => {
  const address = contractAddress || CONTRACT_ADDRESSES.FHECounter;

  if (!address) {
    throw new Error('FHECounter contract address not found. Please check your environment variables.');
  }

  return new FHECounterContract(address);
};

/**
 * Configuration interface for gas estimation.
 */
export interface GasEstimationConfig {
  /** Buffer percentage to add to the estimated gas (default: 20%) */
  bufferPercentage?: number;
  /** Maximum gas limit to return (default: 500000) */
  maxGasLimit?: bigint;
  /** Fallback gas amount if estimation fails (default: 300000) */
  fallbackGas?: bigint;
  /** Number of retry attempts if estimation fails (default: 2) */
  retryAttempts?: number;
}

/**
 * Advanced utility function to estimate gas for transactions with configurable parameters.
 *
 * This function provides more robust gas estimation with retry logic, configurable buffers,
 * and better error handling compared to the basic version.
 *
 * @param contract - The ethers contract instance
 * @param method - The contract method name to estimate gas for
 * @param args - Arguments to pass to the contract method
 * @param config - Optional configuration for gas estimation behavior
 *
 * @returns Promise resolving to estimated gas amount with buffer applied
 *
 * @example
 * ```typescript
 * const gasLimit = await estimateGas(contract, 'increment', [encryptedValue, proof], {
 *   bufferPercentage: 25, // 25% buffer instead of default 20%
 *   maxGasLimit: BigInt(600000)
 * });
 * ```
 */
export const estimateGas = async (
  contract: ethers.Contract,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[],
  config: GasEstimationConfig = {}
): Promise<bigint> => {
  const {
    bufferPercentage = 20,
    maxGasLimit = BigInt(500000),
    fallbackGas = BigInt(300000),
    retryAttempts = 2
  } = config;

  let lastError: Error | null = null;

  // Retry logic for gas estimation
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      const gasEstimate = await contract[method].estimateGas(...args);

      // Apply buffer percentage
      const bufferedGas = (gasEstimate * BigInt(100 + bufferPercentage)) / BigInt(100);

      // Ensure we don't exceed the maximum gas limit
      const finalGas = bufferedGas > maxGasLimit ? maxGasLimit : bufferedGas;

      return finalGas;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown gas estimation error');

      if (attempt < retryAttempts) {
        // Wait briefly before retrying
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        continue;
      }
    }
  }

  console.error(`Gas estimation failed after ${retryAttempts + 1} attempts:`, lastError);

  // Return fallback gas amount
  return fallbackGas;
};

/**
 * Validates a transaction hash format.
 *
 * @param txHash - Transaction hash to validate
 * @returns true if the hash format is valid
 */
export const isValidTransactionHash = (txHash: string): boolean => {
  return typeof txHash === 'string' && /^0x[a-fA-F0-9]{64}$/.test(txHash);
};

/**
 * Interface representing the structure of a transaction receipt from ethers.
 * This ensures type safety when validating transaction receipts.
 */
export interface EthersTransactionReceipt {
  hash: string;
  blockNumber: number;
  gasUsed: bigint;
  status: number;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Validates a transaction receipt and extracts key information.
 *
 * @param receipt - Transaction receipt from ethers
 * @returns Validation result with extracted information
 */
export interface TransactionValidationResult {
  isValid: boolean;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: bigint;
  status?: number;
  error?: string;
}

export const validateTransactionReceipt = (receipt: unknown): TransactionValidationResult => {
  if (!receipt || typeof receipt !== 'object') {
    return {
      isValid: false,
      error: 'Receipt is null, undefined, or not an object'
    };
  }

  // Type guard to safely access receipt properties
  const receiptObj = receipt as Record<string, unknown>;

  // Check if transaction was successful
  if (receiptObj.status === 0) {
    return {
      isValid: false,
      transactionHash: typeof receiptObj.hash === 'string' ? receiptObj.hash : undefined,
      error: 'Transaction failed (reverted)'
    };
  }

  // Validate transaction hash
  if (typeof receiptObj.hash !== 'string' || !isValidTransactionHash(receiptObj.hash)) {
    return {
      isValid: false,
      error: 'Invalid or missing transaction hash'
    };
  }

  // Validate block number
  if (typeof receiptObj.blockNumber !== 'number' || receiptObj.blockNumber <= 0) {
    return {
      isValid: false,
      transactionHash: receiptObj.hash,
      error: 'Invalid or missing block number'
    };
  }

  // Validate status
  if (typeof receiptObj.status !== 'number') {
    return {
      isValid: false,
      transactionHash: receiptObj.hash,
      error: 'Invalid or missing transaction status'
    };
  }

  return {
    isValid: true,
    transactionHash: receiptObj.hash,
    blockNumber: receiptObj.blockNumber,
    gasUsed: typeof receiptObj.gasUsed === 'bigint' ? receiptObj.gasUsed : undefined,
    status: receiptObj.status
  };
};