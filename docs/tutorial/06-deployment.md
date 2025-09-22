# Deployment Guide

This comprehensive guide covers deploying your FHEVM application to various environments, from local testing to production. Learn best practices for secure, reliable deployments that maintain the confidentiality guarantees of your encrypted smart contracts.

## 🎯 What You'll Learn

- Local development deployment
- Sepolia testnet deployment
- Frontend deployment to Vercel
- Production deployment considerations
- Contract verification and monitoring
- Security and optimization best practices

## 🏗️ Deployment Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT PIPELINE                      │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │──▶│     Staging     │───▶│   Production    │
│   (Local)       │    │   (Sepolia)     │    │   (Mainnet)     │
│                 │    │                 │    │                 │
│ • Local Hardhat │    │ • Sepolia       │    │ • Ethereum      │
│ • Local Frontend│    │ • Vercel Preview│    │ • Vercel Prod   │
│ • Mock Data     │    │ • Real Relayer  │    │ • Real Relayer  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Phase 1: Local Development Deployment

### **1. Smart Contract Local Deployment**

#### **Start Local Hardhat Node**
```bash
cd contracts

# Start a local blockchain
npx hardhat node

# Keep this terminal running
# You should see:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

#### **Deploy to Local Network**
```bash
# In a new terminal
cd contracts

# Deploy contracts
npx hardhat deploy --network localhost

# Expected output:
# ✅ FHECounter deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### **Verify Local Deployment**
```bash
# Run tests against deployed contracts
npx hardhat test --network localhost

# Check deployment info
npx hardhat run scripts/verify-deployment.js --network localhost
```

### **2. Frontend Local Development**

#### **Configure Environment**
```bash
cd frontend

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Local development configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FHE_COUNTER_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
NEXT_PUBLIC_RPC_URL="http://127.0.0.1:8545"
NEXT_PUBLIC_RELAYER_URL="http://127.0.0.1:8545"  # Local relayer
NEXT_PUBLIC_CHAIN_ID="31337"
```

#### **Start Development Server**
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### **3. Local Testing Flow**

#### **Setup MetaMask for Local Development**
1. **Add Local Network:**
   - Network Name: `Localhost 8545`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account:**
   ```bash
   # Use one of the test private keys from Hardhat node output
   # Example: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

3. **Test the Application:**
   - Connect wallet to localhost:3000
   - Perform increment/decrement operations
   - Verify encryption/decryption works

## 🌐 Phase 2: Sepolia Testnet Deployment

### **1. Environment Setup**

#### **Configure Hardhat for Sepolia**
```bash
cd contracts

# Set environment variables
npx hardhat vars set MNEMONIC "your twelve word mnemonic here"
npx hardhat vars set INFURA_API_KEY "your-infura-api-key"
npx hardhat vars set ETHERSCAN_API_KEY "your-etherscan-api-key"
```

#### **Get Sepolia ETH**
Visit these faucets:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

### **2. Smart Contract Deployment to Sepolia**

#### **Deploy Contracts**
```bash
cd contracts

# Compile contracts
npm run compile

# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Expected output:
# ✅ FHECounter deployed to: 0x742d35Cc6834C532532532532...
# 💰 Gas used: 1,234,567
# 💸 Gas cost: 0.001234567 ETH
```

#### **Verify Contracts on Etherscan**
```bash
# Verify the deployed contract
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Expected output:
# ✅ Contract verification successful
# 📋 View on Etherscan: https://sepolia.etherscan.io/address/0x...
```

### **3. Frontend Deployment to Vercel**

#### **Prepare for Deployment**
```bash
cd frontend

# Update environment for Sepolia
cp .env.local.example .env.local

# Test build locally
npm run build
npm run start
```

#### **Deploy to Vercel**

**Option 1: Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# ? Set up and deploy "~/zama-hello-world/frontend"? Y
# ? Which scope do you want to deploy to? [Your account]
# ? Link to existing project? N
# ? What's your project's name? hello-fhevm
# ? In which directory is your code located? ./
```

**Option 2: GitHub Integration**
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy automatically on push

#### **Configure Vercel Environment Variables**
In Vercel dashboard, add these environment variables:
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = your-project-id
NEXT_PUBLIC_FHE_COUNTER_ADDRESS = 0x742d35Cc6834C532532532532...
NEXT_PUBLIC_RPC_URL = https://eth-sepolia.public.blastapi.io
NEXT_PUBLIC_RELAYER_URL = https://relayer.testnet.zama.cloud
NEXT_PUBLIC_CHAIN_ID = 11155111
```

### **4. End-to-End Testing on Sepolia**

#### **Test Checklist**
- [ ] Contract deployed and verified on Sepolia
- [ ] Frontend deployed and accessible
- [ ] Wallet connects to Sepolia network
- [ ] FHEVM encryption initializes correctly
- [ ] Counter operations work (increment/decrement)
- [ ] Decryption works for authorized users
- [ ] Error handling works properly

#### **Testing Script**
```typescript
// test-e2e.ts - Run this in your local environment
import { createInstance } from '@zama-fhe/relayer-sdk';
import { ethers } from 'ethers';

async function testDeployment() {
  // Test contract connection
  const provider = new ethers.JsonRpcProvider('https://eth-sepolia.public.blastapi.io');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  // Test FHEVM initialization
  const fhevm = await createInstance({
    relayerUrl: 'https://relayer.testnet.zama.cloud',
    chainId: 11155111,
  });

  // Test encryption
  const encrypted = await fhevm.encrypt32(42);
  console.log('✅ Encryption successful');

  // Test contract interaction
  const tx = await contract.increment(encrypted.handles[0], encrypted.inputProof);
  await tx.wait();
  console.log('✅ Contract interaction successful');

  console.log('🎉 All tests passed!');
}

testDeployment().catch(console.error);
```

## 🏭 Phase 3: Production Deployment Considerations

### **1. Security Hardening**

#### **Smart Contract Security**
```solidity
// Add production security measures
contract FHECounter {
    // Rate limiting
    mapping(address => uint256) private lastOperationTime;
    uint256 private constant OPERATION_COOLDOWN = 1 minutes;

    modifier rateLimited() {
        require(
            block.timestamp >= lastOperationTime[msg.sender] + OPERATION_COOLDOWN,
            "Operation too frequent"
        );
        lastOperationTime[msg.sender] = block.timestamp;
        _;
    }

    // Emergency pause
    bool private paused = false;
    address private owner;

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function pause() external onlyOwner {
        paused = true;
    }

    function unpause() external onlyOwner {
        paused = false;
    }
}
```

#### **Frontend Security**
```typescript
// lib/security.ts
export const securityConfig = {
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://vercel.live'],
    'connect-src': ["'self'", 'https://relayer.mainnet.zama.cloud'],
    'img-src': ["'self'", 'data:', 'https:'],
  },

  // Rate limiting
  rateLimits: {
    operations: { windowMs: 60000, max: 10 }, // 10 ops per minute
    encryption: { windowMs: 10000, max: 5 },  // 5 encryptions per 10s
  },

  // Input validation
  validation: {
    maxValue: 4294967295, // uint32 max
    minValue: 0,
    timeout: 30000, // 30s timeout for operations
  },
};
```

### **2. Performance Optimization**

#### **Gas Optimization**
```solidity
// Optimized contract patterns
contract OptimizedFHECounter {
    // Pack related data
    struct CounterState {
        euint32 count;
        uint32 lastUpdate;
        address lastUser;
    }

    // Use events for off-chain indexing
    event CounterBatch(
        address indexed user,
        uint256 indexed batchId,
        uint8 operationCount
    );

    // Batch operations
    function batchOperations(
        externalEuint32[] calldata values,
        bytes[] calldata proofs,
        uint8[] calldata operations // 0 = add, 1 = sub
    ) external {
        require(values.length == proofs.length, "Length mismatch");
        require(values.length <= 10, "Batch too large");

        euint32 netChange = FHE.asEuint32(0);
        bool isAddition = true;

        // Calculate net change
        for (uint i = 0; i < values.length; i++) {
            euint32 value = FHE.fromExternal(values[i], proofs[i]);
            if (operations[i] == 0) {
                netChange = FHE.add(netChange, value);
            } else {
                netChange = FHE.sub(netChange, value);
            }
        }

        // Single state update
        _count = FHE.add(_count, netChange);

        // Single ACL update
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);

        emit CounterBatch(msg.sender, block.number, uint8(values.length));
    }
}
```

#### **Frontend Optimization**
```typescript
// lib/optimization.ts
import { useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

export function useOptimizedFHEVM() {
  // Memoize expensive operations
  const memoizedEncrypt = useMemo(() =>
    debounce(async (value: number) => {
      return await fhevm.encrypt32(value);
    }, 300),
    [fhevm]
  );

  // Batch multiple operations
  const batchOperations = useCallback(async (operations: Operation[]) => {
    const batches = chunkArray(operations, 5); // Process in batches of 5

    for (const batch of batches) {
      const encrypted = await Promise.all(
        batch.map(op => fhevm.encrypt32(op.value))
      );

      await contract.batchOperations(
        encrypted.map(e => e.handles[0]),
        encrypted.map(e => e.inputProof),
        batch.map(op => op.type)
      );
    }
  }, [fhevm, contract]);

  return { memoizedEncrypt, batchOperations };
}
```

### **3. Monitoring and Analytics**

#### **Contract Monitoring**
```typescript
// monitoring/contract-monitor.ts
import { EventLog } from 'ethers';

class ContractMonitor {
  private contract: Contract;
  private metrics: MetricsCollector;

  async monitorEvents() {
    // Monitor contract events
    this.contract.on('CountUpdated', (user: string, operation: string, event: EventLog) => {
      this.metrics.recordOperation({
        user,
        operation,
        blockNumber: event.blockNumber,
        gasUsed: event.gasUsed,
        timestamp: Date.now(),
      });
    });

    // Monitor gas usage
    this.contract.on('*', (event: EventLog) => {
      this.metrics.recordGasUsage({
        functionName: event.fragment?.name,
        gasUsed: event.gasUsed,
        gasPrice: event.gasPrice,
      });
    });
  }

  async healthCheck(): Promise<HealthStatus> {
    try {
      // Check contract state
      const count = await this.contract.getCount();
      const canDecrypt = await this.contract.canUserDecrypt();

      return {
        status: 'healthy',
        lastUpdate: Date.now(),
        contractResponding: true,
        encryptionWorking: count !== null,
        aclWorking: typeof canDecrypt === 'boolean',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastUpdate: Date.now(),
      };
    }
  }
}
```

#### **Frontend Analytics**
```typescript
// lib/analytics.ts
export class FHEVMAnalytics {
  private analytics: Analytics;

  trackEncryption(success: boolean, duration: number, valueSize: number) {
    this.analytics.track('fhevm_encryption', {
      success,
      duration,
      valueSize,
      timestamp: Date.now(),
    });
  }

  trackContractInteraction(method: string, gasUsed: number, success: boolean) {
    this.analytics.track('contract_interaction', {
      method,
      gasUsed,
      success,
      timestamp: Date.now(),
    });
  }

  trackUserJourney(step: string, metadata?: Record<string, any>) {
    this.analytics.track('user_journey', {
      step,
      ...metadata,
      timestamp: Date.now(),
    });
  }
}
```

## 🔧 Deployment Scripts and Automation

### **Automated Deployment Script**
```bash
#!/bin/bash
# deploy.sh - Complete deployment automation

set -e

echo "🚀 Starting FHEVM deployment..."

# Environment setup
export NODE_ENV=production
export DEPLOYMENT_ENV=${1:-staging}

echo "📋 Deployment environment: $DEPLOYMENT_ENV"

# Contract deployment
echo "📦 Deploying smart contracts..."
cd contracts
npm run compile
npx hardhat deploy --network $DEPLOYMENT_ENV

# Extract contract address
CONTRACT_ADDRESS=$(npx hardhat run scripts/get-address.js --network $DEPLOYMENT_ENV)
echo "✅ Contract deployed to: $CONTRACT_ADDRESS"

# Verify contract
echo "🔍 Verifying contract..."
npx hardhat verify --network $DEPLOYMENT_ENV $CONTRACT_ADDRESS

# Frontend deployment
echo "🎨 Deploying frontend..."
cd ../frontend

# Update environment with contract address
echo "NEXT_PUBLIC_FHE_COUNTER_ADDRESS=$CONTRACT_ADDRESS" > .env.production

# Build and deploy
npm run build
vercel --prod --env NEXT_PUBLIC_FHE_COUNTER_ADDRESS=$CONTRACT_ADDRESS

echo "🎉 Deployment complete!"
echo "📋 Contract: https://sepolia.etherscan.io/address/$CONTRACT_ADDRESS"
echo "🌐 Frontend: https://hello-fhevm.vercel.app"
```

### **CI/CD Pipeline (GitHub Actions)**
```yaml
# .github/workflows/deploy.yml
name: Deploy FHEVM Application

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd contracts && npm ci
          cd ../frontend && npm ci

      - name: Run tests
        run: |
          cd contracts && npm test
          cd ../frontend && npm run test

      - name: Security audit
        run: |
          cd contracts && npm audit --audit-level high
          cd ../frontend && npm audit --audit-level high

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Deploy to Sepolia
        env:
          MNEMONIC: ${{ secrets.MNEMONIC }}
          INFURA_API_KEY: ${{ secrets.INFURA_API_KEY }}
          ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}
        run: |
          cd contracts
          npx hardhat deploy --network sepolia

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          cd frontend
          npx vercel --prod --token $VERCEL_TOKEN

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    environment: production

    steps:
      - name: Deploy to Mainnet
        run: echo "Production deployment (manual approval required)"
```

## 🎯 Deployment Checklist

### **Pre-Deployment**
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization verified
- [ ] Environment variables configured
- [ ] Backup procedures in place

### **Contract Deployment**
- [ ] Contract compiled successfully
- [ ] Deployment transaction confirmed
- [ ] Contract verified on Etherscan
- [ ] ACL permissions configured correctly
- [ ] Emergency procedures documented

### **Frontend Deployment**
- [ ] Build completed without errors
- [ ] Environment variables set
- [ ] FHEVM integration tested
- [ ] Wallet connection verified
- [ ] Performance optimized

### **Post-Deployment**
- [ ] End-to-end testing completed
- [ ] Monitoring systems active
- [ ] Documentation updated
- [ ] Team notifications sent
- [ ] Rollback procedures verified

## 🆘 Troubleshooting Deployment Issues

### **Common Contract Deployment Errors**

**Error: "Insufficient funds"**
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network sepolia

# Get more test ETH from faucets
```

**Error: "Contract verification failed"**
```bash
# Manual verification
npx hardhat verify --network sepolia <address> <constructor-args>

# Check if already verified
npx hardhat run scripts/check-verification.js --network sepolia
```

### **Common Frontend Deployment Errors**

**Error: "Build failed"**
```bash
# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint

# Clear cache and rebuild
rm -rf .next && npm run build
```

**Error: "Environment variables not found"**
```bash
# Verify environment variables
vercel env ls

# Add missing variables
vercel env add NEXT_PUBLIC_FHE_COUNTER_ADDRESS
```

## 🎉 Conclusion

Congratulations! You've successfully deployed your FHEVM application. Your confidential dApp is now live and ready for users to interact with encrypted data on the blockchain.

### **What You've Accomplished**

- ✅ **Local Development Environment** - Complete setup for development and testing
- ✅ **Sepolia Testnet Deployment** - Real-world testing environment
- ✅ **Production-Ready Architecture** - Scalable, secure, and monitored
- ✅ **CI/CD Pipeline** - Automated deployment and testing
- ✅ **Monitoring and Analytics** - Comprehensive observability

### **Next Steps for Your FHEVM Journey**

1. **Add More Features**: Extend your dApp with additional FHEVM capabilities
2. **Optimize Performance**: Continue improving gas efficiency and user experience
3. **Community Engagement**: Share your tutorial and gather feedback
4. **Mainnet Preparation**: Plan for eventual mainnet deployment
5. **Contribute to Ecosystem**: Help improve FHEVM tools and documentation

---

**🎊 You've completed the Hello FHEVM tutorial series!** You're now equipped to build confidential dApps that preserve privacy while leveraging the power of blockchain technology.

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Hardhat Deployment Guide](https://v2.hardhat.org/tutorial/deploying-to-a-live-network)
- [Etherscan Verification](https://docs.etherscan.io/contract-verification/verify-with-hardhat)
- [GitHub Actions for Web3](https://github.com/actions/starter-workflows)
