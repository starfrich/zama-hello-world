// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A simple FHE counter contract
/// @author fhevm-hardhat-template
/// @notice A very basic example contract showing how to work with encrypted data using FHEVM.
/// @dev This contract demonstrates basic FHE operations with proper ACL management and event emission
contract FHECounter is SepoliaConfig {
    euint32 private _count;
    address public owner;

    /// @notice Emitted when the counter is updated
    /// @param user The address that performed the operation
    /// @param operation The type of operation performed ("increment", "decrement", "reset")
    event CountUpdated(address indexed user, string operation);

    constructor() {
        _count = FHE.asEuint32(0);  // Explicitly initialize to encrypted 0
        FHE.allowThis(_count);      // Allow the contract itself to access (permanent, for future ops)
        owner = msg.sender;         // Set contract owner for ACL management
        // Note: Deployer gets access permission by default when they perform first operation
    }

    /// @notice Returns the current count
    /// @return The current encrypted count
    function getCount() external view returns (euint32) {
        return _count;
    }

    /// @notice Check if msg.sender can decrypt the count
    function canUserDecrypt() external view returns (bool) {
        return FHE.isSenderAllowed(_count);
    }

    /// @notice Increments the counter by a specified encrypted value.
    /// @param inputEuint32 the encrypted input value
    /// @param inputProof the input proof
    /// @dev For tutorial simplicity, overflow checks are optional.
    /// @dev In production: consider adding FHE.require(FHE.lt(_count, maxValue), "Overflow") for safety.
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        // Optional overflow protection (uncomment for production):
        // euint32 maxValue = FHE.asEuint32(4294967290); // Leave room for small increments
        // FHE.require(FHE.lt(_count, maxValue), "Counter overflow protection");

        _count = FHE.add(_count, encryptedEuint32);

        // ACL Management: Allow contract and user to access the new encrypted value
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);

        emit CountUpdated(msg.sender, "increment");
    }

    /// @notice Decrements the counter by a specified encrypted value.
    /// @param inputEuint32 the encrypted input value
    /// @param inputProof the input proof
    /// @dev For tutorial simplicity, underflow checks are optional.
    /// @dev In production: consider adding FHE.require(FHE.gte(_count, inputValue), "Underflow") for safety.
    function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        // Optional underflow protection (uncomment for production):
        // FHE.require(FHE.gte(_count, encryptedEuint32), "Counter underflow protection");

        _count = FHE.sub(_count, encryptedEuint32);

        // ACL Management: Allow contract and user to access the new encrypted value
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);

        emit CountUpdated(msg.sender, "decrement");
    }

    /// @notice Resets the counter to encrypted zero
    /// @dev Only allows the current user to access the reset value (not all previous users)
    function reset() external {
        _count = FHE.asEuint32(0);

        // ACL Management: Allow contract and user to access the reset value
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);

        emit CountUpdated(msg.sender, "reset");
    }
}