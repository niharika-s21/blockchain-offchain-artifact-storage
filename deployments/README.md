# Deployments Directory

This directory contains deployment information for various networks.

## Files Generated After Deployment

After running the testnet deployment script, you'll find:

### Network-Specific Deployment Files
- `sepolia-deployment.json` - Sepolia testnet deployment details
- `mumbai-deployment.json` - Mumbai testnet deployment details (if using Polygon)

### Contract ABI
- `SupplyChain-ABI.json` - Contract ABI for frontend integration

## Example: sepolia-deployment.json

```json
{
  "network": "sepolia",
  "chainId": "11155111",
  "contractAddress": "0x1234567890abcdef...",
  "deployer": "0xabcdef1234567890...",
  "transactionHash": "0x9876543210fedcba...",
  "blockNumber": 1234567,
  "timestamp": "2025-11-29T12:34:56.789Z",
  "gasUsed": "2500000"
}
```

## Usage

These files are automatically created by the deployment script and used by:
- Frontend to connect to the correct contract
- Verification scripts
- Participant registration scripts
- Testing and debugging

## Important Notes

⚠️ **Do not manually edit these files!**  
They are automatically generated during deployment.

✅ **These files can be committed to git**  
They contain public information (contract addresses, transaction hashes)

🔒 **Never commit:**
- `.env` files
- Private keys
- API keys

## Deployment Commands

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy-testnet.js --network sepolia

# Deploy to Mumbai
npx hardhat run scripts/deploy-testnet.js --network mumbai

# View deployment info
cat deployments/sepolia-deployment.json
```

## Network Information

### Sepolia (Ethereum Testnet)
- Chain ID: 11155111
- Explorer: https://sepolia.etherscan.io

### Mumbai (Polygon Testnet)
- Chain ID: 80001
- Explorer: https://mumbai.polygonscan.com

