# Supply Chain Frontend

React-based frontend dashboard for the Supply Chain Provenance System.

## Features

✅ **Role-Based Dashboard** - Custom views for each participant type  
✅ **Batch Management** - Create, view, and track fuel batches  
✅ **Multi-Sig Transfers** - Request and accept ownership transfers  
✅ **Audit Trail** - Complete history of all operations  
✅ **MetaMask Integration** - Wallet connection and transaction signing  
✅ **TailwindCSS Styling** - Modern, responsive UI  

## Tech Stack

- **React** 18.2.0
- **React Router** 6.20.0
- **Ethers.js** 6.9.0
- **TailwindCSS** 3.3.5
- **React Scripts** 5.0.1

## Prerequisites

- Node.js >= 18
- npm or yarn
- MetaMask browser extension
- Deployed SupplyChain smart contract

## Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Update contract address (see Configuration section)

# Start development server
npm start
```

The app will open at `http://localhost:3000`

## Configuration

### Update Contract Address

1. Deploy the smart contract (see main README)
2. Copy the deployed contract address
3. Update the address in `src/context/BlockchainContext.js`:

```javascript
const CONTRACT_ADDRESS = 'YOUR_DEPLOYED_CONTRACT_ADDRESS';
```

### Network Configuration

The app is configured for Hardhat local network by default. To use a testnet:

1. Update `CONTRACT_ADDRESS` in `BlockchainContext.js`
2. Connect MetaMask to the appropriate network
3. Ensure you have test funds

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Layout.js          # Main layout with navigation
│   ├── pages/
│   │   ├── Dashboard.js       # Role-based dashboard
│   │   ├── Batches.js         # Batch listing
│   │   ├── CreateBatch.js     # Create new batch
│   │   ├── BatchDetails.js    # Detailed batch view
│   │   ├── Transfers.js       # Transfer management
│   │   └── AuditTrail.js      # Audit history
│   ├── context/
│   │   └── BlockchainContext.js  # Web3 context provider
│   ├── App.js                 # Main app component
│   ├── index.js               # Entry point
│   └── index.css              # Tailwind styles
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## Features by Role

### Refinery (Role 1)
- Create new batches
- View owned batches
- Initiate transfers
- Update batch status

### Distributor (Role 2)
- View batches
- Manage transfers
- Update transport status

### Terminal (Role 3)
- Receive batches
- Quality testing
- View inventory

### Regulator (Role 4)
- View all batches
- Audit trail access
- Approve/reject batches
- Oversight capabilities

### Airline (Role 5)
- View inventory
- Track consumption
- View history

## Usage

### Connect Wallet

1. Click "Connect Wallet" button
2. Approve MetaMask connection
3. Ensure your account is registered as a participant

### Create a Batch (Refinery only)

1. Navigate to Batches → Create New Batch
2. Fill in batch details:
   - Batch Type (e.g., Jet Fuel A1)
   - Quantity (in liters)
   - Origin Location
   - Metadata URI (optional)
3. Click "Create Batch"
4. Confirm transaction in MetaMask

### Transfer Ownership

1. Go to Transfers page
2. Enter:
   - Batch ID
   - New Owner Address
   - Transfer Reason
   - Transport Details
3. Click "Request Transfer"
4. New owner must accept in their dashboard

### View Audit Trail

1. Navigate to Audit Trail page
2. View all system operations
3. Filter by batch ID if needed
4. Export for compliance (coming soon)

## Development

```bash
# Run development server
npm start

# Build for production
npm build

# Run tests
npm test
```

## Styling

The app uses TailwindCSS with custom utility classes:

- `.btn-primary` - Primary action buttons
- `.btn-secondary` - Secondary buttons
- `.btn-success` - Success buttons
- `.btn-danger` - Danger buttons
- `.card` - Card containers
- `.input-field` - Form inputs
- `.badge` - Status badges
- `.badge-created`, `.badge-intransit`, etc. - Status-specific badges

## Common Issues

### MetaMask Not Detected
- Install MetaMask browser extension
- Refresh the page

### Transaction Failed
- Check if you're registered as a participant
- Ensure sufficient gas funds
- Verify you have the required role permissions

### Contract Not Found
- Verify contract address is correct
- Check network (local/testnet)
- Ensure contract is deployed

### Participant Not Registered
- Contact administrator to register your address
- Provide your wallet address and desired role

## API Reference

### Blockchain Context Hook

```javascript
import { useBlockchain } from './context/BlockchainContext';

const {
  account,              // Connected wallet address
  provider,             // Ethers provider
  signer,               // Ethers signer
  contract,             // SupplyChain contract instance
  participant,          // Current participant info
  loading,              // Connection loading state
  error,                // Connection error
  connectWallet,        // Connect MetaMask
  disconnectWallet,     // Disconnect wallet
  formatAddress,        // Format address (0x1234...5678)
  formatDate,           // Format timestamp
  getStatusBadgeClass,  // Get status badge class
  ROLES,                // Role name mapping
  STATUS,               // Status name mapping
  CONTRACT_ADDRESS      // Contract address
} = useBlockchain();
```

## Environment Variables

Create a `.env` file (optional):

```env
REACT_APP_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_NETWORK_URL=http://localhost:8545
REACT_APP_CHAIN_ID=31337
```

## Browser Support

- Chrome (recommended with MetaMask)
- Firefox (with MetaMask)
- Brave (built-in wallet support)
- Edge (with MetaMask)

## Security Notes

- Never commit private keys or seed phrases
- Always verify contract addresses
- Test on testnet before mainnet
- Verify transactions in MetaMask before signing

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

MIT License - See LICENSE file

## Support

For issues or questions:
- Check main project README
- Review smart contract documentation
- Test on local network first

## Roadmap

- [ ] IPFS integration for certificates
- [ ] Batch QR code generation
- [ ] Export audit trail to PDF
- [ ] Real-time event notifications
- [ ] Mobile responsive enhancements
- [ ] Multi-language support
- [ ] Advanced filtering and search
- [ ] Dashboard analytics and charts

---

**Version**: 1.0.0  
**Last Updated**: November 2025

