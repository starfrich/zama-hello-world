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
- **Node.js**: Version 20 or higher (LTS recommended)
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
git clone https://github.com/starfrich/zama-hello-world
cd zama-hello-world
```

### Install Dependencies

This project consists of separate contracts and frontend directories that need to be set up individually:

**Install Contracts Dependencies:**
```bash
cd contracts
npm install
```

**Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

### Key Dependencies Included

**Contracts (`@fhevm/solidity` ecosystem):**
- `@fhevm/solidity`: ^0.8.0 - Core FHEVM library
- `@fhevm/hardhat-plugin`: ^0.1.0 - Hardhat integration
- `@zama-fhe/oracle-solidity`: ^0.1.0 - Oracle functionality
- `encrypted-types`: ^0.0.4 - Type definitions

**Frontend (Next.js with Crypto Integration):**
- `@rainbow-me/rainbowkit`: ^2.2.8 - Wallet connection
- `@zama-fhe/relayer-sdk`: ^0.2.0 - FHEVM relayer integration
- `ethers`: ^6.15.0 - Ethereum interactions
- `wagmi`: ^2.17.1 - React hooks for Ethereum

## 🔧 Step 3: Configure Environment Variables

### Contracts Environment Setup

Navigate to the contracts directory and set up your environment variables using the Hardhat template:

```bash
cd contracts

# Set your mnemonic (12-word seed phrase)
npx hardhat vars set MNEMONIC

# Set Infura API key (optional but recommended for reliable RPC)
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

**Defaults (for testing):** If not set, Hardhat uses `MNEMONIC = "test test test test test test test test test test test junk"` and `INFURA_API_KEY = "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"`.

### Frontend Environment Setup

Navigate to the frontend directory:
```bash
cd frontend

# Copy the example environment file
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```env
# FHEVM Configuration (Sepolia Testnet)
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.public.blastapi.io
NEXT_PUBLIC_RELAYER_URL=https://relayer.testnet.zama.cloud

# FHEVM System Contracts (Sepolia Testnet)
NEXT_PUBLIC_FHEVM_EXECUTOR_CONTRACT=0x848B0066793BcC60346Da1F49049357399B8D595
NEXT_PUBLIC_ACL_CONTRACT=0x687820221192C5B662b25367F70076A37bc79b6c
NEXT_PUBLIC_HCU_LIMIT_CONTRACT=0x594BB474275918AF9609814E68C61B1587c5F838
NEXT_PUBLIC_KMS_VERIFIER_CONTRACT=0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
NEXT_PUBLIC_INPUT_VERIFIER_CONTRACT=0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4
NEXT_PUBLIC_DECRYPTION_ORACLE_CONTRACT=0xa02Cda4Ca3a71D7C46997716F4283aa851C28812

# Application Contract Addresses
NEXT_PUBLIC_FHE_COUNTER_ADDRESS=

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
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

Get Sepolia ETH from these active faucets (verified as of September 2025):
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia) (0.1 ETH/72 hrs, requires 0.001 ETH mainnet balance and some transaction history)
- [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) (up to 0.05 ETH daily, no strict requirements but may need Google account)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia) (multiple assets available, Requests for native tokens require the user to hold at least 1 LINK on Ethereum Mainnet. This restriction does not apply to requests for testnet LINK.)

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
✓ encrypted count should be initialized to zero after deployment
✓ increment the counter by 1
✓ decrement the counter by 1

3 passing
1 pending
```

**Note:** The message "This hardhat test suite can only run on Sepolia Testnet" indicates that some tests are specifically designed for Sepolia testnet. The local mock tests should all pass successfully as shown above.

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

**Note:** You may see some warnings during the build process related to missing dependencies in React hooks or MetaMask SDK modules. These are non-critical warnings that don't prevent the application from working properly.

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

### Issue: "Cannot find module '@fhevm/solidity'"

**Solution:**
```bash
cd contracts
npm install @fhevm/solidity @fhevm/hardhat-plugin
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