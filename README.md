# 🌍 Carbon Vault

> Blockchain-based carbon credit trading and verification platform

[![Network](https://img.shields.io/badge/Network-Mantle%20Sepolia-blue)](https://sepolia.mantle.xyz)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com)

**Carbon Vault** is a decentralized platform for tokenizing, trading, and verifying carbon credits using blockchain technology, zero-knowledge proofs, and real-world data integration.

---

## ✨ Features

### **Core Functionality**
- 🪙 **CVT Token** - ERC20 carbon credit tokens with ZK proof minting
- 💰 **Staking** - Stake CVT tokens to earn yield rewards
- 🏪 **Marketplace** - P2P trading platform for carbon credits
- ✅ **Validators** - Proof verification and reward system
- 📊 **Reports** - ESG compliance and transaction reporting

### **Technical Features**
- 🔐 **Zero-Knowledge Proofs** - Private carbon offset verification
- 📡 **Data Pipeline** - IoT sensors and satellite data integration
- 🎨 **Modern UI** - React + TypeScript + TailwindCSS
- ⛓️ **Smart Contracts** - Solidity on Mantle Network
- 🔄 **Real-time Updates** - Live blockchain data

---

## 🚀 Quick Start

### **1. Prerequisites**

```bash
Node.js 18+
npm or yarn
MetaMask wallet
Mantle Sepolia testnet MNT
```

### **2. Installation**

```bash
# Clone repository
git clone <repository-url>
cd "Carbon Vault"

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

### **3. Configuration**

Create `.env` file in project root:

```env
PRIVATE_KEY=your_private_key_without_0x
MANTLE_SEPOLIA_RPC_URL=https://rpc.sepolia.mantle.xyz
```

### **4. Run Frontend**

```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

### **5. Mint CVT Tokens**

```bash
# Mint 100 CVT
npx hardhat run scripts/mint-simple.js --network mantleSepolia

# Mint 500 CVT
npx hardhat run scripts/mint-500.js --network mantleSepolia
```

---

## 📁 Project Structure

```
Carbon Vault/
├── contracts/              # Solidity smart contracts
│   ├── CVTMinting.sol     # ERC20 token with ZK minting
│   ├── CVTStaking.sol     # Staking and yield
│   ├── CVTMarketplace.sol # P2P trading
│   ├── ValidatorRewards.sol # Validator incentives
│   └── verifiers/         # ZK proof verifiers
│
├── frontend/              # React application
│   ├── src/
│   │   ├── pages/        # Main pages
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # Business logic
│   │   └── lib/          # Utilities & contracts
│   └── public/
│       └── logo.png      # Carbon Vault logo
│
├── data-pipeline/         # Python data processing
│   ├── pipeline/
│   │   ├── sources/      # IoT & satellite data
│   │   ├── processors/   # Data normalization
│   │   └── storage/      # Database integration
│   └── docker-compose.yml
│
├── zk-circuits/           # Zero-knowledge circuits
│   ├── circuits/
│   │   └── CarbonOffsetVerifier.circom
│   └── scripts/          # Proof generation
│
└── scripts/               # Deployment & utilities
    ├── deploy-cvt-system.js
    ├── mint-simple.js
    └── check-contract.js
```

---

## 🔧 Smart Contracts

### **Deployed on Mantle Sepolia**

| Contract | Address | Purpose |
|----------|---------|---------|
| **CVTMinting** | `0xc5645f895a48c8A572368AaFeaAb2D42d1203819` | ERC20 token minting |
| **CVTStaking** | `0x80bBdD4D4606DF5Ba6561e4B9C4a59B49061f713` | Staking & rewards |
| **CVTMarketplace** | `0x290C258b604a3Cda5014B004ffe9c92Ab22D0F1c` | P2P trading |
| **ValidatorRewards** | `0x647F8C626a90b5b8D4A69723bB672C759DD8A027` | Validator incentives |
| **CarbonOffsetVerifier** | `0xA5eE5D0567122EeF5FEfC35224e4D0d5C5A3a521` | ZK proof verification |

### **Key Functions**

```solidity
// Mint CVT with ZK proof
function mintCVT(
    address to,
    uint256 amount,
    bytes calldata proof,
    uint256[] calldata publicInputs,
    bytes32 commitment,
    string memory projectId,
    address validator
) external

// Stake CVT tokens
function stake(uint256 amount) external

// Create marketplace listing
function listCVT(
    uint256 amount,
    uint256 price,
    uint256 expiresIn
) external returns (uint256)

// Submit validator proof
function submitProof(address validator) external
```

---

## 💻 Development

### **Compile Contracts**

```bash
npx hardhat compile
```

### **Run Tests**

```bash
npx hardhat test
```

### **Deploy Contracts**

```bash
# Deploy to Mantle Sepolia
npx hardhat run scripts/deploy-cvt-system.js --network mantleSepolia

# Point marketplace at a stablecoin (defaults to CVT token if none supplied)
npx hardhat run scripts/update-marketplace-stablecoin.js --network mantleSepolia
# To accept native MNT payments, pass STABLECOIN_ADDRESS=0x0000000000000000000000000000000000000000

# Deploy to Mantle Mainnet
npx hardhat run scripts/deploy-cvt-system.js --network mantle
```

### **Verify Contracts**

```bash
npx hardhat verify --network mantleSepolia <CONTRACT_ADDRESS>
```

---

## 🎨 Frontend

### **Technology Stack**

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + shadcn/ui
- **Web3**: wagmi + viem
- **State**: React hooks + localStorage
- **Routing**: React Router

### **Pages**

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Portfolio overview & staking |
| **Marketplace** | `/marketplace` | Buy/sell carbon credits |
| **Validators** | `/validators` | Submit proofs & earn rewards |
| **Reports** | `/reports` | Generate compliance reports |
| **Settings** | `/settings` | User preferences |

### **Run Development Server**

```bash
cd frontend
npm run dev
```

### **Build for Production**

```bash
cd frontend
npm run build
npm run preview
```

---

## 📊 Data Pipeline

### **Purpose**
Process carbon offset data from IoT sensors and satellite imagery for verification.

### **Data Sources**

1. **IoT Sensors** - Real-time CO2 measurements
2. **Satellite Imagery** - Vegetation indices (NDVI)
3. **Manual Inputs** - Project documentation

### **Run Pipeline**

```bash
cd data-pipeline

# With Docker
docker-compose up -d

# Manually
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run_pipeline.py
```

### **Auto-Mint from Pipeline Output**
# Faucet (Test CVT)

Users can grab 5 CVT per hour directly from the dashboard faucet button. The feature calls `CVTMinting.claimFaucet()` behind the scenes (default amount and cooldown can be tuned by the contract owner). This helps new wallets try staking/marketplace flows without running the pipeline.

After running the pipeline you can mint CVT directly from the generated measurements:

```bash
# Run pipeline + mint newest 2 records (dry-run first)
HARDHAT_NETWORK=mantleSepolia node scripts/mint-from-pipeline.js --run-pipeline --limit 2 --dry-run

# Execute for real
HARDHAT_NETWORK=mantleSepolia node scripts/mint-from-pipeline.js --run-pipeline --limit 2
```

Options include `--min-co2`, `--file <custom_json>`, `--recipient`, `--validator`, and `--dry-run` for previews. The script reuses the proof generation helpers from `mint-cvt.js`, so each qualifying pipeline record becomes a mint transaction with matching project IDs and CO₂ amounts.

### **Configuration**

Edit `data-pipeline/config.py`:

```python
DATABASE_URL = "postgresql://user:pass@localhost/carbonvault"
IOT_API_KEY = "your_iot_api_key"
SATELLITE_API_KEY = "your_satellite_api_key"
```

---

## 🔐 Zero-Knowledge Proofs

### **Purpose**
Verify carbon offset claims without revealing sensitive data.

### **Circuit**

`zk-circuits/circuits/CarbonOffsetVerifier.circom`

```circom
// Verifies:
// - Emission data validity
// - Project authenticity
// - Timestamp constraints
// - Verifier signature
```

### **Generate Proof**

```bash
cd zk-circuits
npm install
npm run setup
node scripts/generate-proof.js
```

### **Verify Proof**

```bash
node scripts/verify-proof.js
```

---

## 🌐 Network Information

### **Mantle Sepolia Testnet**

- **Chain ID**: 5003
- **RPC URL**: https://rpc.sepolia.mantle.xyz
- **Explorer**: https://explorer.sepolia.mantle.xyz
- **Faucet**: https://faucet.sepolia.mantle.xyz

### **Mantle Mainnet**

- **Chain ID**: 5000
- **RPC URL**: https://rpc.mantle.xyz
- **Explorer**: https://explorer.mantle.xyz

---

## 📖 Usage Examples

### **Mint CVT Tokens**

```bash
# Mint 100 CVT to your wallet
npx hardhat run scripts/mint-simple.js --network mantleSepolia
```

### **Check Balance**

```bash
npx hardhat run scripts/check-contract.js --network mantleSepolia
```

### **Stake CVT**

1. Open frontend: http://localhost:5173
2. Connect wallet
3. Go to Dashboard
4. Click "Stake More"
5. Enter amount and confirm

### **List on Marketplace**

1. Go to Marketplace page
2. Click "Create Listing"
3. Enter amount, price, expiration
4. Approve CVT (transaction 1/2)
5. Create listing (transaction 2/2)

### **Generate Report**

1. Go to Reports page
2. Choose report type (ESG/ZK/Transaction)
3. Click "Generate Report"
4. Download as CSV or JSON

---

## 🧪 Testing

### **Smart Contract Tests**

```bash
npx hardhat test
npx hardhat coverage
```

### **Frontend Tests**

```bash
cd frontend
npm run test
npm run test:coverage
```

### **Integration Tests**

```bash
# Start local node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy-cvt-system.js --network localhost

# Run frontend
cd frontend && npm run dev
```

---

## 🔗 Useful Links

### **Documentation**
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Data Pipeline](data-pipeline/README.md)
- [ZK Circuits](zk-circuits/README.md)

### **Network**
- [Mantle Docs](https://docs.mantle.xyz)
- [Mantle Faucet](https://faucet.sepolia.mantle.xyz)
- [Block Explorer](https://explorer.sepolia.mantle.xyz)

### **Tools**
- [Hardhat](https://hardhat.org)
- [wagmi](https://wagmi.sh)
- [shadcn/ui](https://ui.shadcn.com)
- [Circom](https://docs.circom.io)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Roadmap

- [x] Smart contract deployment
- [x] Frontend dashboard
- [x] CVT token minting
- [x] Staking functionality
- [x] Marketplace trading
- [x] Validator rewards
- [x] Report generation
- [ ] Mobile app (React Native)
- [ ] Cross-chain bridge
- [ ] DAO governance
- [ ] NFT certificates
- [ ] Advanced analytics

---


## 🙏 Acknowledgments

- Built on [Mantle Network](https://mantle.xyz)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- ZK circuits powered by [Circom](https://docs.circom.io)
- Web3 integration with [wagmi](https://wagmi.sh)

---

<div align="center">

**Made with 💚 for a sustainable future**

[Website](https://carbonvault.io) • [Documentation](docs/) • [Twitter](https://twitter.com/CarbonVault)

</div>
