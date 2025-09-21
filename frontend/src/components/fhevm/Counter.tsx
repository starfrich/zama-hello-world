'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';  // UPDATED: Import toast buat hint
import { useFHEVM } from '@/hooks/useFHEVM';
import { validateUint32Input, formatEncryptedValue } from '@/lib/fhevm';
import { Loader2, Lock, Unlock, Plus, Minus, RefreshCw, Eye, RotateCcw } from 'lucide-react';

interface CounterProps {
  contractAddress?: string;
}

export function Counter({ contractAddress }: CounterProps) {
  const { isConnected } = useAccount();
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

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

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const validation = validateUint32Input(value);
    setInputError(validation.error || null);
  };

  const handleIncrement = async () => {
    const validation = validateUint32Input(inputValue);
    if (!validation.isValid) {
      setInputError(validation.error || 'Invalid input');
      return;
    }

    await incrementCounter(Number(inputValue));
    setInputValue('');
    setInputError(null);
  };

  const handleDecrement = async () => {
    const validation = validateUint32Input(inputValue);
    if (!validation.isValid) {
      setInputError(validation.error || 'Invalid input');
      return;
    }

    await decrementCounter(Number(inputValue));
    setInputValue('');
    setInputError(null);
  };

  // UPDATED: Handler buat decrypt dengan hint kalau gak bisa
  const handleDecrypt = async () => {
    if (!canDecrypt) {
      toast.warning('Grant permission first by performing an increment or decrement operation!');
      return;
    }
    await decryptCount();
  };

  const handleReset = async () => {
    await resetCounter();
    setInputValue('');
    setInputError(null);
  };

  // Event listener for contract events
  useEffect(() => {
    if (!isInitialized || !contractAddress) return;

    const setupEventListener = async () => {
      try {
        // Setup event listener for CountUpdated events
        const provider = new (await import('ethers')).ethers.BrowserProvider(window.ethereum);
        const contract = new (await import('ethers')).ethers.Contract(
          contractAddress,
          [
            {
              "anonymous": false,
              "inputs": [
                {
                  "indexed": true,
                  "internalType": "address",
                  "name": "user",
                  "type": "address"
                },
                {
                  "indexed": false,
                  "internalType": "string",
                  "name": "operation",
                  "type": "string"
                }
              ],
              "name": "CountUpdated",
              "type": "event"
            }
          ],
          provider
        );

        const eventFilter = contract.filters.CountUpdated();

        const handleCountUpdated = (user: string, operation: string) => {
          console.log(`Count updated by ${user}: ${operation}`);
          // Refresh count when we receive an event
          setTimeout(() => refreshCount(), 2000); // Small delay to ensure blockchain state is updated
        };

        contract.on(eventFilter, handleCountUpdated);

        // Cleanup function
        return () => {
          contract.off(eventFilter, handleCountUpdated);
        };
      } catch (error) {
        console.warn('Failed to setup event listeners:', error);
      }
    };

    setupEventListener();
  }, [isInitialized, contractAddress, refreshCount]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-6 h-6" />
            Hello FHEVM Counter
          </CardTitle>
          <CardDescription>
            Connect your wallet to interact with the encrypted counter
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ConnectButton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {isInitialized ? (
              <Unlock className="w-6 h-6 text-green-500" />
            ) : (
              <Lock className="w-6 h-6 text-orange-500" />
            )}
            Hello FHEVM Counter
          </span>
          <ConnectButton showBalance={false} />
        </CardTitle>
        <CardDescription>
          Increment and decrement an encrypted counter using Fully Homomorphic Encryption
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Initialization Status */}
        {!isInitialized && (
          <div className="flex items-center justify-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Initializing FHEVM client...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Counter Display */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Current Count</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshCount}
              disabled={isLoading || !isInitialized}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Encrypted Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm break-all">
                  {encryptedCount ? formatEncryptedValue(encryptedCount) : 'No data'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Decrypted Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  {decryptedCount !== null ? (
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {decryptedCount}
                    </span>
                  ) : (
                    <span className="text-gray-500">
                      {canDecrypt ? 'Ready to decrypt' : 'No access yet'}
                    </span>
                  )}
                  {canDecrypt && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDecrypt}
                      disabled={isLoading}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {decryptedCount !== null ? 'Re-decrypt' : 'Decrypt'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {canDecrypt ? (
            <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              ✓ You can decrypt this value
            </Badge>
          ) : (
            <div className="space-y-1">  {/* UPDATED: Wrap badge + hint */}
              <Badge variant="secondary">
                🔒 Only authorized users can decrypt
              </Badge>
              <p className="text-sm text-gray-600 dark:text-gray-400">  {/* UPDATED: Hint text */}
                Perform an increment or decrement operation first to grant yourself permission.
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="increment-value">Value to Add/Subtract</Label>
            <Input
              id="increment-value"
              type="number"
              min={0}
              max={4294967295}
              placeholder="Enter a number (0-4294967295)"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isLoading || !isInitialized}
              className={inputError ? 'border-red-500' : ''}
            />
            {inputError && (
              <p className="text-sm text-red-500">{inputError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleIncrement}
              disabled={isLoading || !isInitialized || !inputValue || !!inputError}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Increment
            </Button>

            <Button
              variant="outline"
              onClick={handleDecrement}
              disabled={isLoading || !isInitialized || !inputValue || !!inputError}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Minus className="w-4 h-4" />
              )}
              Decrement
            </Button>
          </div>

          {/* Reset Button */}
          <div className="flex justify-center">
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={isLoading || !isInitialized}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Reset Counter to Zero
            </Button>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How it works:
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Values are encrypted on the client side before being sent</li>
            <li>• All operations happen on encrypted data</li>
            <li>• Only authorized users can decrypt the results</li>
            <li>• The blockchain never sees your actual values</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}