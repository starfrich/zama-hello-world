# Hello FHEVM Frontend

A Next.js frontend application demonstrating Fully Homomorphic Encryption (FHE) on the blockchain using FHEVM.

## Features

- 🔒 **Encrypted Counter**: Increment/decrement operations on encrypted values
- 🎨 **Modern UI**: Built with Next.js 15, Tailwind CSS, and shadcn/ui
- 🌐 **Wallet Integration**: MetaMask and WalletConnect support via RainbowKit
- 🔐 **Client-side Encryption**: Values encrypted before sending to blockchain
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **Wallet**: RainbowKit + Wagmi + Viem
- **FHEVM**: @zama-fhe/relayer-sdk for encryption
- **State Management**: React Query (TanStack Query)
- **Notifications**: Sonner for toast messages

## Getting Started

### Prerequisites

- Node.js 20+
- MetaMask or compatible wallet
- Access to Zama Sepolia testnet

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in your values:
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FHE_COUNTER_ADDRESS=deployed-contract-address
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── fhevm/             # FHEVM-specific components
│   │   └── Counter.tsx    # Main counter component
│   ├── ui/                # shadcn/ui components
│   └── providers.tsx      # React providers setup
├── hooks/
│   └── useFHEVM.ts        # Custom hook for FHEVM operations
└── lib/
    ├── fhevm.ts           # FHEVM client configuration
    ├── contracts.ts       # Smart contract interactions
    └── wallet.ts          # Wallet configuration
```

## Key Components

### FHEVM Client (`lib/fhevm.ts`)
- Initializes the Zama relayer SDK
- Handles encryption/decryption of uint32 values
- Manages client-side crypto operations

### Counter Component (`components/fhevm/Counter.tsx`)
- Main UI for interacting with encrypted counter
- Wallet connection flow
- Real-time encrypted/decrypted value display
- Input validation and error handling

### useFHEVM Hook (`hooks/useFHEVM.ts`)
- Custom React hook for FHEVM operations
- Manages contract initialization and state
- Handles async operations with proper error handling

## How It Works

1. **Connect Wallet**: User connects MetaMask to Zama Sepolia testnet
2. **Initialize FHEVM**: Client initializes encryption capabilities
3. **Encrypt Input**: User values encrypted client-side before submission
4. **Contract Interaction**: Encrypted values sent to smart contract
5. **Decrypt Results**: Authorized users can decrypt and view results

## Network Configuration

The app is configured for Sepolia testnet with FHEVM support:
- **Chain ID**: 11155111 (Sepolia)
- **RPC URL**: https://eth-sepolia.public.blastapi.io
- **Relayer URL**: https://relayer.testnet.zama.cloud
- **Explorer**: https://sepolia.etherscan.io

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_RPC_URL` | Sepolia RPC endpoint | `https://eth-sepolia.public.blastapi.io` |
| `NEXT_PUBLIC_RELAYER_URL` | Zama relayer endpoint | `https://relayer.testnet.zama.cloud` |
| `NEXT_PUBLIC_FHE_COUNTER_ADDRESS` | Deployed contract address | Required for production |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Required for wallet support |

## Development

- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Type Check**: `npm run type-check`

## Deployment

The app can be deployed to any platform supporting Next.js:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Self-hosted

Ensure environment variables are properly configured in your deployment platform.

## Learn More

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama GitHub](https://github.com/zama-ai/fhevm)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
