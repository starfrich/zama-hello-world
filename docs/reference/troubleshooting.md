# Troubleshooting Guide

This comprehensive troubleshooting guide covers common issues you might encounter while developing with FHEVM and provides step-by-step solutions.

## 🚨 Common Issues

### 1. FHEVM Initialization Problems

#### Error: "Cannot create FHEVM instance"

**Symptoms:**
- Frontend fails to initialize FHEVM
- Console shows "Failed to create FHEVM instance"
- Encryption operations fail

**Causes & Solutions:**

**🔧 Solution 1: Check Network Configuration**
```typescript
// Verify your network configuration
const config = {
  relayerUrl: "https://relayer.testnet.zama.cloud", // Correct URL
  chainId: 11155111, // Sepolia testnet
  publicKey: undefined, // Optional
};
```

**🔧 Solution 2: Verify Environment Variables**
```env
# Check your .env.local file
NEXT_PUBLIC_RELAYER_URL=https://relayer.testnet.zama.cloud
NEXT_PUBLIC_CHAIN_ID=11155111
```

**🔧 Solution 3: Network Connectivity**
```bash
# Test relayer connectivity
curl -X GET https://relayer.testnet.zama.cloud/health

# Expected response: {"status": "ok"}
```

#### Error: "FHEVM not initialized"

**Symptoms:**
- Encryption/decryption operations fail
- "FHEVM not initialized" error in console

**Solutions:**

**🔧 Solution 1: Wait for Initialization**
```typescript
const { isInitialized, isLoading } = useFHEVM();

// Always check initialization status
if (!isInitialized) {
  return <Loading text="Initializing FHEVM..." />;
}
```

**🔧 Solution 2: Manual Initialization**
```typescript
const { initialize } = useFHEVM();

useEffect(() => {
  if (isConnected && !isInitialized) {
    initialize();
  }
}, [isConnected, isInitialized, initialize]);
```

### 2. Smart Contract Deployment Issues

#### Error: "Invalid mnemonic"

**Symptoms:**
- Contract deployment fails
- Hardhat throws mnemonic validation error

**Solutions:**

**🔧 Solution 1: Check Mnemonic Format**
```bash
# Correct format (12 words, space-separated)
npx hardhat vars set MNEMONIC "word1 word2 word3 ... word12"

# Verify the mnemonic
npx hardhat vars get MNEMONIC
```

**🔧 Solution 2: Use .env File**
```env
# .env file in contracts directory
MNEMONIC="your twelve word mnemonic phrase here"
```

#### Error: "Insufficient funds for gas"

**Symptoms:**
- Transaction fails with insufficient funds error
- Deployment scripts fail

**Solutions:**

**🔧 Solution 1: Get Test ETH**
```bash
# Use Sepolia faucets
# 1. https://sepoliafaucet.com/
# 2. https://faucets.chain.link/sepolia
# 3. https://sepolia-faucet.pk910.de/
```

**🔧 Solution 2: Check Network**
```typescript
// Verify you're on Sepolia testnet
const network = await ethers.provider.getNetwork();
console.log("Network:", network.name, "Chain ID:", network.chainId);
// Should show: Network: sepolia Chain ID: 11155111
```

#### Error: "Contract compilation failed"

**Symptoms:**
- `npm run compile` fails
- Solidity compilation errors

**Solutions:**

**🔧 Solution 1: Update Dependencies**
```bash
cd contracts
npm update @fhevm/solidity
npm run compile
```

**🔧 Solution 2: Check Solidity Version**
```typescript
// hardhat.config.ts
export default {
  solidity: {
    version: "0.8.24", // Ensure compatibility with FHEVM
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
};
```

### 3. Frontend Integration Issues

#### Error: "Module not found: @zama-fhe/relayer-sdk"

**Symptoms:**
- Frontend build fails
- Import errors for FHEVM SDK

**Solutions:**

**🔧 Solution 1: Install Dependencies**
```bash
cd frontend
npm install @zama-fhe/relayer-sdk
npm run build
```

**🔧 Solution 2: Check Package Version**
```json
{
  "dependencies": {
    "@zama-fhe/relayer-sdk": "^0.2.0"
  }
}
```

#### Error: "Hydration failed" or SSR Issues

**Symptoms:**
- Next.js hydration mismatches
- Client/server rendering differences

**Solutions:**

**🔧 Solution 1: Use Dynamic Imports**
```typescript
import dynamic from 'next/dynamic';

const Counter = dynamic(() => import('@/components/fhevm/Counter'), {
  ssr: false,
  loading: () => <Loading text="Loading counter..." />
});
```

**🔧 Solution 2: Conditional Rendering**
```typescript
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return <Loading />;
}
```

### 4. Wallet Connection Issues

#### Error: "Please connect to Sepolia testnet"

**Symptoms:**
- Wrong network detected
- Contract interactions fail

**Solutions:**

**🔧 Solution 1: Add Network to MetaMask**
```typescript
// Network configuration
const sepoliaNetwork = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia Test Network',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://eth-sepolia.public.blastapi.io'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};
```

**🔧 Solution 2: Auto Network Switch**
```typescript
const { switchNetwork } = useSwitchNetwork();

const ensureCorrectNetwork = async () => {
  if (chain?.id !== 11155111) {
    try {
      await switchNetwork?.(11155111);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  }
};
```

#### Error: "User rejected the request"

**Symptoms:**
- Wallet transactions cancelled
- Connection requests denied

**Solutions:**

**🔧 Solution 1: Better UX Messaging**
```typescript
const handleTransaction = async () => {
  try {
    await writeContract({ /* ... */ });
  } catch (error) {
    if (error.message.includes('User rejected')) {
      toast.info('Transaction was cancelled');
    } else {
      toast.error('Transaction failed');
    }
  }
};
```

### 5. Encryption/Decryption Issues

#### Error: "Encryption failed"

**Symptoms:**
- Client-side encryption operations fail
- "Failed to encrypt value" errors

**Solutions:**

**🔧 Solution 1: Value Range Validation**
```typescript
const encrypt32 = async (value: number) => {
  if (value < 0 || value > 4294967295) {
    throw new Error('Value must be a valid 32-bit unsigned integer');
  }

  if (!Number.isInteger(value)) {
    throw new Error('Value must be an integer');
  }

  return await fhevmInstance.encrypt32(value);
};
```

**🔧 Solution 2: Check Instance State**
```typescript
const encrypt32 = async (value: number) => {
  if (!fhevmInstance) {
    throw new Error('FHEVM instance not initialized');
  }

  // Verify instance is ready
  if (!fhevmInstance.hasKeysConfigured?.()) {
    throw new Error('FHEVM keys not configured');
  }

  return await fhevmInstance.encrypt32(value);
};
```

#### Error: "Decryption failed" or "Access denied"

**Symptoms:**
- Cannot decrypt encrypted values
- Access control errors

**Solutions:**

**🔧 Solution 1: Check ACL Permissions**
```solidity
function canUserDecrypt() external view returns (bool) {
    return FHE.isSenderAllowed(_count);
}
```

**🔧 Solution 2: Grant Proper Access**
```solidity
function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedInput = FHE.fromExternal(inputEuint32, inputProof);
    _count = FHE.add(_count, encryptedInput);

    // IMPORTANT: Grant access permissions
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

### 6. Performance Issues

#### Issue: High Gas Costs

**Symptoms:**
- Transactions cost too much gas
- Operations are slow

**Solutions:**

**🔧 Solution 1: Optimize FHE Operations**
```solidity
// Instead of multiple operations
function inefficient(uint32[] calldata values) external {
    for (uint i = 0; i < values.length; i++) {
        _count = FHE.add(_count, FHE.asEuint32(values[i]));
    }
}

// Batch operations
function efficient(uint32[] calldata values) external {
    euint32 sum = FHE.asEuint32(0);
    for (uint i = 0; i < values.length; i++) {
        sum = FHE.add(sum, FHE.asEuint32(values[i]));
    }
    _count = FHE.add(_count, sum);
}
```

**🔧 Solution 2: Reduce ACL Operations**
```solidity
// Group ACL updates
function optimizedUpdate() external {
    // Perform all operations first
    _count = FHE.add(_count, encryptedValue1);
    _count = FHE.add(_count, encryptedValue2);

    // Single ACL update
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

#### Issue: Slow Frontend Performance

**Solutions:**

**🔧 Solution 1: Optimize React Rendering**
```typescript
const Counter = memo(function Counter() {
  const memoizedValue = useMemo(() => {
    return expensiveComputation(data);
  }, [data]);

  const debouncedHandler = useMemo(
    () => debounce(handleChange, 300),
    [handleChange]
  );

  return /* ... */;
});
```

## 🔧 Development Tools Debugging

### Hardhat Debugging

```bash
# Reset Hardhat cache
npx hardhat clean

# Run with verbose logging
npx hardhat compile --verbose

# Debug specific network
npx hardhat console --network sepolia
```

### Frontend Debugging

```typescript
// Enable debug logging
localStorage.setItem('debug', 'fhevm:*');

// Check FHEVM instance state
console.log('FHEVM Instance:', fhevmInstance);
console.log('Keys configured:', fhevmInstance?.hasKeysConfigured?.());
```

### Network Debugging

```bash
# Check RPC connectivity
curl -X POST https://eth-sepolia.public.blastapi.io \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Check relayer status
curl https://relayer.testnet.zama.cloud/health
```

## 📋 Troubleshooting Checklist

### Before Deploying
- [ ] Environment variables are set correctly
- [ ] Wallet has sufficient Sepolia ETH
- [ ] Connected to Sepolia testnet
- [ ] Contracts compile without errors
- [ ] Tests pass successfully

### Before Frontend Development
- [ ] FHEVM dependencies installed
- [ ] Contract addresses configured
- [ ] Wallet integration working
- [ ] Environment variables set
- [ ] Build process succeeds

### Before Production
- [ ] All tests passing
- [ ] Error handling implemented
- [ ] Loading states configured
- [ ] Performance optimized
- [ ] Security reviewed

## 🆘 Getting Help

If you're still experiencing issues:

1. **Check the Console**: Look for specific error messages
2. **Review the Logs**: Check both browser and server logs
3. **Test Incrementally**: Isolate the problem to specific components
4. **Community Support**: Join the [Zama Discord](https://discord.gg/zama)
5. **Documentation**: Reference [FHEVM Docs](https://docs.zama.ai/fhevm)

## 📝 Reporting Issues

When reporting issues, please include:

- **Environment**: OS, Node.js version, browser
- **Error Messages**: Full error text and stack traces
- **Steps to Reproduce**: Detailed reproduction steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Code Samples**: Relevant code snippets

## 🔄 Quick Fixes

### Reset Development Environment
```bash
# Clean and reinstall everything
rm -rf node_modules package-lock.json
npm install

# Reset Hardhat
npx hardhat clean
npx hardhat compile

# Clear browser cache and local storage
# In browser DevTools: Application > Storage > Clear site data
```

### Verify Configuration
```bash
# Check versions
node --version  # Should be 20+
npm --version

# Check environment
npx hardhat vars list
cat .env.local

# Test connections
npx hardhat console --network sepolia
```

This troubleshooting guide should help you resolve most common issues. Remember to always check the error messages carefully and verify your configuration before trying more complex solutions.