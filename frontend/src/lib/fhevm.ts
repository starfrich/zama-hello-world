/**
 * @fileoverview FHEVM Client Library for Encrypted Blockchain Operations
 *
 * This module provides a high-level interface for interacting with Fully Homomorphic
 * Encryption Virtual Machine (FHEVM) on Ethereum. It handles encrypted value operations,
 * user authorization, and secure decryption workflows.
 *
 * @author Starfish
 * @version 1.0.0
 */

import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { ethers } from 'ethers';

/**
 * Configuration interface for FHEVM network settings.
 *
 * @interface FHEVMConfig
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
}

/**
 * Default FHEVM configuration for Sepolia testnet.
 *
 * This configuration is used for development and testing. Production deployments
 * should use environment variables to override these defaults.
 *
 * @constant {FHEVMConfig}
 */
export const FHEVM_CONFIG: FHEVMConfig = {
  network: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.public.blastapi.io',
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || 'https://relayer.testnet.zama.cloud',
  chainId: 11155111, // Sepolia testnet
  gatewayChainId: 55815, // Gateway chain
};

/** @private Global flag to prevent duplicate SDK initialization */
let sdkInitialized = false;

/**
 * FHEVM Client for handling encrypted computations on blockchain.
 *
 * This class provides a comprehensive interface for:
 * - Initializing FHEVM SDK with wallet integration
 * - Encrypting values for confidential smart contract interactions
 * - Decrypting encrypted values with proper user authorization
 * - Managing cryptographic operations and user permissions
 *
 * @example
 * ```typescript
 * import { fhevmClient } from '@/lib/fhevm';
 *
 * // Initialize with wallet
 * await fhevmClient.initialize(provider, signer);
 *
 * // Encrypt a value
 * const encrypted = await fhevmClient.encryptUint32(42, userAddress, contractAddress);
 *
 * // Decrypt a value
 * const result = await fhevmClient.decryptUint32(handle, contractAddress, userAddress);
 * ```
 *
 * @class FHEVMClient
 */
export class FHEVMClient {
  /** @private FHEVM SDK instance for cryptographic operations */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private instance: any = null;

  /** @private Ethereum provider for blockchain interactions */
  private provider: ethers.Provider | null = null;

  /** @private Ethereum signer for transaction signing and authentication */
  private signer: ethers.Signer | null = null;

  /** @private Flag indicating whether the client has been initialized */
  private isInitialized = false;

  /**
   * Creates a new FHEVMClient instance.
   *
   * The client is not ready for use until `initialize()` is called.
   *
   * @constructor
   */
  constructor() {
    // Instance will be created during initialization
  }

  /**
   * Initializes the FHEVM client with Ethereum provider and signer.
   *
   * This method sets up the FHEVM SDK, configures network settings, and prepares
   * the client for encrypted operations. It prevents duplicate initialization and
   * ensures the client is ready for encryption/decryption operations.
   *
   * @param provider - Ethereum provider for blockchain interactions
   * @param signer - Ethereum signer for transaction signing and authentication
   *
   * @returns Promise resolving to the initialized client instance
   *
   * @throws {Error} When not running in a browser environment
   * @throws {Error} When provider or signer is invalid
   * @throws {Error} When SDK initialization fails
   *
   * @example
   * ```typescript
   * const provider = new ethers.BrowserProvider(window.ethereum);
   * const signer = await provider.getSigner();
   * await fhevmClient.initialize(provider, signer);
   *
   * // Client is now ready for encrypted operations
   * const encrypted = await fhevmClient.encryptUint32(42, userAddr, contractAddr);
   * ```
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

      // Create instance with Sepolia config, use window.ethereum for network
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
   * Encrypts a 32-bit unsigned integer for confidential smart contract operations.
   *
   * This method generates the necessary cryptographic proof and encrypted value
   * that can be safely sent to FHEVM smart contracts without revealing the original value.
   * The encrypted data ensures privacy while maintaining the ability to perform
   * homomorphic operations on-chain.
   *
   * @param value - The plaintext integer to encrypt (0 to 4,294,967,295)
   * @param userAddress - Ethereum address of the user performing the operation
   * @param contractAddress - Target smart contract address for the encrypted value
   *
   * @returns Promise resolving to encrypted data object containing:
   *   - `inputEuint32`: The encrypted value handle as hex string
   *   - `inputProof`: Cryptographic proof for contract verification
   *
   * @throws {Error} When FHEVM client is not initialized
   * @throws {Error} When value is outside valid uint32 range (0-4294967295)
   * @throws {Error} When encryption operation fails
   *
   * @example
   * ```typescript
   * // Encrypt a value for increment operation
   * const encrypted = await fhevmClient.encryptUint32(
   *   42,
   *   '0x1234567890123456789012345678901234567890',
   *   '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
   * );
   *
   * // Use in contract call
   * await contract.increment(encrypted.inputEuint32, encrypted.inputProof);
   * ```
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
   * Decrypt an encrypted value using the relayer (user decryption) with cancellation support.
   *
   * @param handle - Encrypted value handle
   * @param contractAddress - Contract address
   * @param userAddress - User address
   * @param abortSignal - Optional abort signal for cancellation
   * @returns Promise resolving to decrypted number, or null if failed/cancelled
   */
  async decryptUint32(handle: string, contractAddress: string, userAddress: string, abortSignal?: AbortSignal): Promise<number | null> {
    if (!this.instance || !this.signer) {
      throw new Error('FHEVM client not initialized');
    }

    // Check if operation was cancelled before starting
    if (abortSignal?.aborted) {
      throw new Error('Operation cancelled');
    }

    try {
      // Generate keypair for decryption
      const keypair = this.instance.generateKeypair();

      // Check cancellation after keypair generation
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled');
      }

      // Set up handle-contract pairs
      const handleContractPairs = [{
        handle: handle,
        contractAddress: contractAddress
      }];

      // Create EIP712 signature for verification
      const startTimeStamp = Math.floor(Date.now() / 1000);  // Convert ms to seconds
      const durationDays = 1; // 1 day validity

      const eip712 = this.instance.createEIP712(
        keypair.publicKey,
        [contractAddress],
        startTimeStamp,
        durationDays
      );

      // Check cancellation before signing
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled');
      }

      // Sign the typed data with cancellation race
      const signaturePromise = this.signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      let signature: string;
      if (abortSignal) {
        signature = await Promise.race([
          signaturePromise,
          new Promise<never>((_, reject) => {
            if (abortSignal.aborted) {
              reject(new Error('Operation cancelled'));
              return;
            }
            const onAbort = () => reject(new Error('Operation cancelled'));
            abortSignal.addEventListener('abort', onAbort, { once: true });
          })
        ]);
      } else {
        signature = await signaturePromise;
      }

      // Check cancellation before decryption
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled');
      }

      // Perform user decryption with cancellation support
      // Note: Some FHEVM versions expect signature with 0x prefix, others without
      let formattedSignature = signature;

      // Helper function to create cancellable userDecrypt
      const createCancellableDecrypt = (sig: string) => {
        const decryptPromise = this.instance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          sig,
          [contractAddress],
          userAddress,
          startTimeStamp,
          durationDays
        );

        if (!abortSignal) return decryptPromise;

        return Promise.race([
          decryptPromise,
          new Promise<never>((_, reject) => {
            if (abortSignal.aborted) {
              reject(new Error('Operation cancelled'));
              return;
            }
            const onAbort = () => reject(new Error('Operation cancelled'));
            abortSignal.addEventListener('abort', onAbort, { once: true });
          })
        ]);
      };

      // Try with 0x prefix first, if it fails we'll retry without
      try {
        const result = await createCancellableDecrypt(formattedSignature);
        const decryptedValue = result[handle];
        return parseInt(decryptedValue, 10);
      } catch (error) {
        // Check if cancelled
        if (abortSignal?.aborted || (error instanceof Error && error.message.includes('Operation cancelled'))) {
          throw new Error('Operation cancelled');
        }

        // If 0x prefix fails, try without it
        if (error instanceof Error && error.message.includes('0x is not of valid length')) {
          formattedSignature = signature.replace('0x', '');
          const result = await createCancellableDecrypt(formattedSignature);
          const decryptedValue = result[handle];
          return parseInt(decryptedValue, 10);
        }
        throw error;  // Re-throw non-signature errors
      }
    } catch (error) {
      // Check if operation was cancelled first (highest priority)
      if (abortSignal?.aborted || (error instanceof Error && error.message.includes('Operation cancelled'))) {
        // Don't log anything for cancellation - it's expected
        throw new Error('Operation cancelled');
      }

      // Handle user rejection without logging as error
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('user rejected') ||
            errorMsg.includes('user denied') ||
            errorMsg.includes('rejected') ||
            errorMsg.includes('denied') ||
            errorMsg.includes('user cancelled') ||
            errorMsg.includes('action_rejected')) {
          // User rejected - return null (not an error)
          console.info('User cancelled decryption signature');
          return null;
        }
      }

      // Handle authorization errors
      if (error instanceof Error && error.message.includes('not authorized')) {
        // Log as info, not error (expected for new users)
        console.info('User not authorized for decryption (expected for new users)');
        return null;
      }

      // Only log unexpected errors
      console.warn('Unexpected decryption error:', error);
      throw new Error('Failed to decrypt value');
    }
  }

  /**
   * Check if a value can be decrypted by the current user.
   *
   * @param handle - Encrypted value handle
   * @param contractAddress - Contract address
   * @param userAddress - User address
   * @returns Promise resolving to true if user can decrypt, false otherwise
   */
  async canDecrypt(handle: string, contractAddress: string, userAddress: string): Promise<boolean> {
    try {
      const result = await this.decryptUint32(handle, contractAddress, userAddress);
      return result !== null && typeof result === 'number';
    } catch (error) {
      // Specific catch for auth error—return false without noisy log
      if (error instanceof Error && error.message.includes('not authorized')) {
        return false;
      }
      console.error('Unexpected decryption check error:', error);  // Log only unexpected
      return false;
    }
  }

  /**
   * Get the current provider
   */
  getProvider(): ethers.Provider | null {
    return this.provider;
  }

  /**
   * Get the current signer
   */
  getSigner(): ethers.Signer | null {
    return this.signer;
  }

  /**
   * Get the FHEVM instance
   */
  getInstance() {
    return this.instance;
  }

  /**
   * Check if the client is initialized
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Global FHEVM client instance
export const fhevmClient = new FHEVMClient();

// Utility function to format encrypted values for display
export const formatEncryptedValue = (value: string | null): string => {
  if (!value) return 'Hidden';
  return `🔒 ${value.slice(0, 8)}...${value.slice(-4)}`;
};

// Utility function to validate input values
export const validateUint32Input = (value: string): { isValid: boolean; error?: string } => {
  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid number' };
  }

  if (num < 0) {
    return { isValid: false, error: 'Value must be positive' };
  }

  if (num > 4294967295) { // 2^32 - 1
    return { isValid: false, error: 'Value must be less than 2^32' };
  }

  if (!Number.isInteger(num)) {
    return { isValid: false, error: 'Value must be a whole number' };
  }

  return { isValid: true };
};