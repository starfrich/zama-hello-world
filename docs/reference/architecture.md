# Architecture Overview

This document provides a comprehensive overview of the Hello FHEVM project architecture, explaining how all components work together to create a secure, confidential decentralized application.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Web Browser   │  │     Wallet      │  │   Mobile App │ │
│  │  (React/Next)   │  │   (MetaMask)    │  │   (Future)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE ENCRYPTION                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              FHEVM.js SDK                              │ │
│  │  • Encrypt user inputs before blockchain submission    │ │
│  │  • Decrypt authorized data for display                 │ │
│  │  • Manage encryption keys and proofs                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     BLOCKCHAIN LAYER                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Sepolia       │  │   FHEVM Smart   │  │  Access      │ │
│  │   Testnet       │  │   Contracts     │  │  Control     │ │
│  │                 │  │                 │  │  Lists (ACL) │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   HOMOMORPHIC ENCRYPTION                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Zama TFHE Engine                       │ │
│  │  • Performs computations on encrypted data             │ │
│  │  • Maintains confidentiality throughout operations     │ │
│  │  • Manages threshold decryption protocols              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Component Architecture

### 1. **Frontend Layer**

#### **Next.js Application Structure**
```
frontend/
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── fhevm/
│   │   │   └── Counter.tsx
│   │   └── ui/
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── progress.tsx
│   │       ├── sonner.tsx
│   │       ├── textarea.tsx
│   │       ├── client-wrapper.tsx
│   │       └── providers.tsx
│   │
│   ├── hooks/
│   │   └── useFHEVM.ts
│   │
│   └── lib/
│       ├── contracts.ts
│       ├── fhevm.ts
│       ├── utils.ts
│       └── wallet.ts
│
└── .env.local.example
```

#### **Key Design Patterns**

**Hook-Based State Management:**
```typescript
// Actual implementation uses direct hooks instead of providers
// hooks/useFHEVM.ts
export const useFHEVM = (contractAddress?: string) => {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [isInitialized, setIsInitialized] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    initializing: false,
    refreshing: false,
    decrypting: false,
    incrementing: false,
    decrementing: false,
    resetting: false,
  });

  const initialize = useCallback(async () => {
    if (!walletClient || !address || !isConnected) return;

    const provider = new ethers.BrowserProvider(walletClient);
    const signer = await provider.getSigner();

    await fhevmClient.initialize(provider, signer);
    // ... contract initialization
  }, [walletClient, address, isConnected, contractAddress]);

  return {
    isInitialized,
    isLoading: Object.values(loadingStates).some(loading => loading),
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
    error,
  };
};
```

**Component-Based Architecture:**
```typescript
// Direct hook usage in components
export function Counter({ contractAddress }: CounterProps) {
  const { isConnected } = useAccount();
  const [inputValue, setInputValue] = useState('');

  const {
    isInitialized,
    isLoading,
    encryptedCount,
    decryptedCount,
    canDecrypt,
    incrementCounter,
    decrementCounter,
    resetCounter,
    refreshCount,
    decryptCount,
    error,
  } = useFHEVM(contractAddress);

  // Component logic...
}
```

### 2. **Smart Contract Layer**

#### **Contract Architecture**
```
contracts/
├── contracts/
│   ├── FHECounter.sol
├── deploy/
│   ├── deploy.ts
├── tasks/
│   ├── account.ts
│   └── FHECounter.ts
└── hardhat.config.ts
```

#### **Contract Design Principles**

**Encrypted State Management:**
```solidity
// Use encrypted types for sensitive data
euint32 private _count;  // Encrypted counter value

// Initialize with encrypted zero
constructor() {
    _count = FHE.asEuint32(0);
    FHE.allowThis(_count);  // Grant contract access
}
```

**Access Control Lists (ACL):**
```solidity
// Grant permissions after operations
function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedInput = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.add(_count, encryptedInput);
    
    // Update ACL: Contract and user access
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

**Event Emission for Off-Chain Tracking:**
```solidity
event CountUpdated(address indexed user, string operation);

// Emit after each update
emit CountUpdated(msg.sender, "increment");
```

### 3. **FHEVM Client Layer**

#### **Client-Side Encryption Flow**
```typescript
// lib/fhevm.ts - Actual Implementation
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';
import { ethers } from 'ethers';

export class FHEVMClient {
  private instance: any = null;
  private provider: ethers.Provider | null = null;
  private signer: ethers.Signer | null = null;
  private isInitialized = false;

  async initialize(provider: ethers.Provider, signer: ethers.Signer) {
    if (this.isInitialized) return this;

    if (typeof window === 'undefined') {
      throw new Error('FHEVM client can only be initialized in browser environment');
    }

    this.provider = provider;
    this.signer = signer;

    // Initialize SDK once globally
    if (!sdkInitialized) {
      await initSDK();
      sdkInitialized = true;
    }

    // Use SepoliaConfig with window.ethereum
    const config = {
      ...SepoliaConfig,
      network: window.ethereum,
    };

    this.instance = await createInstance(config);
    this.isInitialized = true;
    return this;
  }

  async encryptUint32(value: number, userAddress: string, contractAddress: string) {
    if (!this.instance) throw new Error('FHEVM client not initialized');

    const buffer = this.instance.createEncryptedInput(contractAddress, userAddress);
    buffer.add32(value);
    const ciphertexts = await buffer.encrypt();

    return {
      inputEuint32: ciphertexts.handles[0],
      inputProof: ciphertexts.inputProof,
    };
  }

  async decryptUint32(handle: string, contractAddress: string, userAddress: string, abortSignal?: AbortSignal): Promise<number | null> {
    if (!this.instance || !this.signer) throw new Error('FHEVM client not initialized');

    try {
      // Generate keypair and create EIP712 signature
      const keypair = this.instance.generateKeypair();
      const eip712 = this.instance.createEIP712(
        keypair.publicKey,
        [contractAddress],
        Math.floor(Date.now() / 1000),
        1
      );

      const signature = await this.signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );

      const result = await this.instance.userDecrypt(
        [{ handle: handle, contractAddress: contractAddress }],
        keypair.privateKey,
        keypair.publicKey,
        signature.replace(/^0x/, ''),
        [contractAddress],
        userAddress,
        Math.floor(Date.now() / 1000),
        1
      );

      return parseInt(result[handle], 10);
    } catch (error) {
      console.error('Error decrypting value:', error);
      return null;
    }
  }
}

// Global instance for use across the application
export const fhevmClient = new FHEVMClient();
```

#### **Gas Estimation and Optimization**
```typescript
// Custom gas estimation for TFHE operations
export const estimateTFHEGas = async (
  contract: any,
  method: string,
  args: any[],
  operationType: 'encrypt' | 'decrypt' | 'compute' = 'compute'
): Promise<bigint> => {
  try {
    const baseEstimate = await contract[method].estimateGas(...args);
    // Apply buffer for TFHE unpredictability (e.g., 20-50%)
    const bufferedGas = (baseEstimate * BigInt(120)) / BigInt(100);
    return bufferedGas;
  } catch (error) {
    // Fallback gas
    return BigInt(500000);
  }
};
```

## ⚡ Performance Optimizations

### 1. **Client-Side Optimizations:**
```typescript
// Memoized encryption operations
const memoizedEncrypt = useMemo(() =>
  debounce(async (value) => await fhevm.encrypt32(value), 300),
  [fhevm]
);

// Optimistic UI updates
const handleIncrement = async (value) => {
  setOptimisticCount(prev => prev + value); // Immediate UI update
  await performRealIncrement(value);        // Actual operation
};
```

### 2. **Contract Optimizations:**
```solidity
// Batch operations to reduce gas costs
function batchOperations(
  externalEuint32[] calldata inputs,
  bytes[] calldata proofs
) external {
  euint32 sum = FHE.asEuint32(0);
  for (uint i = 0; i < inputs.length; i++) {
    sum = FHE.add(sum, FHE.fromExternal(inputs[i], proofs[i]));
  }
  _count = FHE.add(_count, sum);

  // Single ACL update
  FHE.allowThis(_count);
  FHE.allow(_count, msg.sender);
}
```

### 3. **Network Optimizations:**
```typescript
// Connection pooling and retry logic
const optimizedClient = {
  maxRetries: 3,
  retryDelay: 1000,
  connectionPool: 5,
  timeout: 30000,
};
```

## 🧪 Testing Architecture

### **Multi-Layer Testing Strategy**

1. **Unit Tests:**
```typescript
// Individual function testing (using actual API)
describe('FHEVMClient', () => {
  it('should encrypt 32-bit values correctly', async () => {
    const encrypted = await fhevmClient.encryptUint32(42, userAddress, contractAddress);
    expect(encrypted.inputEuint32).toBeDefined();
    expect(encrypted.inputProof).toBeDefined();
  });

  it('should decrypt values with proper permissions', async () => {
    const handle = '0x1234...';
    const decrypted = await fhevmClient.decryptUint32(handle, contractAddress, userAddress);
    expect(typeof decrypted).toBe('number');
  });
});
```

2. **Integration Tests:**
```typescript
// Component integration testing
describe('Counter Component', () => {
  it('should handle full encryption-contract-decryption flow', async () => {
    // Setup
    const { container } = render(<Counter />);

    // Encrypt and submit
    fireEvent.change(getByPlaceholder('Enter value'), { target: { value: '5' } });
    fireEvent.click(getByText('Increment'));

    // Verify contract interaction
    await waitFor(() => {
      expect(mockContract.increment).toHaveBeenCalled();
    });
  });
});
```

3. **End-to-End Tests:**
```typescript
// Full application flow testing
describe('FHEVM Application E2E', () => {
  it('should complete full user journey', async () => {
    // Connect wallet
    await page.click('[data-testid="connect-wallet"]');

    // Perform operations
    await page.fill('[data-testid="value-input"]', '10');
    await page.click('[data-testid="increment-button"]');

    // Verify results
    await expect(page.locator('[data-testid="counter-value"]')).toBeVisible();
  });
});
```

## 🔧 Development Architecture

### **Build and Deployment Pipeline**

```yaml
# CI/CD Pipeline Architecture
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │───>│   Build     │───>│   Deploy    │
│   Actions   │    │   Process   │    │   Process   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Code        │    │ • Tests     │    │ • Sepolia   │
│ Quality     │    │ • Build     │    │ • Vercel    │
│ Checks      │    │ • Security  │    │ • IPFS      │
└─────────────┘    └─────────────┘    └─────────────┘
```

### **Environment Management**

```typescript
// Environment-specific configurations
const environments = {
  development: {
    contracts: {
      FHECounter: "0x..." // Local deployment
    },
    relayer: "http://localhost:8545",
    chainId: 31337
  },

  staging: {
    contracts: {
      FHECounter: "0x..." // Sepolia deployment
    },
    relayer: "https://relayer.testnet.zama.cloud",
    chainId: 11155111
  }
};
```

## 📋 Architecture Principles

### **Design Principles**

1. **Security First:**
   - All sensitive data encrypted by default
   - Minimal trust assumptions
   - Defense in depth

2. **Privacy by Design:**
   - Client-side encryption
   - Granular access control
   - Data minimization

3. **Developer Experience:**
   - Clean, intuitive APIs
   - Comprehensive error handling
   - Extensive documentation

4. **Performance Optimized:**
   - Efficient encryption algorithms
   - Minimized gas costs
   - Responsive user interface

5. **Modular and Extensible:**
   - Component-based architecture
   - Plugin system ready
   - Future-proof design

### **Scalability Considerations**

1. **Horizontal Scaling:**
   - Stateless frontend components
   - Distributed relayer network
   - Multiple blockchain support

2. **Performance Scaling:**
   - Optimized encryption operations
   - Batch processing capabilities
   - Efficient state management

3. **Development Scaling:**
   - Clear separation of concerns
   - Standardized interfaces
   - Comprehensive testing

This architecture provides a robust foundation for building confidential dApps while maintaining security, performance, and developer productivity.