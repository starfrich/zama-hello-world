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
│   Development   │───>│     Staging     │───>│   Production    │
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

# Deploy contracts using hardhat-deploy
npx hardhat deploy --network localhost

# Expected output:
# deploying "FHECounter" (tx: 0x...)
# ✅ FHECounter deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
# FHECounter contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### **Verify Local Deployment**
```bash
# Run tests against deployed contracts
npx hardhat test --network localhost

# Check deployment information
npx hardhat deployments --network localhost

# Run specific FHECounter task (if available)
npx hardhat fhecounter:getCount --network localhost
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
NEXT_PUBLIC_RELAYER_URL="http://127.0.0.1:8545"  # Local relayer (if available)
NEXT_PUBLIC_CHAIN_ID="31337"
NEXT_PUBLIC_GATEWAY_CHAIN_ID="31337"

# FHEVM System Contracts (Local - these may not be needed for local dev)
NEXT_PUBLIC_FHEVM_EXECUTOR_CONTRACT=""
NEXT_PUBLIC_ACL_CONTRACT=""
NEXT_PUBLIC_HCU_LIMIT_CONTRACT=""
NEXT_PUBLIC_KMS_VERIFIER_CONTRACT=""
NEXT_PUBLIC_INPUT_VERIFIER_CONTRACT=""
NEXT_PUBLIC_DECRYPTION_ORACLE_CONTRACT=""
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

# Set environment variables using Hardhat vars (secure storage)
npx hardhat vars set MNEMONIC "your twelve word mnemonic here"
npx hardhat vars set INFURA_API_KEY "your-infura-api-key"
npx hardhat vars set ETHERSCAN_API_KEY "your-etherscan-api-key"

# Verify your configuration
npx hardhat vars setup

# Test network connectivity
npx hardhat node-info --network sepolia
```

#### **Get Sepolia ETH**
Visit these verified faucets (updated September 2025; limits apply, e.g., 24-hour cooldowns):
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) – Requires Alchemy account
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia) – Provides 0.5 ETH + 25 LINK
- [Google Cloud Web3 Sepolia Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) – Free for developers
- [Sepolia PoW Faucet](https://sepolia-faucet.pk910.de/) – Requires proof-of-work mining

You'll need ETH to:
- Deploy smart contracts
- Pay for transaction gas fees
- Test the frontend application

### **2. Smart Contract Deployment to Sepolia**

#### **Deploy Contracts**
```bash
cd contracts

# Compile contracts
npm run compile

# Deploy to Sepolia using hardhat-deploy
npx hardhat deploy --network sepolia

# Expected output:
# deploying "FHECounter" (tx: 0x...)
# ✅ FHECounter: deployed at 0x742d35Cc6834C532532532532... with 1234567 gas
# FHECounter contract: 0x742d35Cc6834C532532532532...
```

#### **Verify Contracts on Etherscan**
```bash
# Verify the deployed contract (hardhat-deploy saves deployment info)
npx hardhat etherscan-verify --network sepolia

# Or manually verify specific contract
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

# Test build locally (Note: uses static export in production)
npm run build
npm run start

# Note: The Next.js config uses static export for production builds
# This optimizes the app for static deployment on Vercel
```

Edit `.env.local` for Sepolia:
```env
# Sepolia Testnet Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FHE_COUNTER_ADDRESS="0x742d35Cc6834C532532532532..."  # From deployment
NEXT_PUBLIC_RPC_URL="https://eth-sepolia.public.blastapi.io"
NEXT_PUBLIC_RELAYER_URL="https://relayer.testnet.zama.cloud"
NEXT_PUBLIC_CHAIN_ID="11155111"
NEXT_PUBLIC_GATEWAY_CHAIN_ID="55815"

# FHEVM System Contracts (Sepolia Testnet)
NEXT_PUBLIC_FHEVM_EXECUTOR_CONTRACT="0x848B0066793BcC60346Da1F49049357399B8D595"
NEXT_PUBLIC_ACL_CONTRACT="0x687820221192C5B662b25367F70076A37bc79b6c"
NEXT_PUBLIC_HCU_LIMIT_CONTRACT="0x594BB474275918AF9609814E68C61B1587c5F838"
NEXT_PUBLIC_KMS_VERIFIER_CONTRACT="0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC"
NEXT_PUBLIC_INPUT_VERIFIER_CONTRACT="0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4"
NEXT_PUBLIC_DECRYPTION_ORACLE_CONTRACT="0xa02Cda4Ca3a71D7C46997716F4283aa851C28812"
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
# ? Set up and deploy "~/zama-hello-world/frontend" under a new Project? [Y/n] Y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] N
# ? What’s your project’s name? hello-fhevm-staging
# ? In which directory is your code located? ./frontend
# ? Want to override the settings? [y/N] N
```

**Option 2: GitHub Integration**
1. Push code to GitHub repository
2. Connect repo to Vercel dashboard
3. Set environment variables in Vercel project settings
4. Deploy automatically on push to main

#### **Environment Variables in Vercel**
Add these in Vercel dashboard (Project Settings > Environment Variables):
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- `NEXT_PUBLIC_FHE_COUNTER_ADDRESS`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_RELAYER_URL`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_GATEWAY_CHAIN_ID`
- `NEXT_PUBLIC_FHEVM_EXECUTOR_CONTRACT`
- `NEXT_PUBLIC_ACL_CONTRACT`
- `NEXT_PUBLIC_HCU_LIMIT_CONTRACT`
- `NEXT_PUBLIC_KMS_VERIFIER_CONTRACT`
- `NEXT_PUBLIC_INPUT_VERIFIER_CONTRACT`
- `NEXT_PUBLIC_DECRYPTION_ORACLE_CONTRACT`

**Important:** Set these for both **Production** and **Preview** environments.

### **4. Post-Deployment Verification**
```bash
# Test contract interaction using hardhat-deploy
npx hardhat deploy --network sepolia --verify

# Check deployment status
npx hardhat deployments --network sepolia

# Run FHECounter tasks (if available)
npx hardhat fhecounter:getCount --network sepolia

# Check frontend
# Visit your Vercel URL and:
# - Connect MetaMask to Sepolia
# - Perform encrypted operations
# - Verify decryption works
```

**Add Sepolia to MetaMask (if needed):**
- Network Name: `Sepolia Test Network`
- RPC URL: `https://eth-sepolia.public.blastapi.io`
- Chain ID: `0xaa36a7` (11155111 in decimal)
- Currency Symbol: `ETH`
- Block Explorer: `https://sepolia.etherscan.io`

## 🔄 Phase 3: Production-Ready Deployment (Sepolia)

### **1. Production Considerations for Testnet**
> **Note:** FHEVM mainnet is not yet available. This section covers production-grade deployment on Sepolia testnet, which serves as the current "production" environment for FHEVM applications.

- **Network:** Sepolia Testnet (Chain ID: 11155111)
- **RPC:** Use reliable providers like Infura/Alchemy for production apps
- **Gas Optimization:** Monitor gas costs and optimize contract interactions
- **Audits:** Conduct security audits even for testnet production apps
- **Monitoring:** Implement comprehensive logging and error tracking
- **Relayer:** Use Zama's production relayer on Sepolia

### **2. Production-Grade Sepolia Deployment**
```bash
cd contracts

# Use production-grade configuration
# Ensure all environment variables are properly set
npx hardhat vars list

# Deploy with verification
npx hardhat deploy --network sepolia

# Verify all contracts
npx hardhat etherscan-verify --network sepolia

# Run post-deployment checks
npx hardhat deployments --network sepolia
```

### **3. Production Frontend on Sepolia**
- Deploy to Vercel Production environment with Sepolia configuration
- Enable custom domain for professional appearance
- Set up monitoring (Vercel Analytics, Sentry)
- Implement rate limiting and proper error handling
- Configure proper caching strategies

### **🔮 Future: Mainnet Preparation**
When FHEVM mainnet becomes available, consider:
- **Security Audits:** Comprehensive smart contract audits
- **Gas Optimization:** Mainnet gas costs will be significant
- **Monitoring:** Production-grade monitoring and alerting
- **Backup Plans:** Rollback and emergency procedures

## 🔧 CI/CD Pipeline (GitHub Actions)
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

      - name: Run contract tests
        run: |
          cd contracts && npm run test

      - name: Build frontend
        run: |
          cd frontend && npm run build

      - name: Security audit
        run: |
          cd contracts && npm audit --audit-level high
          cd ../frontend && npm audit --audit-level high

      - name: Contract linting
        run: |
          cd contracts && npm run lint

  deploy-sepolia:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: sepolia

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd contracts && npm ci
          cd ../frontend && npm ci

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

  # Future: When mainnet is available
  # deploy-mainnet:
  #   needs: deploy-sepolia
  #   runs-on: ubuntu-latest
  #   if: github.event_name == 'release'
  #   environment: production
  #   steps:
  #     - name: Deploy to Mainnet
  #       run: echo "Mainnet deployment not yet available"
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

# Get more test ETH from faucets (see Phase 2)
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

Congratulations! You've successfully deployed your FHEVM application to Sepolia testnet. Your confidential dApp is now live and ready for users to interact with encrypted data on the blockchain.

### **What You've Accomplished**

- ✅ **Local Development Environment** - Complete setup for development and testing
- ✅ **Sepolia Testnet Deployment** - Production-ready deployment on the primary FHEVM network
- ✅ **Production-Grade Architecture** - Scalable, secure, and monitored application
- ✅ **CI/CD Pipeline** - Automated deployment and testing workflow
- ✅ **Frontend Integration** - Complete user interface with wallet integration

### **Next Steps for Your FHEVM Journey**

1. **Add More Features**: Extend your dApp with additional FHEVM capabilities (euint8, euint64, etc.)
2. **Optimize Performance**: Continue improving gas efficiency and user experience
3. **Community Engagement**: Share your tutorial and gather feedback from the FHEVM community
4. **Security Practices**: Implement comprehensive testing and security audits
5. **Contribute to Ecosystem**: Help improve FHEVM tools and documentation

### **Current State of FHEVM**

> **Note:** FHEVM is currently available on Sepolia testnet. Your deployed application represents a production-ready confidential dApp on the most advanced FHE blockchain network available today.

---

**🎊 You've completed the Hello FHEVM tutorial series!** You're now equipped to build confidential dApps that preserve privacy while leveraging the power of Fully Homomorphic Encryption on blockchain.

## 📚 Additional Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Hardhat Deployment Guide](https://v2.hardhat.org/hardhat-runner/docs/guides/deploying)
- [Etherscan Verification](https://docs.etherscan.io/contract-verification/verify-with-hardhat)
- [Vercel GitHub Actions Guide](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)