# CarbonVault

**Track:** RWA / RealFi + ZK & Privacy  
**Network:** Mantle Network

## Overview

CarbonVault is a decentralized platform for tokenizing Real World Assets (RWA) with built-in Zero-Knowledge (ZK) privacy features. The platform enables secure, private, and verifiable tokenization of carbon credits and other real-world assets on the Mantle Network.

## Features

- **RWA Tokenization**: Tokenize real-world assets (carbon credits, commodities, etc.)
- **ZK Privacy**: Zero-knowledge proofs for private transactions and verifications
- **Off-Chain Data Pipeline**: Collect and process real-world carbon data from satellite imagery and IoT sensors
- **RealFi Integration**: Bridge between traditional finance and DeFi
- **Mantle Network**: Built on Mantle for scalability and low fees

## Project Structure

```
CarbonVault/
├── contracts/          # Smart contracts
├── data-pipeline/      # Off-chain data collection and processing
├── frontend/          # Frontend application
├── zk-circuits/       # ZK proof circuits
├── scripts/           # Deployment and utility scripts
├── tests/             # Test files
└── docs/              # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Python 3.8+ (for data pipeline)
- Hardhat or Foundry
- Mantle Network RPC access

### Installation

#### Smart Contracts

```bash
npm install
```

#### Data Pipeline

```bash
cd data-pipeline
pip install -r requirements.txt
cp .env.example .env
# Add your API keys to .env
```

### Development

#### Smart Contracts

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to Mantle Network
npm run deploy:mantle
```

#### Data Pipeline

```bash
cd data-pipeline

# Run the pipeline
python -m pipeline.main

# Or with options
python -m pipeline.main --days 30 --lat 37.7749 --lon -122.4194
```

See [data-pipeline/README.md](data-pipeline/README.md) for more details.

## License

MIT

