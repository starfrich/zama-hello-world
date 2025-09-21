// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Hello FHEVM - A beginner-friendly encrypted counter
/// @author Zama Hello FHEVM Tutorial
/// @notice A simple smart contract demonstrating encrypted data operations on FHEVM
/// @dev This contract shows basic FHE operations: increment, decrement, and retrieval of encrypted values
contract HelloFHEVM is SepoliaConfig {
    // Private encrypted counter variable
    euint32 private _counter;

    /// @notice Event emitted when counter operations are performed
    /// @param user The address that performed the operation
    /// @param operation The type of operation performed (increment, decrement, reset, initialized)
    /// @param newValue The new value after operation (placeholder, always 0 for encrypted values)
    event CounterOperation(address indexed user, string operation, uint256 indexed newValue);

    /// @notice Initialize the contract with a counter starting at 0
    constructor() {
        _counter = FHE.asEuint32(0);
        // Grant initial permissions to the contract itself
        FHE.allowThis(_counter);
        emit CounterOperation(msg.sender, "initialized", 0);
    }

    /// @notice Get the current encrypted counter value
    /// @return The encrypted counter as euint32
    /// @dev The returned value is encrypted and can only be decrypted by authorized parties
    function getCounter() external view returns (euint32) {
        return _counter;
    }

    /// @notice Increment the counter by an encrypted value
    /// @param encryptedInput The encrypted value to add (externalEuint32)
    /// @param inputProof The cryptographic proof for the encrypted input
    /// @dev This function:
    /// 1. Converts the external encrypted input to internal format
    /// 2. Adds it to the current counter
    /// 3. Grants permission for the contract and caller to access the result
    function increment(externalEuint32 encryptedInput, bytes calldata inputProof) external {
        // Convert external encrypted input to internal format
        euint32 inputValue = FHE.fromExternal(encryptedInput, inputProof);

        // Grant permission for the input value to this contract
        FHE.allowThis(inputValue);

        // Perform encrypted addition
        _counter = FHE.add(_counter, inputValue);

        // Grant permissions for the encrypted result
        FHE.allowThis(_counter); // Contract can access
        FHE.allow(_counter, msg.sender); // Caller can access

        emit CounterOperation(msg.sender, "increment", 0);
    }

    /// @notice Decrement the counter by an encrypted value
    /// @param encryptedInput The encrypted value to subtract (externalEuint32)
    /// @param inputProof The cryptographic proof for the encrypted input
    /// @dev Similar to increment but performs subtraction operation
    function decrement(externalEuint32 encryptedInput, bytes calldata inputProof) external {
        // Convert external encrypted input to internal format
        euint32 inputValue = FHE.fromExternal(encryptedInput, inputProof);

        // Grant permission for the input value to this contract
        FHE.allowThis(inputValue);

        // Perform encrypted subtraction
        _counter = FHE.sub(_counter, inputValue);

        // Grant permissions for the encrypted result
        FHE.allowThis(_counter); // Contract can access
        FHE.allow(_counter, msg.sender); // Caller can access

        emit CounterOperation(msg.sender, "decrement", 0);
    }

    /// @notice Add two encrypted values and return the result
    /// @param encryptedA First encrypted value
    /// @param proofA Proof for first encrypted value
    /// @param encryptedB Second encrypted value
    /// @param proofB Proof for second encrypted value
    /// @return The encrypted sum of both values
    /// @dev This demonstrates basic FHE arithmetic without modifying state
    function addEncryptedValues(
        externalEuint32 encryptedA,
        bytes calldata proofA,
        externalEuint32 encryptedB,
        bytes calldata proofB
    ) external returns (euint32) {
        // Convert both inputs to internal format
        euint32 valueA = FHE.fromExternal(encryptedA, proofA);
        euint32 valueB = FHE.fromExternal(encryptedB, proofB);

        // Grant permissions for input values to this contract
        FHE.allowThis(valueA);
        FHE.allowThis(valueB);

        // Perform encrypted addition
        euint32 result = FHE.add(valueA, valueB);

        // Grant permission for caller to access the result
        FHE.allow(result, msg.sender);

        return result;
    }

    /// @notice Reset the counter to zero
    /// @dev Simple utility function for testing and demonstration
    function resetCounter() external {
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);

        emit CounterOperation(msg.sender, "reset", 0);
    }
}
