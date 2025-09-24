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
// Unsigned encrypted integers
euint4   // 4-bit encrypted unsigned integer  (0 to 15)
euint8   // 8-bit encrypted unsigned integer  (0 to 255)
euint16  // 16-bit encrypted unsigned integer (0 to 65,535)
euint32  // 32-bit encrypted unsigned integer (0 to 4,294,967,295)
euint64  // 64-bit encrypted unsigned integer (0 to 18,446,744,073,709,551,615)
euint128 // 128-bit encrypted unsigned integer (0 to 2^128-1)
euint256 // 256-bit encrypted unsigned integer (0 to 2^256-1)

// Signed encrypted integers (for negative values)
eint8, eint16, eint32, eint64, eint128, eint256

// Other encrypted types
ebool    // Encrypted boolean (true/false)
eaddress // Encrypted Ethereum address

// External input types (for client-side encrypted data)
externalEbool, externalEaddress, externalEuint4, externalEuint8,
externalEuint16, externalEuint32, externalEuint64, externalEuint128, externalEuint256
```

#### **Arithmetic Operations**
```solidity
// Basic arithmetic
euint32 sum = FHE.add(a, b);      // a + b
euint32 diff = FHE.sub(a, b);     // a - b
euint32 product = FHE.mul(a, b);  // a × b
euint32 quotient = FHE.div(a, b); // a ÷ b (integer division)
euint32 remainder = FHE.rem(a, b); // a % b (modulo)
euint32 minimum = FHE.min(a, b);  // min(a, b)
euint32 maximum = FHE.max(a, b);  // max(a, b)
euint32 negated = FHE.neg(a);     // -a (for signed types)

// Bitwise operations
euint32 result = FHE.and(a, b);   // a & b (bitwise AND)
euint32 result = FHE.or(a, b);    // a | b (bitwise OR)
euint32 result = FHE.xor(a, b);   // a ^ b (bitwise XOR)
euint32 result = FHE.not(a);      // ~a (bitwise NOT)
euint32 result = FHE.shl(a, b);   // a << b (shift left)
euint32 result = FHE.shr(a, b);   // a >> b (shift right)
euint32 result = FHE.rotl(a, b);  // rotate left
euint32 result = FHE.rotr(a, b);  // rotate right
```

#### **Comparison Operations**
```solidity
// All comparisons return encrypted booleans (ebool)
ebool isEqual = FHE.eq(a, b);       // a == b
ebool isNotEqual = FHE.ne(a, b);    // a != b
ebool isLess = FHE.lt(a, b);        // a < b
ebool isLessOrEqual = FHE.le(a, b); // a <= b
ebool isGreater = FHE.gt(a, b);     // a > b
ebool isGreaterOrEqual = FHE.ge(a, b); // a >= b
```

#### **Control Flow Operations**
```solidity
// Conditional selection (ternary operator equivalent)
euint32 result = FHE.select(condition, ifTrue, ifFalse); // condition ? ifTrue : ifFalse

// Conditional requirement (throws if condition is false)
FHE.require(condition, "Error message"); // require(condition, message)
```

#### **Random Number Generation**
```solidity
// Generate cryptographically secure random numbers on-chain
euint8 random8 = FHE.randEuint8();     // Random 8-bit value
euint16 random16 = FHE.randEuint16();  // Random 16-bit value
euint32 random32 = FHE.randEuint32();  // Random 32-bit value
euint64 random64 = FHE.randEuint64();  // Random 64-bit value

// Bounded random numbers
euint32 randomBounded = FHE.rem(FHE.randEuint32(), maxValue); // [0, maxValue)
```

## 🔒 **Confidential Token Balance**
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
   - FHE operations have higher gas costs than plaintext operations
   - Complex computations may approach block gas limits
   - Bootstrap operations (when needed) are computationally intensive

2. **Functionality:**
   - No native floating-point arithmetic (use fixed-point representations)
   - Integer division with limited precision
   - Complex conditional logic requires careful optimization

3. **Data Types:**
   - Fixed-size encrypted integers (euint4 to euint256)
   - No dynamic arrays of encrypted elements
   - String operations must be implemented as byte operations
   - External inputs require proof validation

### **Design Considerations**

#### **1. Choose Appropriate Data Types**
```solidity
// Use smallest sufficient type
euint8 age;        // 0-255, sufficient for human age
euint16 inventory; // 0-65k, sufficient for item counts
euint32 balance;   // 0-4B, sufficient for token amounts
```

#### **2. Minimize Complex Computations**
```solidity
// Bad: Complex nested operations
ebool result = FHE.and(
    FHE.gt(balance, threshold),
    FHE.and(
        FHE.lt(balance, upperLimit),
        FHE.eq(status, activeStatus)
    )
);

// Good: Structured operations
ebool balanceInRange = FHE.and(
    FHE.gt(balance, threshold),
    FHE.lt(balance, upperLimit)
);
ebool isActive = FHE.eq(status, activeStatus);
ebool result = FHE.and(balanceInRange, isActive);

// Note: Decryption happens off-chain via client SDK
// The encrypted result can be returned to client for decryption
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

- [Homomorphic Encryption Standardization](https://homomorphicencryption.org/)
- [Learning With Errors Problem](https://en.wikipedia.org/wiki/Learning_with_errors)
- [Bootstrapping in FHE](https://eprint.iacr.org/2009/453.pdf)
- [Zama's TFHE Implementation](https://github.com/zama-ai/tfhe-rs)