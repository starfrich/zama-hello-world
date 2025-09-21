import { ethers } from 'ethers';
import { fhevmClient } from './fhevm';

// FHECounter contract ABI - we'll update this after compilation
export const FHE_COUNTER_ABI = [
  {
    "inputs": [],
    "name": "getCount",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes"
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
  }
];

// Contract addresses - will be populated after deployment
export const CONTRACT_ADDRESSES = {
  FHECounter: process.env.NEXT_PUBLIC_FHE_COUNTER_ADDRESS || '',
};

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

  /**
   * Initialize the contract with a signer
   */
  initialize(signer: ethers.Signer): void {
    this.contract = new ethers.Contract(
      this.contractAddress,
      FHE_COUNTER_ABI,
      signer
    );
  }

  /**
   * Get the current encrypted count
   */
  async getCount(): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const result = await this.contract.getCount();
      return result;
    } catch (error) {
      console.error('Error getting count:', error);
      throw new Error('Failed to get count');
    }
  }

  /**
   * Increment the counter by an encrypted value
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
      console.error('Error incrementing counter:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Decrement the counter by an encrypted value
   */
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
      console.error('Error decrementing counter:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Decrypt the current count for the user
   */
  async decryptCount(userAddress: string): Promise<number | null> {
    try {
      const encryptedCount = await this.getCount();
      const decryptedValue = await fhevmClient.decryptUint32(
        encryptedCount,
        this.contractAddress,
        userAddress
      );
      return decryptedValue;
    } catch (error) {
      console.error('Error decrypting count:', error);
      return null;
    }
  }

  /**
   * Check if the user can decrypt the current count
   */
  async canUserDecryptCount(userAddress: string): Promise<boolean> {
    try {
      const encryptedCount = await this.getCount();
      return await fhevmClient.canDecrypt(
        encryptedCount,
        this.contractAddress,
        userAddress
      );
    } catch {
      return false;
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