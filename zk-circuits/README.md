# CarbonVault ZK Circuits

Zero-Knowledge proof circuits for CarbonVault using Circom.

## Overview

This directory contains ZK circuits for verifying carbon offset data without revealing sensitive information. The circuits enable:

- **Private Verification**: Prove carbon offset exists and meets criteria without revealing details
- **Privacy-Preserving Tokenization**: Tokenize assets while maintaining privacy
- **Verifiable Claims**: Verify claims about carbon offsets without exposing underlying data

## Circuit: CarbonOffsetVerifier

The main circuit verifies that:
1. A carbon offset exists (commitment is valid)
2. The offset meets minimum criteria (e.g., minimum CO₂ tons)
3. The offset is within a valid date range
4. The offset has been verified by an authorized party

## Setup

### Prerequisites

```bash
# Install Circom
npm install -g circom

# Install SnarkJS
npm install -g snarkjs

# Install dependencies
npm install
```

### Build Circuits

```bash
# Compile circuit
npm run compile

# Generate proving key
npm run setup

# Generate test proof
npm run test:proof
```

## Circuit Structure

```
zk-circuits/
├── circuits/
│   ├── CarbonOffsetVerifier.circom    # Main verification circuit
│   └── utils/                          # Utility templates
├── scripts/
│   ├── generate-proof.js              # Proof generation script
│   ├── verify-proof.js                # Proof verification script
│   └── test-circuit.js                # Test circuit with sample data
├── contracts/
│   └── Verifier.sol                    # Verifier contract for Mantle
└── test/
    └── test-data.json                  # Sample test data
```

## Usage

### Generate Proof

```bash
node scripts/generate-proof.js
```

### Verify Proof

```bash
node scripts/verify-proof.js
```

### Test with Sample Data

```bash
node scripts/test-circuit.js
```

## Integration with Smart Contracts

The verifier contract can be deployed to Mantle Network and integrated with CarbonVault contracts to verify proofs on-chain.
