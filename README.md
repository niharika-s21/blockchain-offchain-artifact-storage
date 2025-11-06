# Blockchain Off-Chain Artifact Storage

## 📘 Project Overview
This project implements a **hybrid blockchain framework** that enables secure, verifiable storage of supply-chain artifacts without placing large or private data directly on-chain.  
It combines **on-chain metadata and integrity verification** with **off-chain artifact storage** (e.g., IPFS), maintaining transparency, provenance, and data integrity across distributed participants.

---

## ⚙️ Features
- Register and track batches on blockchain
- Record ownership and custody transfers
- Link off-chain certificates (IPFS CIDs) to on-chain records
- Emit events for transparent audit trails
- Minimal on-chain storage, maximizing scalability and privacy
- Extensible design for role-based access and multi-sig approvals

---

## 🧠 Concept
Modern supply chains rely on artifacts such as laboratory reports, quality certificates, and telemetry data.  
Storing these directly on-chain is costly and poses privacy risks.  
This system links these documents **off-chain** (via IPFS) while storing only their **content hash and reference** on the blockchain, ensuring:
- **Integrity** — verification via immutable on-chain hash
- **Transparency** — traceable events for each batch
- **Efficiency** — large data remains off-chain

## Contents
- `contracts/` - Draft Solidity contracts:
  - `BatchProvenance.sol` - main draft contract
  - `interfaces/` - solidity interfaces / signatures
- `README.md` - this file
- `docs/` - design notes & diagrams (optional)
- `frontend/` - skeleton React app (to be filled)
- `scripts/` - deploy & test scripts (Hardhat/Foundry/Truffle templates)
- `LICENSE` - project license (recommend MIT)

## Dependencies / setup (draft)
- Node.js >= 18
- npm or yarn
- Hardhat (recommended) or Truffle
- Solidity ^0.8.19
- IPFS node / Pinning service (e.g., Pinata or Infura IPFS) for storing artifacts
- MetaMask for frontend demo
- (Optional) Polygon / Sepolia testnet account and some test ETH/MATIC

Quick local setup:
```bash
# clone repo
git clone [https://github.com/<your-org>/offchain-artifact-storage](https://github.com/niharika-s21/blockchain-offchain-artifact-storage)
cd offchain-artifact-storage

# install dependencies
npm install

# start local hardhat node
npx hardhat node

# run tests
npx hardhat test
