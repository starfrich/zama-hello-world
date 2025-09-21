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
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getCount();
      return result;  // Now decodes correctly as bytes32 (hex string)
    } catch (error) {
      console.error('Error getting count:', error);
      throw new Error('Failed to get count');
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
      throw new Error('Contract not initialized');
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

      return {
        success: true,
        transactionHash: receipt.hash,
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
   * @example
   * ```typescript\n   * const result = await contract.decrement(3, '0x1234...');\n   * if (result.success) {\n   *   console.log('Decrement successful, tx:', result.transactionHash);\n   * } else {\n   *   console.error('Decrement failed:', result.error);\n   * }\n   * ```\n   */
  async decrement(value: number, userAddress: string): Promise<CounterOperationResult> {
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

      // Call the contract
      const tx = await this.contract.decrement(
        encrypted.inputEuint32,
        encrypted.inputProof
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
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

      return {
        success: true,
        transactionHash: receipt.hash,
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

  async canUserDecryptCount(_userAddress: string): Promise<boolean> {
    if (!this.contract) throw new Error('Contract not initialized');
    try {
      // FHE.isSenderAllowed uses msg.sender automatically
      const isAllowed = await this.contract.canUserDecrypt();
      return isAllowed;
    } catch {
      return false;
    }
  }

  /**
   * Decrypt the current encrypted count value.
   *
   * @param userAddress - User address for decryption permission check
   * @param abortSignal - Optional abort signal for cancellation
   * @returns Promise resolving to decrypted number or null if failed
   */
  async decryptCount(userAddress: string, abortSignal?: AbortSignal): Promise<number | null> {
    try {
      const encryptedCount = await this.getCount();
      const result = await fhevmClient.decryptUint32(encryptedCount, this.contractAddress, userAddress, abortSignal);
      return result;
    } catch (error) {
      // Re-throw cancellation errors
      if (abortSignal?.aborted || (error instanceof Error && error.message.includes('Operation cancelled'))) {
        throw error;
      }
      console.error('Error decrypting count:', error);
      return null;
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

// Utility function to estimate gas for transactions
export const estimateGas = async (
  contract: ethers.Contract,
  method: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[]
): Promise<bigint> => {
  try {
    const gasEstimate = await contract[method].estimateGas(...args);
    // Add 20% buffer for gas estimation
    return (gasEstimate * BigInt(120)) / BigInt(100);
  } catch (error) {
    console.error('Gas estimation failed:', error);
    // Return a reasonable default if estimation fails
    return BigInt(300000);
  }
};