# Smart Contract Development with FHEVM

Now that you understand FHE concepts, let's dive into building smart contracts that can perform computations on encrypted data. In this tutorial, we'll explore the FHECounter contract and learn how to write secure, efficient FHEVM contracts.

## 🎯 What You'll Learn

- FHEVM contract structure and imports
- Working with encrypted data types
- Implementing FHE operations (add, subtract, decrypt)
- Access Control Lists (ACL) management
- Testing strategies for encrypted contracts
- Gas optimization techniques

## 📋 Contract Overview

Our FHECounter contract demonstrates core FHEVM concepts:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract FHECounter is SepoliaConfig {
    euint32 private _count;      // Encrypted counter
    address public owner;        // Contract owner

    // Events for tracking operations
    event CountUpdated(address indexed user, string operation);
}
```

## 🔧 Key Components Breakdown

### 1. **Imports and Dependencies**

```solidity
import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
```

**Essential imports:**
- `FHE`: Main library for FHE operations
- `euint32`: Encrypted 32-bit unsigned integer type
- `externalEuint32`: Type for encrypted data from external sources
- `SepoliaConfig`: Network-specific configuration

### 2. **Encrypted Data Types**

FHEVM supports several encrypted types:

```solidity
euint4 private tinyNumber;       // 4-bit encrypted integer (0-15)
euint8 private smallNumber;      // 8-bit encrypted integer (0-255)
euint16 private mediumNumber;    // 16-bit encrypted integer (0-65535)
euint32 private largeNumber;     // 32-bit encrypted integer (0-4294967295)
euint64 private veryLargeNumber; // 64-bit encrypted integer (0-18446744073709551615)
euint128 private hugeNumber;     // 128-bit encrypted integer (0-2^128-1)
euint256 private maxNumber;      // 256-bit encrypted integer (0-2^256-1)
ebool private encryptedFlag;     // Encrypted boolean
eaddress private encryptedAddr;  // Encrypted address

// External input types for client-side encrypted data
externalEuint4, externalEuint8, externalEuint16, externalEuint32,
externalEuint64, externalEuint128, externalEuint256,
externalEbool, externalEaddress
```

Signed variants like `eint8`, `eint16`, `eint32`, `eint64`, `eint128`, `eint256` are also available for negative values.

### 3. **Constructor and Initialization**

```solidity
constructor() {
    _count = FHE.asEuint32(0);  // Create encrypted zero
    FHE.allowThis(_count);      // Allow contract to access this value
    FHE.allow(_count, msg.sender); // Allow deployer to decrypt initial value
    owner = msg.sender;         // Set contract owner for ACL management
}
```

**Key concepts:**
- `FHE.asEuint32(0)`: Creates an encrypted version of plaintext 0
- `FHE.allowThis(_count)`: Grants the contract permission to access the encrypted value
- Owner tracking for access control management

## 🔒 Access Control Lists (ACL)

FHEVM uses a sophisticated ACL system to control who can decrypt encrypted data:

### Understanding ACL Permissions

```solidity
// Grant permissions
FHE.allowThis(_count);        // Contract can access
FHE.allow(_count, msg.sender); // Specific user can access

// Check permissions
bool canAccess = FHE.isSenderAllowed(_count);

// In our contract:
function canUserDecrypt() external view returns (bool) {
    return FHE.isSenderAllowed(_count);
}
```

### ACL Best Practices

1. **Always grant contract access:**
   ```solidity
   FHE.allowThis(_count);  // Required for future operations
   ```

2. **Grant user access selectively:**
   ```solidity
   FHE.allow(_count, msg.sender);  // User who performed operation
   ```

3. **Consider access patterns:**
   ```solidity
   // For public readable values
   FHE.allow(_count, address(0));  // Anyone can decrypt

   // For owner-only values
   if (msg.sender == owner) {
       FHE.allow(_count, owner);
   }
   ```

## ⚡ FHE Operations

### Arithmetic Operations

```solidity
function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    // Convert external encrypted input to internal type
    euint32 encryptedInput = FHE.fromExternal(inputEuint32, inputProof);

    // Perform encrypted addition
    _count = FHE.add(_count, encryptedInput);

    // Update ACL permissions
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);

    emit CountUpdated(msg.sender, "increment");
}
```

**Available arithmetic operations:**
- `FHE.add(a, b)` - Addition
- `FHE.sub(a, b)` - Subtraction
- `FHE.mul(a, b)` - Multiplication
- `FHE.div(a, b)` - Division (integer division)
- `FHE.rem(a, b)` - Remainder/modulo
- `FHE.min(a, b)` - Minimum value
- `FHE.max(a, b)` - Maximum value
- `FHE.neg(a)` - Negation (for signed types)

**Bitwise operations:**
- `FHE.and(a, b)` - Bitwise AND
- `FHE.or(a, b)` - Bitwise OR
- `FHE.xor(a, b)` - Bitwise XOR
- `FHE.not(a)` - Bitwise NOT
- `FHE.shl(a, b)` - Shift left
- `FHE.shr(a, b)` - Shift right
- `FHE.rotl(a, b)` - Rotate left
- `FHE.rotr(a, b)` - Rotate right

### Comparison Operations

```solidity
// Comparison operations return encrypted booleans (ebool)
ebool isGreater = FHE.gt(_count, FHE.asEuint32(10));
ebool isEqual = FHE.eq(_count, threshold);
ebool isLessOrEqual = FHE.le(_count, maxValue);
```

**Available comparisons:**
- `FHE.eq(a, b)` - Equal
- `FHE.ne(a, b)` - Not equal
- `FHE.lt(a, b)` - Less than
- `FHE.le(a, b)` - Less than or equal
- `FHE.gt(a, b)` - Greater than
- `FHE.ge(a, b)` - Greater than or equal

### Conditional Operations

```solidity
// Select operation: if condition then a else b
euint32 result = FHE.select(
    FHE.gt(_count, FHE.asEuint32(100)),  // condition (ebool)
    FHE.asEuint32(0),                    // value if true
    _count                               // value if false
);

// Require operation (throws if condition is false)
FHE.require(FHE.gt(balance, FHE.asEuint32(0)), "Balance must be positive");
```

### Random Number Generation

```solidity
// Generate cryptographically secure random numbers on-chain
euint8 random8 = FHE.randEuint8();     // Random 8-bit value
euint16 random16 = FHE.randEuint16();  // Random 16-bit value
euint32 random32 = FHE.randEuint32();  // Random 32-bit value
euint64 random64 = FHE.randEuint64();  // Random 64-bit value

// Bounded random numbers
euint32 randomBounded = FHE.rem(FHE.randEuint32(), maxValue); // [0, maxValue)
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

### Testing FHEVM Contracts

```typescript
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { FHECounter, FHECounter__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

describe("FHECounter", function () {
  let signers: { deployer: HardhatEthersSigner; alice: HardhatEthersSigner; bob: HardhatEthersSigner; };
  let fheCounterContract: FHECounter;
  let fheCounterContractAddress: string;

  beforeEach(async function () {
    // Check if running in mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };

    const factory = (await ethers.getContractFactory("FHECounter")) as FHECounter__factory;
    fheCounterContract = (await factory.deploy()) as FHECounter;
    fheCounterContractAddress = await fheCounterContract.getAddress();
  });

  it("encrypted count should be initialized to zero after deployment", async function () {
    const encryptedCount = await fheCounterContract.getCount();
    expect(encryptedCount).to.not.eq(ethers.ZeroHash);

    // Verify it decrypts to 0 (deployer has permission from constructor)
    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      fheCounterContractAddress,
      signers.deployer,
    );
    expect(clearCount).to.eq(0);
  });

  it("increment the counter by 1", async function () {
    // Encrypt constant 1 as a euint32
    const clearOne = 1;
    const encryptedOne = await fhevm
      .createEncryptedInput(fheCounterContractAddress, signers.alice.address)
      .add32(clearOne)
      .encrypt();

    const tx = await fheCounterContract
      .connect(signers.alice)
      .increment(encryptedOne.handles[0], encryptedOne.inputProof);
    await tx.wait();

    const encryptedCountAfterInc = await fheCounterContract.getCount();
    const clearCountAfterInc = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCountAfterInc,
      fheCounterContractAddress,
      signers.alice,
    );

    expect(Number(clearCountAfterInc)).to.eq(1);
  });
});
```

## ⛽ Gas Optimization

### 1. **Batch Operations**

```solidity
// Instead of multiple separate operations
function inefficientOperations(
    externalEuint32[] calldata inputs,
    bytes[] calldata proofs
) external {
    for (uint i = 0; i < inputs.length; i++) {
        euint32 encrypted = FHE.fromExternal(inputs[i], proofs[i]);
        _count = FHE.add(_count, encrypted);
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }
}

// Batch the operations
function efficientBatchOperation(
    externalEuint32[] calldata inputs,
    bytes[] calldata proofs
) external {
    euint32 sum = FHE.asEuint32(0);

    // Accumulate all inputs
    for (uint i = 0; i < inputs.length; i++) {
        euint32 encrypted = FHE.fromExternal(inputs[i], proofs[i]);
        sum = FHE.add(sum, encrypted);
    }

    // Single update
    _count = FHE.add(_count, sum);

    // Single ACL update
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

### 2. **Minimize ACL Operations**

```solidity
// Group ACL operations
function updateCounters(
    externalEuint32 input1,
    bytes calldata proof1,
    externalEuint32 input2,
    bytes calldata proof2
) external {
    euint32 encrypted1 = FHE.fromExternal(input1, proof1);
    euint32 encrypted2 = FHE.fromExternal(input2, proof2);

    _count = FHE.add(_count, encrypted1);
    _count = FHE.add(_count, encrypted2);

    // Single ACL update for final result
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

## 🔍 Advanced Patterns

### 1. **Encrypted State Machines**

```solidity
contract EncryptedVoting {
    enum State { Created, Voting, Ended }

    euint32 private yesVotes;
    euint32 private noVotes;
    State public currentState;

    function vote(externalEuint32 encryptedVote, bytes calldata proof) external {
        require(currentState == State.Voting, "Voting not active");

        euint32 vote = FHE.fromExternal(encryptedVote, proof);

        // vote should be 0 (no) or 1 (yes)
        ebool isYes = FHE.eq(vote, FHE.asEuint32(1));

        // Conditional increment
        yesVotes = FHE.add(yesVotes, FHE.select(isYes, FHE.asEuint32(1), FHE.asEuint32(0)));
        noVotes = FHE.add(noVotes, FHE.select(isYes, FHE.asEuint32(0), FHE.asEuint32(1)));

        FHE.allowThis(yesVotes);
        FHE.allowThis(noVotes);
    }
}
```

### 2. **Encrypted Access Control**

```solidity
contract EncryptedDAO {
    mapping(address => euint32) private memberTokens;
    euint32 private constant VOTING_THRESHOLD = FHE.asEuint32(100);

    function propose(string memory proposal) external {
        euint32 userTokens = memberTokens[msg.sender];

        // Require sufficient tokens (encrypted check)
        FHE.require(
            FHE.gte(userTokens, VOTING_THRESHOLD),
            "Insufficient tokens to propose"
        );

        // Proceed with proposal...
    }
}
```

## 📝 Best Practices Checklist

### Contract Design
- [ ] Always inherit from appropriate network config (`SepoliaConfig`, etc.)
- [ ] Use appropriate encrypted types for your data size needs
- [ ] Implement proper ACL management in all operations
- [ ] Include overflow/underflow protection where needed
- [ ] Emit events for off-chain tracking

### Security
- [ ] Validate all inputs with `FHE.require`
- [ ] Use owner-only decryption for sensitive data
- [ ] Protect against MEV with encrypted events
- [ ] Test ACL permissions thoroughly
- [ ] Consider gas costs in complex operations

### Testing
- [ ] Test all encrypted operations with various inputs
- [ ] Verify ACL permissions for different users
- [ ] Test edge cases (overflow, underflow, zero values)
- [ ] Performance test with large encrypted operations

## 🚀 Next Steps

Now that you understand FHEVM smart contract development, you're ready to build the frontend that interacts with these encrypted contracts. In the next tutorial, we'll create a React application that handles client-side encryption and provides a seamless user experience.

---

**Ready for the frontend?** Continue to [Frontend Integration](05-frontend-integration.md) →

## 📚 Additional Resources

- [FHEVM Solidity Library Reference](https://docs.zama.ai/protocol/solidity-guides/getting-started/overview)
- [Advanced FHE Operations](https://github.com/zama-ai/fhevm-solidity/tree/main/examples)