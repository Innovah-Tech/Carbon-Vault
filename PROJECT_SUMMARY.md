# CarbonVault Project Summary

## Project Overview

**Project Name:** CarbonVault  
**Track:** RWA / RealFi + ZK & Privacy  
**Network:** Mantle Network

## Project Structure

```
CarbonVault/
├── contracts/              # Smart contracts
│   ├── CarbonVault.sol    # Main RWA tokenization contract
│   ├── CarbonVaultZK.sol  # Extended contract with ZK privacy features
│   └── interfaces/
│       └── IZKVerifier.sol # ZK verifier interface
├── frontend/              # Frontend application (Next.js)
│   ├── package.json
│   └── README.md
├── zk-circuits/           # ZK proof circuits
│   └── README.md
├── scripts/               # Deployment scripts
│   └── deploy.js
├── tests/                 # Test files
│   └── CarbonVault.test.js
├── docs/                  # Documentation
│   └── ARCHITECTURE.md
├── hardhat.config.js      # Hardhat configuration
├── package.json           # Project dependencies
├── .gitignore            # Git ignore rules
└── README.md             # Main README

```

## Key Features

### 1. Smart Contracts

#### CarbonVault.sol
- **RWA Tokenization**: Tokenize real-world assets (carbon credits, commodities, etc.)
- **Asset Management**: Create, verify, and manage assets
- **ERC20 Functionality**: Standard token operations (transfer, burn)
- **ZK Proof Recording**: Placeholder for ZK proof verification

#### CarbonVaultZK.sol
- **Private Asset Creation**: Create private assets using ZK proofs
- **Private Transfers**: Transfer assets privately without revealing identities
- **ZK Verification**: Integration with ZK verifier contracts

#### IZKVerifier.sol
- **ZK Proof Interface**: Standard interface for ZK proof verification
- **Extensible**: Can be implemented by various ZK proof systems

### 2. Frontend Structure

- **Next.js 14**: Modern React framework
- **Web3 Integration**: Wagmi + RainbowKit for wallet connection
- **TypeScript Ready**: Type-safe development

### 3. ZK Circuits

- **Placeholder Structure**: Ready for ZK circuit development
- **Recommended Tools**: Circom, SnarkJS, Hardhat-circom

## Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.20
- **OpenZeppelin**: ^5.0.0
- **Hardhat**: ^2.19.0
- **Ethers.js**: ^6.9.0

### Frontend
- **Next.js**: ^14.0.0
- **React**: ^18.2.0
- **Wagmi**: ^2.0.0
- **RainbowKit**: ^1.0.0
- **Viem**: ^2.0.0

### Network
- **Mantle Network**: Mainnet (Chain ID: 5000)
- **Mantle Testnet**: Testnet (Chain ID: 5001)

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Mantle Network RPC access

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Mantle Network
npm run deploy:mantle
```

## Next Steps

1. **ZK Circuit Development**
   - Implement ZK circuits using Circom
   - Generate proving keys and verification keys
   - Deploy ZK verifier contracts

2. **Frontend Development**
   - Set up Next.js application
   - Implement wallet connection
   - Build tokenization interface
   - Add ZK proof generation UI

3. **Testing**
   - Expand test coverage
   - Add integration tests
   - Test ZK proof generation and verification

4. **Deployment**
   - Deploy to Mantle Testnet
   - Test on testnet
   - Deploy to Mantle Mainnet

## Security Considerations

- Reentrancy protection (ReentrancyGuard)
- Access control (Ownable)
- Input validation
- ZK proof verification
- Asset verification system

## License

MIT

