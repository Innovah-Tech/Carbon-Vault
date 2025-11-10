// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IZKVerifier
 * @dev Interface for Zero-Knowledge proof verification
 * This interface will be implemented by ZK verifier contracts
 */
interface IZKVerifier {
    /**
     * @dev Verify a ZK proof
     * @param proof The ZK proof bytes
     * @param publicInputs Public inputs for the proof
     * @return isValid Whether the proof is valid
     */
    function verifyProof(
        bytes calldata proof,
        uint256[] calldata publicInputs
    ) external view returns (bool isValid);

    /**
     * @dev Verify a ZK proof with additional context
     * @param proof The ZK proof bytes
     * @param publicInputs Public inputs for the proof
     * @param context Additional context data
     * @return isValid Whether the proof is valid
     */
    function verifyProofWithContext(
        bytes calldata proof,
        uint256[] calldata publicInputs,
        bytes calldata context
    ) external view returns (bool isValid);
}

