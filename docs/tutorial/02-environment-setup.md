# Environment Setup

Setting up your development environment for FHEVM development requires several tools and configurations. This guide will walk you through everything you need to start building confidential dApps.

## 🎯 What You'll Set Up

- Node.js and package managers
- Hardhat development environment
- FHEVM dependencies and tooling
- Wallet configuration for Sepolia testnet
- Frontend development tools

## 📋 Prerequisites

### System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Node.js**: Version 20 or higher
- **Memory**: At least 8GB RAM (16GB recommended for large projects)
- **Storage**: At least 2GB free space

### Required Accounts

- **MetaMask Wallet**: For interacting with the blockchain
- **Infura Account** (optional): For reliable RPC endpoints
- **Etherscan Account** (optional): For contract verification

## 🚀 Step 1: Install Node.js and Package Manager

### Install Node.js

Visit [nodejs.org](https://nodejs.org/) and download Node.js 20 LTS or higher.

Verify your installation:
```bash
node --version  # Should show v20.x.x or higher
npm --version   # Should show npm version
```

### Optional: Install pnpm (Recommended)
```bash
npm install -g pnpm
```

pnpm is faster and more efficient than npm for large projects with many dependencies.

## 🛠️ Step 2: Clone and Setup the Project

### Clone the Repository
```bash
git clone https://github.com/starfrich/zama-hello-world.git
cd zama-hello-world
```

### Install Dependencies

**For the entire monorepo:**
```bash
# Using npm
npm install

# Using pnpm (recommended)
pnpm install
```

**For individual packages:**
```bash
# Contracts only
cd contracts && npm install

# Frontend only
cd frontend && npm install
```

## 🔧 Step 3: Configure Environment Variables

### Contracts Environment Setup

Navigate to the contracts directory and set up your environment variables:

```bash
cd contracts

# Set your mnemonic (12-word seed phrase)
npx hardhat vars set MNEMONIC

# Set Infura API key (optional but recommended)
npx hardhat vars set INFURA_API_KEY

# Set Etherscan API key for contract verification (optional)
npx hardhat vars set ETHERSCAN_API_KEY
```

**Alternative: Using .env file**
```bash
# Create .env file in contracts directory
touch .env
```

Add the following to your `.env` file:
```env
MNEMONIC="your twelve word mnemonic phrase here"
INFURA_API_KEY="your-infura-api-key"
ETHERSCAN_API_KEY="your-etherscan-api-key"
```

### Frontend Environment Setup

Navigate to the frontend directory:
```bash
cd frontend

# Copy the example environment file
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id"

# Contract address (will be set after deployment)
NEXT_PUBLIC_FHE_COUNTER_ADDRESS=""

# Network configuration (optional - defaults are provided)
NEXT_PUBLIC_RPC_URL="https://eth-sepolia.public.blastapi.io"
NEXT_PUBLIC_RELAYER_URL="https://relayer.testnet.zama.cloud"
```

## 🔑 Step 4: Wallet Configuration

### Install MetaMask

1. Install [MetaMask browser extension](https://metamask.io/)
2. Create a new wallet or import existing one
3. Save your seed phrase securely

### Add Sepolia Testnet

Add the Sepolia testnet to MetaMask:

**Network Details:**
- **Network Name**: Sepolia Test Network
- **RPC URL**: `https://eth-sepolia.public.blastapi.io`
- **Chain ID**: `11155111`
- **Currency Symbol**: `ETH`
- **Block Explorer**: `https://sepolia.etherscan.io`

### Get Test ETH

Get Sepolia ETH from these faucets:
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

You'll need ETH to:
- Deploy smart contracts
- Pay for transaction gas fees
- Test the frontend application

## 🧪 Step 5: Verify Installation

### Test Contracts Setup

```bash
cd contracts

# Compile contracts
npm run compile

# Run tests
npm run test

# Start local Hardhat node
npx hardhat node
```

Expected output for compilation:
```
Compiled 5 Solidity files successfully
```

Expected output for tests:
```
✓ Should deploy and initialize correctly
✓ Should increment counter
✓ Should decrypt counter for owner
```

### Test Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run type checking
npm run type-check

# Start development server
npm run dev
```

The frontend should start at `http://localhost:3000`.

## 🔧 Step 6: Development Tools Setup

### VS Code Extensions (Recommended)

Install these extensions for better development experience:

- **Solidity**: Syntax highlighting for Solidity
- **Hardhat for Visual Studio Code**: Hardhat integration
- **ES7+ React/Redux/React-Native snippets**: React snippets
- **Tailwind CSS IntelliSense**: Tailwind CSS support
- **TypeScript Importer**: Auto import for TypeScript

### Configure VS Code Settings

Create `.vscode/settings.json` in your project root:
```json
{
  "solidity.defaultCompiler": "localNodeModule",
  "solidity.packageDefaultDependenciesContractsDirectory": "contracts",
  "solidity.packageDefaultDependenciesDirectory": "node_modules",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 🐛 Step 7: Common Setup Issues

### Issue: "Cannot find module 'fhevm'"

**Solution:**
```bash
cd contracts
npm install fhevm
```

### Issue: "Invalid mnemonic"

**Solution:**
Ensure your mnemonic is exactly 12 words and properly formatted:
```bash
npx hardhat vars set MNEMONIC "word1 word2 word3 ... word12"
```

### Issue: "Insufficient funds"

**Solution:**
- Ensure you have Sepolia ETH in your wallet
- Check you're connected to the correct network
- Try a different faucet if needed

### Issue: Frontend won't start

**Solution:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: "Network connection failed"

**Solution:**
- Check your internet connection
- Try using Infura RPC URL instead of public RPC
- Verify your network configuration in MetaMask

## 📊 Step 8: Verify Complete Setup

Run this comprehensive test to ensure everything is working:

### 1. Compile and Test Contracts
```bash
cd contracts
npm run compile && npm run test
```

### 2. Deploy to Local Network
```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat deploy --network localhost
```

### 3. Test Frontend Integration
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` and:
- Connect your wallet
- Interact with the deployed contract
- Verify encryption/decryption works

## ✅ Setup Checklist

Before proceeding to the next tutorial, ensure you have:

- [ ] Node.js 20+ installed and verified
- [ ] Project dependencies installed successfully
- [ ] Environment variables configured
- [ ] MetaMask installed and configured
- [ ] Sepolia testnet added to wallet
- [ ] Test ETH obtained from faucet
- [ ] Contracts compile without errors
- [ ] Tests pass successfully
- [ ] Frontend starts without errors
- [ ] VS Code extensions installed (optional)

## 🔗 Useful Commands Reference

### Contracts Commands
```bash
npm run compile      # Compile all contracts
npm run test        # Run all tests
npm run deploy      # Deploy to configured network
npm run verify      # Verify contracts on Etherscan
npm run lint        # Run Solidity linting
npm run clean       # Clean build artifacts
```

### Frontend Commands
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run ESLint
npm run type-check  # Run TypeScript checking
```

### Hardhat Commands
```bash
npx hardhat node                    # Start local blockchain
npx hardhat compile                 # Compile contracts
npx hardhat test                   # Run tests
npx hardhat deploy --network sepolia # Deploy to Sepolia
npx hardhat verify --network sepolia <address> # Verify contract
```

## 🎯 Next Steps

With your environment set up, you're ready to dive deeper into FHEVM concepts. In the next section, we'll explore the cryptographic foundations and learn how Fully Homomorphic Encryption works.

---

**Environment ready?** Continue to [Understanding FHE](03-understanding-fhe.md) →

## 🆘 Need Help?

If you encounter issues:

1. **Check the [Troubleshooting Guide](../reference/troubleshooting.md)**
2. **Visit [Zama Discord](https://discord.gg/zama)** for community support
3. **Review [FHEVM Documentation](https://docs.zama.ai/protocol)** for technical details
4. **Open an issue** in the project repository