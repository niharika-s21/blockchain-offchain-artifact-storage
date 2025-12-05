# Blockchain On-Chain Artifact Storage

## 📘 Project Overview
This project presents JetChain, a permissioned, Ethereum-compatible blockchain system designed to track jet fuel batches from refineries to distributors, airport terminals, and airlines. The system models each batch as an on-chain asset with a defined lifecycle and enforces role-based access control for all participants. To ensure secure and auditable custody transfer, JetChain implements a two-step, multi-party approval workflow in which both the current owner and the receiving party must confirm the transfer before ownership changes.

## Contents
- `contracts/` - Draft Solidity contracts:
  - `BatchProvenance.sol` - main draft contract
  - `interfaces/` - solidity interfaces / signatures
- `README.md` - this file
- `docs/` - design notes & diagrams
- `frontend/` - skeleton React app (to be filled)
- `scripts/` - deploy & test scripts (Hardhat/Foundry/Truffle templates)
- `LICENSE` - project license

## 📦 Quick Setup

```bash
# Navigate to project directory
cd blockchain-offchain-artifact-storage

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run comprehensive test suite (44 tests)
npx hardhat test

# Run tests with gas reporting
REPORT_GAS=true npx hardhat test

# Start local Hardhat node (separate terminal)
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy-and-demo.js --network localhost
```

## 🖥️ Frontend Setup (NEW!)

The project now includes a complete React.js frontend with TailwindCSS!

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Update contract address in src/context/BlockchainContext.js
# (Use address from deployment above)

# Start development server
npm start
```



Run tests with:
```bash
npx hardhat test                    # Run all tests
npx hardhat test --grep "Transfer"  # Run transfer tests only
REPORT_GAS=true npx hardhat test    # Include gas reporting
```
