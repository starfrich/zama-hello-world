import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { ethers } from 'ethers';

export interface FHEVMConfig {
  network: string;
  relayerUrl: string;
  chainId: number;
  gatewayChainId: number;
}

// Sepolia testnet configuration for FHEVM
export const FHEVM_CONFIG: FHEVMConfig = {
  network: process.env.NEXT_PUBLIC_RPC_URL || 'https://eth-sepolia.public.blastapi.io',
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || 'https://relayer.testnet.zama.cloud',
  chainId: 11155111, // Sepolia testnet
  gatewayChainId: 55815, // Gateway chain
};

let sdkInitialized = false;

export class FHEVMClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private instance: any = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private isInitialized = false;

  constructor() {
    // Instance will be created during initialization
  }

  /**
   * Initialize the FHEVM client with a provider and signer
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
      if (!sdkInitialized) {  // <-- TAMB AH DI SINI (line ~39)
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
   * Encrypt a 32-bit unsigned integer for use with FHEVM
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
   * Decrypt an encrypted value using the relayer (user decryption)
   */
  async decryptUint32(handle: string, contractAddress: string, userAddress: string) {
    if (!this.instance || !this.signer) {
      throw new Error('FHEVM client not initialized');
    }

    try {
      // Generate keypair for decryption
      const keypair = this.instance.generateKeypair();

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

      // Sign the typed data
      const signature = await this.signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      // Perform user decryption
      // Note: Some FHEVM versions expect signature with 0x prefix, others without
      let formattedSignature = signature;

      // Try with 0x prefix first, if it fails we'll retry without
        try {
        const result = await this.instance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          formattedSignature,
          [contractAddress],
          userAddress,
          startTimeStamp,
          durationDays
        );

        const decryptedValue = result[handle];
        return parseInt(decryptedValue, 10);
      } catch (error) {
        // If 0x prefix fails, try without it
        if (error instanceof Error && error.message.includes('0x is not of valid length')) {
          formattedSignature = signature.replace('0x', '');
          const result = await this.instance.userDecrypt(
            handleContractPairs,
            keypair.privateKey,
            keypair.publicKey,
            formattedSignature,
            [contractAddress],
            userAddress,
            startTimeStamp,
            durationDays
          );

          const decryptedValue = result[handle];
          return parseInt(decryptedValue, 10);
        }
        throw error;  // Re-throw non-signature errors
      }
    } catch (error) {
      console.warn('Decryption failed (likely authorization):', error);  // Warn, bukan error, biar console gak merah
      if (error instanceof Error && error.message.includes('not authorized')) {
        // Custom handling: Return null + hint
        return { value: null, reason: 'User not authorized. Perform increment/decrement first to grant permission.' };
      }
      throw new Error('Failed to decrypt value');
    }
  }

  /**
   * Check if a value can be decrypted by the current user
   */
  async canDecrypt(handle: string, contractAddress: string, userAddress: string): Promise<boolean> {
    try {
      const result = await this.decryptUint32(handle, contractAddress, userAddress);
      return result !== null && typeof result === 'number';  // Adjust buat handle new return type
    } catch (error) {
      // Specific catch buat auth error—return false tanpa log berisik
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