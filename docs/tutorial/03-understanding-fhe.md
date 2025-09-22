# Understanding Fully Homomorphic Encryption

This tutorial dives deep into the cryptographic foundations of Fully Homomorphic Encryption (FHE) and how it enables confidential computing on the blockchain. Understanding these concepts will help you build more secure and efficient FHEVM applications.

## 🎯 What You'll Learn

- Mathematical foundations of FHE
- Different types of homomorphic encryption
- How TFHE (Threshold FHE) works in practice
- Security properties and guarantees
- Performance characteristics and trade-offs
- Practical limitations and considerations

## 🔐 Cryptographic Foundations

### What is Homomorphic Encryption?

Homomorphic encryption allows computations to be performed on encrypted data without decrypting it first. The result, when decrypted, matches what would have been obtained if the operations were performed on the plaintext.

**Mathematical Property:**
```
E(a) ⊕ E(b) = E(a ⊕ b)
```

Where:
- `E()` is the encryption function
- `⊕` represents any supported operation (addition, multiplication, etc.)
- `a` and `b` are plaintext values

### Types of Homomorphic Encryption

#### 1. **Partially Homomorphic Encryption (PHE)**
Supports unlimited operations of one type (either addition OR multiplication).

**Example - RSA (Multiplicative):**
```
E(a) × E(b) = E(a × b)
```

**Example - Paillier (Additive):**
```
E(a) + E(b) = E(a + b)
```

#### 2. **Somewhat Homomorphic Encryption (SHE)**
Supports limited operations of multiple types.

```
E(a) + E(b) = E(a + b)  // Addition (unlimited)
E(a) × E(b) = E(a × b)  // Multiplication (limited depth)
```

#### 3. **Fully Homomorphic Encryption (FHE)**
Supports unlimited operations of multiple types.

```
E(a) + E(b) = E(a + b)  // Addition (unlimited)
E(a) × E(b) = E(a × b)  // Multiplication (unlimited)
E(f(a)) = f(E(a))       // Any polynomial function
```

## 🏗️ TFHE: Threshold Fully Homomorphic Encryption

FHEVM uses TFHE, which combines FHE with threshold cryptography for enhanced security and practical deployment.

### Core TFHE Concepts

#### **1. Torus Representation**
TFHE operates on a mathematical torus (circle) rather than integers.

```
Torus = ℝ/ℤ = [0, 1)
```

**Benefits:**
- Natural modular arithmetic
- Efficient noise management
- Reduced ciphertext size

#### **2. Learning With Errors (LWE)**
TFHE security is based on the LWE problem, which is a mathematical puzzle that's believed to be very hard to solve.

**LWE in Simple Terms:**
```
LWE Sample: (a_vector, b) where b = dot_product(a_vector, secret_key) + small_error (mod q)
```

**What this means:**
- `a_vector` = a random list of numbers [a1, a2, a3, ...]
- `secret_key` = a hidden list of numbers [s1, s2, s3, ...]
- `dot_product` = multiply corresponding elements and add them up: (a1×s1 + a2×s2 + a3×s3 + ...)
- `small_error` = a tiny random number added as "noise"
- `q` = a large number we use for modular arithmetic

**Example with actual numbers:**
```
a_vector = [7, 3, 9, 2]
secret_key = [5, 1, 8, 4] (this is secret!)
dot_product = 7×5 + 3×1 + 9×8 + 2×4 = 35 + 3 + 72 + 8 = 118
small_error = 2 (random small number)
q = 251 (prime number)
b = (118 + 2) mod 251 = 120

LWE Sample = ([7, 3, 9, 2], 120)
```

**Why this is secure:**
Given many such samples, it's extremely hard to figure out what the secret_key is, even with powerful computers!

#### **3. Bootstrapping**
Technique to refresh ciphertexts and reduce accumulated noise.

```
Noisy Ciphertext → Bootstrapping → Fresh Ciphertext
```

**Process:**
1. Encrypt the decryption process itself
2. Apply homomorphic decryption
3. Obtain refreshed ciphertext

### TFHE Operations in FHEVM

#### **Supported Data Types**
```solidity
euint8   // 8-bit encrypted unsigned integer  (0 to 255)
euint16  // 16-bit encrypted unsigned integer (0 to 65,535)
euint32  // 32-bit encrypted unsigned integer (0 to 4,294,967,295)
euint64  // 64-bit encrypted unsigned integer (0 to 18,446,744,073,709,551,615)
ebool    // Encrypted boolean (true/false)
eaddress // Encrypted Ethereum address
```

#### **Arithmetic Operations**
```solidity
// Basic arithmetic
euint32 sum = FHE.add(a, b);      // a + b
euint32 diff = FHE.sub(a, b);     // a - b
euint32 product = FHE.mul(a, b);  // a × b
euint32 quotient = FHE.div(a, b); // a ÷ b (limited precision)

// Bitwise operations
euint32 result = FHE.and(a, b);   // a & b
euint32 result = FHE.or(a, b);    // a | b
euint32 result = FHE.xor(a, b);   // a ^ b
euint32 result = FHE.not(a);      // ~a
```

#### **Comparison Operations**
```solidity
// All comparisons return encrypted booleans (ebool)
ebool isEqual = FHE.eq(a, b);     // a == b
ebool notEqual = FHE.ne(a, b);    // a != b
ebool lessThan = FHE.lt(a, b);    // a < b
ebool lessEqual = FHE.le(a, b);   // a <= b
ebool greater = FHE.gt(a, b);     // a > b
ebool greaterEq = FHE.ge(a, b);   // a >= b
```

#### **Control Flow Operations**
```solidity
// Conditional selection: if condition then a else b
euint32 result = FHE.select(condition, a, b);

// Where condition is an ebool
ebool condition = FHE.lt(x, FHE.asEuint32(100));
euint32 result = FHE.select(condition, x, FHE.asEuint32(0));
```

## 🔒 Security Properties

### **Semantic Security**
TFHE provides semantic security, meaning ciphertexts reveal no information about plaintexts.

**Property:**
For any two plaintexts `m₀` and `m₁`, their ciphertexts are computationally indistinguishable.

```
Encrypt(m₀) ≈ᶜ Encrypt(m₁)
```

### **Circuit Privacy**
Not only the inputs but also the computation itself remains hidden.

**Example:**
```solidity
// The fact that we're computing max(a, b) is hidden
euint32 maximum = FHE.select(FHE.gt(a, b), a, b);
```

### **Threshold Security**
TFHE uses threshold cryptography where multiple parties must collaborate to decrypt.

**Benefits:**
- No single point of failure
- Distributed trust
- Enhanced security

## ⚡ Performance Characteristics

### **Computational Complexity**

#### **Operation Costs (Relative)**
```
Operation Type    | Relative Cost | Use Case
------------------|---------------|------------------
Addition          | 1x           | Counters, sums
Subtraction       | 1x           | Differences
Multiplication    | 100x         | Products, scaling
Division          | 1000x        | Ratios (limited)
Comparison        | 50x          | Conditionals
Bootstrapping     | 10000x       | Noise refresh
```

#### **Gas Costs in FHEVM**
```solidity
// Estimated gas costs (approximate)
FHE.add(a, b);      // ~50,000 gas
FHE.mul(a, b);      // ~500,000 gas
FHE.lt(a, b);       // ~200,000 gas
FHE.select(c, a, b); // ~300,000 gas
```

### **Optimization Strategies**

#### **1. Minimize Expensive Operations**
```solidity
// Bad: Multiple divisions
euint32 avg1 = FHE.div(sum1, count);
euint32 avg2 = FHE.div(sum2, count);
euint32 avg3 = FHE.div(sum3, count);

// Good: Single division
euint32 totalSum = FHE.add(FHE.add(sum1, sum2), sum3);
euint32 totalAvg = FHE.div(totalSum, FHE.mul(count, FHE.asEuint32(3)));
```

#### **2. Batch Operations**
```solidity
// Bad: Sequential operations
for (uint i = 0; i < values.length; i++) {
    result = FHE.add(result, values[i]);
}

// Good: Tree reduction
function batchAdd(euint32[] memory values) returns (euint32) {
    if (values.length == 1) return values[0];

    euint32[] memory nextLevel = new euint32[]((values.length + 1) / 2);
    for (uint i = 0; i < values.length; i += 2) {
        if (i + 1 < values.length) {
            nextLevel[i/2] = FHE.add(values[i], values[i+1]);
        } else {
            nextLevel[i/2] = values[i];
        }
    }
    return batchAdd(nextLevel);
}
```

#### **3. Precompute Constants**
```solidity
// Bad: Repeated encryption
function processItems(uint32[] calldata items) external {
    for (uint i = 0; i < items.length; i++) {
        euint32 threshold = FHE.asEuint32(100); // Repeated encryption
        if (FHE.decrypt(FHE.gt(FHE.asEuint32(items[i]), threshold))) {
            // Process item
        }
    }
}

// Good: Precomputed constants
euint32 private constant THRESHOLD = FHE.asEuint32(100);

function processItems(uint32[] calldata items) external {
    for (uint i = 0; i < items.length; i++) {
        if (FHE.decrypt(FHE.gt(FHE.asEuint32(items[i]), THRESHOLD))) {
            // Process item
        }
    }
}
```

## 🎯 Practical Examples

### **Example 1: Encrypted Auction**
```solidity
contract EncryptedAuction {
    euint32 private highestBid;
    address private highestBidder;

    function bid(externalEuint32 bidAmount, bytes calldata proof) external {
        euint32 encryptedBid = FHE.fromExternal(bidAmount, proof);

        // Compare with current highest bid
        ebool isHigher = FHE.gt(encryptedBid, highestBid);

        // Update if higher (using select for constant-time execution)
        highestBid = FHE.select(isHigher, encryptedBid, highestBid);

        // Update bidder (this reveals the winner, but not the bid amount)
        if (FHE.decrypt(isHigher)) {
            highestBidder = msg.sender;
        }

        // Grant access to the bidder for their own bid
        FHE.allow(encryptedBid, msg.sender);
    }
}
```

### **Example 2: Private Voting**
```solidity
contract PrivateVoting {
    euint32 private yesVotes;
    euint32 private noVotes;
    mapping(address => ebool) private hasVoted;

    function vote(externalEuint32 choice, bytes calldata proof) external {
        // Ensure haven't voted before
        require(!FHE.decrypt(hasVoted[msg.sender]), "Already voted");

        euint32 encryptedChoice = FHE.fromExternal(choice, proof);

        // choice should be 0 (no) or 1 (yes)
        ebool isYes = FHE.eq(encryptedChoice, FHE.asEuint32(1));

        // Increment appropriate counter
        yesVotes = FHE.add(yesVotes, FHE.select(isYes, FHE.asEuint32(1), FHE.asEuint32(0)));
        noVotes = FHE.add(noVotes, FHE.select(isYes, FHE.asEuint32(0), FHE.asEuint32(1)));

        // Mark as voted
        hasVoted[msg.sender] = FHE.asEbool(true);
    }

    function getResults() external view returns (uint32, uint32) {
        // Only admin or after voting period
        require(msg.sender == admin || block.timestamp > votingEnd, "Not authorized");
        return (FHE.decrypt(yesVotes), FHE.decrypt(noVotes));
    }
}
```

### **Example 3: Confidential Token Balance**
```solidity
contract ConfidentialToken {
    mapping(address => euint32) private balances;

    function transfer(address to, externalEuint32 amount, bytes calldata proof) external {
        euint32 encryptedAmount = FHE.fromExternal(amount, proof);

        // Check sufficient balance
        ebool hasSufficientBalance = FHE.ge(balances[msg.sender], encryptedAmount);
        FHE.require(hasSufficientBalance, "Insufficient balance");

        // Perform transfer
        balances[msg.sender] = FHE.sub(balances[msg.sender], encryptedAmount);
        balances[to] = FHE.add(balances[to], encryptedAmount);

        // Update ACL permissions
        FHE.allow(balances[msg.sender], msg.sender);
        FHE.allow(balances[to], to);
    }

    function getBalance() external view returns (euint32) {
        return balances[msg.sender];
    }
}
```

## 🚧 Limitations and Considerations

### **Current Limitations**

1. **Performance:**
   - FHE operations are 100-10,000x slower than plaintext
   - High gas costs for complex computations
   - Limited by blockchain block gas limits

2. **Functionality:**
   - No floating-point arithmetic
   - Limited division precision
   - Complex control flow is expensive

3. **Data Types:**
   - Fixed-size integers only
   - No dynamic arrays of encrypted data
   - Limited string operations

### **Design Considerations**

#### **1. Choose Appropriate Data Types**
```solidity
// Use smallest sufficient type
euint8 age;        // 0-255, sufficient for human age
euint16 inventory; // 0-65k, sufficient for item counts
euint32 balance;   // 0-4B, sufficient for token amounts
```

#### **2. Minimize Decryptions**
```solidity
// Bad: Frequent decryptions
if (FHE.decrypt(FHE.gt(balance, threshold))) {
    if (FHE.decrypt(FHE.lt(balance, upperLimit))) {
        // Process
    }
}

// Good: Single decryption
ebool inRange = FHE.and(
    FHE.gt(balance, threshold),
    FHE.lt(balance, upperLimit)
);
if (FHE.decrypt(inRange)) {
    // Process
}
```

#### **3. Consider Access Patterns**
```solidity
// Design ACL permissions carefully
function updateValue(euint32 newValue) external {
    value = newValue;

    // Consider who needs access
    FHE.allowThis(value);        // Contract always needs access
    FHE.allow(value, owner);     // Owner can always decrypt
    FHE.allow(value, msg.sender); // Updater can verify their update
}
```

## 🔬 Advanced Topics

### **Noise Management**
FHE ciphertexts accumulate noise with each operation. Understanding noise growth helps optimize circuits.

**Noise Growth Patterns:**
- Addition: Linear noise growth
- Multiplication: Exponential noise growth
- Bootstrapping: Resets noise but is expensive

### **Circuit Depth Optimization**
Minimize the multiplicative depth of your circuits for better performance.

```solidity
// High depth (bad)
euint32 result = FHE.mul(FHE.mul(a, b), FHE.mul(c, d));

// Low depth (good)
euint32 ab = FHE.mul(a, b);
euint32 cd = FHE.mul(c, d);
euint32 result = FHE.mul(ab, cd);
```

### **Parallelization Opportunities**
Independent operations can be computed in parallel.

```solidity
// These can be computed in parallel
euint32 sum1 = FHE.add(a, b);
euint32 sum2 = FHE.add(c, d);
euint32 product = FHE.mul(e, f);

// Final combination
euint32 result = FHE.add(FHE.add(sum1, sum2), product);
```

## 🎓 Key Takeaways

### **Understanding FHE Helps You:**

1. **Design Efficient Contracts:**
   - Choose appropriate operations
   - Minimize expensive computations
   - Optimize gas usage

2. **Ensure Security:**
   - Understand what remains confidential
   - Design proper access control
   - Avoid information leakage

3. **Debug Issues:**
   - Understand performance bottlenecks
   - Identify security vulnerabilities
   - Optimize for production use

4. **Plan for Scale:**
   - Design for future improvements
   - Consider hardware acceleration
   - Plan migration strategies

## 🚀 Next Steps

With a solid understanding of FHE fundamentals, you're ready to implement these concepts in practice. The next tutorial will guide you through building FHEVM smart contracts that leverage these cryptographic capabilities effectively.

---

**Ready to build?** Continue to [Smart Contract Development](04-smart-contracts.md) →

## 📚 Further Reading

- [TFHE Library Specification](https://docs.zama.ai/tfhe)
- [Homomorphic Encryption Standardization](https://homomorphicencryption.org/)
- [Learning With Errors Problem](https://en.wikipedia.org/wiki/Learning_with_errors)
- [Bootstrapping in FHE](https://eprint.iacr.org/2011/277.pdf)
- [Zama's TFHE Implementation](https://github.com/zama-ai/tfhe-rs)