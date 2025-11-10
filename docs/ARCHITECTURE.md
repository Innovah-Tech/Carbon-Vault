# CarbonVault Architecture

## Overview

CarbonVault is a decentralized platform for tokenizing Real World Assets (RWA) with Zero-Knowledge privacy features on the Mantle Network.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  (Next.js + React + Web3 Integration)                    │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                 Smart Contract Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ CarbonVault  │  │ CarbonVaultZK│  │ ZK Verifier  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Mantle Network (L2)                         │
│  - Low gas fees                                          │
│  - High throughput                                       │
│  - EVM compatible                                         │
└─────────────────────────────────────────────────────────┘
```

## Components

### 1. Smart Contracts

#### CarbonVault.sol
- Main RWA tokenization contract
- Asset management and verification
- ERC20 token functionality

#### CarbonVaultZK.sol
- Extended contract with ZK privacy features
- Private asset creation and transfers
- ZK proof verification integration

#### IZKVerifier.sol
- Interface for ZK proof verification
- Abstracted verifier implementation

### 2. ZK Circuits

- **Asset Commitment Circuit**: Private asset creation
- **Private Transfer Circuit**: Anonymous transfers
- **Verification Circuit**: Private ownership proofs

### 3. Frontend

- Web3 wallet integration
- User interface for tokenization
- ZK proof generation UI
- Asset management dashboard

## Privacy Features

1. **Private Asset Creation**: Assets can be created with ZK proofs
2. **Private Transfers**: Transfers without revealing identities
3. **Private Verification**: Prove ownership without revealing identity

## Security Considerations

- Reentrancy protection
- Access control (Ownable)
- Input validation
- ZK proof verification
- Asset verification system

## Future Enhancements

- Multi-asset support
- Cross-chain bridges
- Advanced ZK circuits
- Governance mechanisms
- Oracle integration for real-world data

