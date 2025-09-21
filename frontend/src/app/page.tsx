"use client";

import dynamic from "next/dynamic";

// Import Counter as dynamic to avoid SSR issues with FHEVM SDK
const Counter = dynamic(() => import("@/components/fhevm/Counter").then((mod) => ({ default: mod.Counter })), {
  ssr: false,
  loading: () => <div className="text-center">Loading FHEVM...</div>
});

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Hello FHEVM Tutorial
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Learn how to build confidential dApps with Fully Homomorphic Encryption on the blockchain.
            This tutorial demonstrates encrypted counter operations where values remain private.
          </p>
        </div>

        {/* Main Counter Component */}
        <div className="mb-12">
          <Counter />
        </div>

        {/* Tutorial Information */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
              🔒 Privacy First
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              All computations happen on encrypted data. The blockchain never sees your actual values,
              ensuring complete privacy.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
              ⚡ Real Computation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Unlike zero-knowledge proofs, FHEVM allows arbitrary computations on encrypted data
              without revealing the inputs.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border">
            <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-gray-100">
              🌐 Web3 Ready
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Built on Ethereum-compatible infrastructure with familiar tools like Hardhat,
              Ethers.js, and MetaMask.
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://docs.zama.ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              📖 FHEVM Docs
            </a>
            <a
              href="https://github.com/zama-ai/fhevm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors"
            >
              💻 GitHub
            </a>
            <a
              href="https://www.zama.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              🏠 Zama
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
