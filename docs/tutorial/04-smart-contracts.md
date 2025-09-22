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
euint8 private smallNumber;      // 8-bit encrypted integer (0-255)
euint16 private mediumNumber;    // 16-bit encrypted integer (0-65535)
euint32 private largeNumber;     // 32-bit encrypted integer (0-4294967295)
euint64 private veryLargeNumber; // 64-bit encrypted integer
ebool private encryptedFlag;     // Encrypted boolean
eaddress private encryptedAddr;  // Encrypted address
```

### 3. **Constructor and Initialization**

```solidity
constructor() {
    _count = FHE.asEuint32(0);  // Create encrypted zero
    FHE.allowThis(_count);      // Allow contract to access this value
    owner = msg.sender;         // Set owner for ACL management
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
- `FHE.div(a, b)` - Division (limited precision)

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
```

## 🛡️ Security Considerations

### 1. **Input Validation with FHE.require**

```solidity
function secureIncrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
    euint32 encryptedInput = FHE.fromExternal(inputEuint32, inputProof);

    // Validate input range (encrypted validation)
    euint32 maxIncrement = FHE.asEuint32(1000);
    FHE.require(FHE.le(encryptedInput, maxIncrement), "Increment too large");

    // Prevent overflow
    euint32 maxValue = FHE.asEuint32(4294967290);
    FHE.require(FHE.lt(_count, maxValue), "Counter overflow protection");

    _count = FHE.add(_count, encryptedInput);

    // ACL management
    FHE.allowThis(_count);
    FHE.allow(_count, msg.sender);
}
```

### 2. **Secure Decryption Patterns**

```solidity
// Owner-only decryption
function getDecryptedCount() external view returns (uint32) {
    require(msg.sender == owner, "Only owner can decrypt");
    return FHE.decrypt(_count);
}

// Conditional decryption
function getCountIfAuthorized() external view returns (uint32) {
    require(FHE.isSenderAllowed(_count), "Not authorized to decrypt");
    return FHE.decrypt(_count);
}
```

### 3. **Protecting Against MEV**

```solidity
// Bad: Exposes increment amount in events
event CountUpdated(address indexed user, uint32 amount); // ❌

// Good: Keep amounts encrypted
event CountUpdated(address indexed user, string operation); // ✅

// Advanced: Encrypted event data
event EncryptedUpdate(address indexed user, euint32 newValue); // ✅
```

## 🧪 Testing FHEVM Contracts

### Test Structure

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { createInstance } from "../utils/fhevm";

describe("FHECounter", function () {
    let counter: any;
    let owner: any;
    let user: any;
    let fhevmInstance: any;

    beforeEach(async function () {
        [owner, user] = await ethers.getSigners();

        const FHECounter = await ethers.getContractFactory("FHECounter");
        counter = await FHECounter.deploy();
        await counter.waitForDeployment();

        // Initialize FHEVM instance for encryption
        fhevmInstance = await createInstance();
    });
});
```

### Testing Encrypted Operations

```typescript
it("Should increment counter with encrypted value", async function () {
    // Encrypt the increment value
    const incrementValue = 5;
    const encryptedIncrement = await fhevmInstance.encrypt32(incrementValue);

    // Perform increment operation
    await counter.increment(encryptedIncrement.handles[0], encryptedIncrement.inputProof);

    // Verify the operation succeeded (check events)
    const events = await counter.queryFilter(counter.filters.CountUpdated());
    expect(events.length).to.equal(1);
    expect(events[0].args.operation).to.equal("increment");
});
```

### Testing ACL Permissions

```typescript
it("Should manage ACL permissions correctly", async function () {
    // Initially, no one can decrypt
    expect(await counter.canUserDecrypt()).to.be.false;

    // Perform operation to gain access
    const encryptedValue = await fhevmInstance.encrypt32(10);
    await counter.increment(encryptedValue.handles[0], encryptedValue.inputProof);

    // Now user should have access
    expect(await counter.canUserDecrypt()).to.be.true;
});
```

### Testing Decryption

```typescript
it("Should allow owner to decrypt counter", async function () {
    // Setup: increment counter
    const incrementValue = 42;
    const encryptedIncrement = await fhevmInstance.encrypt32(incrementValue);
    await counter.increment(encryptedIncrement.handles[0], encryptedIncrement.inputProof);

    // Owner should be able to decrypt
    const decryptedValue = await counter.connect(owner).getDecryptedCount();
    expect(decryptedValue).to.equal(42);
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

- [FHEVM Solidity Library Reference](https://docs.zama.ai/protocol/solidity-guides)
- [Advanced FHE Operations](https://docs.zama.ai/protocol/examples/basic/fhe-operations)