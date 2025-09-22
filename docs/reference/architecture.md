# Architecture Overview

This document provides a comprehensive overview of the Hello FHEVM project architecture, explaining how all components work together to create a secure, confidential decentralized application.

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Web Browser   │  │     Wallet      │  │   Mobile App    │ │
│  │  (React/Next)   │  │   (MetaMask)    │  │   (Future)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE ENCRYPTION                   │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              FHEVM.js SDK                               │ │
│  │  • Encrypt user inputs before blockchain submission    │ │
│  │  • Decrypt authorized data for display                 │ │
│  │  • Manage encryption keys and proofs                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     BLOCKCHAIN LAYER                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Sepolia       │  │   FHEVM Smart   │  │   Access        │ │
│  │   Testnet       │  │   Contracts     │  │   Control       │ │
│  │                 │  │                 │  │   Lists (ACL)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   HOMOMORPHIC ENCRYPTION                    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 Zama TFHE Engine                        │ │
│  │  • Performs computations on encrypted data             │ │
│  │  • Maintains confidentiality throughout operations     │ │
│  │  • Manages threshold decryption protocols              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Component Architecture

### 1. **Frontend Layer**

#### **Next.js Application Structure**
```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Main application page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── fhevm/             # FHEVM-specific components
│   │   │   ├── Counter.tsx    # Main counter interface
│   │   │   └── EncryptionStatus.tsx
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   └── providers.tsx      # Context providers
│   ├── hooks/
│   │   ├── useFHEVM.ts       # FHEVM operations
│   │   ├── useContract.ts    # Contract interactions
│   │   └── useWallet.ts      # Wallet management
│   ├── lib/
│   │   ├── fhevm.ts          # FHEVM client setup
│   │   ├── contracts.ts      # Contract configurations
│   │   └── utils.ts          # Utility functions
│   └── types/
│       ├── fhevm.ts          # FHEVM type definitions
│       └── contracts.ts      # Contract types
```

#### **Key Design Patterns**

**Provider Pattern for State Management:**
```typescript
// Context-based state management
const FHEVMProvider = ({ children }) => {
  const [fhevmInstance, setFhevmInstance] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  return (
    <FHEVMContext.Provider value={{ fhevmInstance, isInitialized }}>
      {children}
    </FHEVMContext.Provider>
  );
};
```

**Hook-Based Architecture:**
```typescript
// Custom hooks for clean separation of concerns
const useFHEVM = () => {
  // Encryption/decryption logic
};

const useContract = () => {
  // Smart contract interactions
};

const useWallet = () => {
  // Wallet connection management
};
```

### 2. **Smart Contract Layer**

#### **Contract Architecture**
```
contracts/
├── contracts/
│   ├── FHECounter.sol         # Main application contract
│   ├── interfaces/
│   │   └── IFHECounter.sol    # Contract interface
│   └── utils/
│       └── AccessControl.sol  # Access control utilities
├── deploy/
│   ├── 00-deploy-counter.ts   # Deployment script
│   └── verify.ts              # Contract verification
├── test/
│   ├── FHECounter.test.ts     # Comprehensive tests
│   └── utils/
│       └── fhevm.ts           # Test utilities
└── hardhat.config.ts          # Hardhat configuration
```

#### **Contract Design Principles**

**Encrypted State Management:**
```solidity
contract FHECounter {
    euint32 private _count;          // Encrypted counter value
    mapping(address => euint32) private _userCounts; // Per-user counts

    // Events for off-chain tracking
    event CountUpdated(address indexed user, string operation);
}
```

**Access Control List (ACL) Management:**
```solidity
// Grant permissions for encrypted data access
function grantAccess(euint32 encryptedValue, address user) internal {
    FHE.allowThis(encryptedValue);  // Contract access
    FHE.allow(encryptedValue, user); // User access
}
```

**Secure Operation Patterns:**
```solidity
function secureIncrement(externalEuint32 input, bytes calldata proof) external {
    // 1. Validate and convert input
    euint32 encryptedInput = FHE.fromExternal(input, proof);

    // 2. Perform encrypted computation
    _count = FHE.add(_count, encryptedInput);

    // 3. Update access permissions
    grantAccess(_count, msg.sender);

    // 4. Emit event
    emit CountUpdated(msg.sender, "increment");
}
```

### 3. **Encryption Layer**

#### **FHEVM Client Architecture**
```typescript
class FHEVMClient {
  private static instance: FhevmInstance | null = null;

  // Singleton pattern for instance management
  public static async initialize(config: FHEVMConfig) {
    if (!this.instance) {
      this.instance = await createInstance(config);
    }
    return this.instance;
  }

  // Type-safe encryption methods
  public static async encrypt32(value: number): Promise<EncryptedValue> {
    return await this.instance.encrypt32(value);
  }

  public static async decrypt32(handle: string): Promise<number> {
    return await this.instance.decrypt32(handle);
  }
}
```

#### **Encryption Flow**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │    │   Client    │    │ Blockchain  │
│   Input     │───▶│ Encryption  │───▶│  Storage    │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                                      │
       │            ┌─────────────┐           │
       └───────────▶│   Zama      │◀──────────┘
                    │  Relayer    │
                    │             │
                    └─────────────┘
```

## 🔒 Security Architecture

### **Multi-Layer Security Model**

1. **Client-Side Security:**
   - Input validation before encryption
   - Secure key management
   - Protection against client-side attacks

2. **Transport Security:**
   - HTTPS for all communications
   - Secure WebSocket connections
   - Certificate pinning

3. **Blockchain Security:**
   - Access control lists (ACL)
   - Encrypted state validation
   - Secure contract patterns

4. **Cryptographic Security:**
   - TFHE encryption scheme
   - Threshold decryption
   - Zero-knowledge proofs

### **Access Control Architecture**

```solidity
// Three-tier access control
contract FHECounter {
    // 1. Contract-level access (always granted)
    modifier onlyContract() {
        require(msg.sender == address(this), "Contract access only");
        _;
    }

    // 2. Owner-level access (administrative)
    modifier onlyOwner() {
        require(msg.sender == owner, "Owner access only");
        _;
    }

    // 3. User-level access (operation-based)
    modifier hasAccess(euint32 value) {
        require(FHE.isSenderAllowed(value), "Access denied");
        _;
    }
}
```

## 📊 Data Flow Architecture

### **Encryption Data Flow**
```
User Input (42)
    ↓
Client Validation
    ↓
FHEVM.encrypt32(42)
    ↓
EncryptedValue { handles: [...], inputProof: [...] }
    ↓
Smart Contract Call
    ↓
FHE.fromExternal(encrypted, proof)
    ↓
Encrypted Storage on Blockchain
```

### **Decryption Data Flow**
```
Encrypted Handle from Contract
    ↓
ACL Permission Check
    ↓
User Authorization Verified
    ↓
FHEVM.decrypt32(handle)
    ↓
Plaintext Value (42)
    ↓
Display to User
```

### **State Management Flow**
```typescript
// React state management with encryption
const [encryptedValue, setEncryptedValue] = useState<string | null>(null);
const [decryptedValue, setDecryptedValue] = useState<number | null>(null);
const [isDecrypting, setIsDecrypting] = useState(false);

// Encryption flow
const handleEncrypt = async (value: number) => {
  const encrypted = await fhevm.encrypt32(value);
  await contract.increment(encrypted.handles[0], encrypted.inputProof);
  // Contract updates the encrypted state
  setEncryptedValue(await contract.getCount());
};

// Decryption flow
const handleDecrypt = async () => {
  setIsDecrypting(true);
  const decrypted = await fhevm.decrypt32(encryptedValue);
  setDecryptedValue(decrypted);
  setIsDecrypting(false);
};
```

## 🚀 Performance Architecture

### **Optimization Strategies**

1. **Client-Side Optimizations:**
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

2. **Contract Optimizations:**
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

3. **Network Optimizations:**
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
   // Individual function testing
   describe('FHEVMClient', () => {
     it('should encrypt 32-bit values correctly', async () => {
       const encrypted = await FHEVMClient.encrypt32(42);
       expect(encrypted.handles).toBeDefined();
       expect(encrypted.inputProof).toBeDefined();
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
│   GitHub    │───▶│   Build     │───▶│   Deploy    │
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