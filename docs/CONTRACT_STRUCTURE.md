# Core Contract Structure - SupplyChain.sol

## Overview
The `SupplyChain.sol` contract is a comprehensive smart contract for tracking supply chain provenance with off-chain artifact storage. It implements multi-signature ownership transfers, role-based access control, and IPFS integration for certificate management.

## Contract Architecture

### 1. Enums
- **BatchStatus**: Tracks the lifecycle status of batches (Created, InTransit, Delivered, QualityTested, Approved, Rejected, Consumed)
- **ParticipantRole**: Defines participant types (None, Refinery, Distributor, Terminal, Regulator, Airline)

### 2. Core Structs

#### Participant
```solidity
struct Participant {
    address participantAddress;
    ParticipantRole role;
    string name;
    string location;
    bool isActive;
    uint256 registeredAt;
}
```

#### Batch
```solidity
struct Batch {
    uint256 id;
    address creator;            // Original creator (refinery)
    address currentOwner;       // Current owner
    address pendingOwner;       // Pending transfer recipient
    BatchStatus status;
    string batchType;           // e.g., "Jet Fuel A1", "Diesel"
    uint256 quantity;           // Amount in liters
    string originLocation;      // Where batch was created
    string metadataURI;         // IPFS link to additional metadata
    uint256 createdAt;
    uint256 updatedAt;
    bool exists;
}
```

#### TransferRequest
```solidity
struct TransferRequest {
    uint256 batchId;
    address from;
    address to;
    string reason;              // Reason for transfer
    string transportDetails;    // Transport method, route, etc.
    uint256 requestedAt;
    bool isActive;              // Whether request is still pending
}
```

#### Certificate
```solidity
struct Certificate {
    uint256 batchId;
    string certificateType;     // e.g., "Quality", "Safety", "Environmental"
    string ipfsHash;            // IPFS hash of the certificate document
    address issuedBy;           // Who issued the certificate
    uint256 issuedAt;
    bool isValid;               // Whether certificate is still valid
}
```

#### AuditTrail
```solidity
struct AuditTrail {
    uint256 batchId;
    address actor;              // Who performed the action
    string action;              // What action was performed
    string details;             // Additional details
    uint256 timestamp;
    string locationData;        // GPS coordinates or location info
}
```

### 3. State Variables

#### Core Mappings
- `mapping(uint256 => Batch) public batches` - Main batch storage
- `mapping(address => Participant) public participants` - Participant registry
- `mapping(uint256 => TransferRequest) public transferRequests` - Transfer requests

#### Certificate & Audit Tracking
- `mapping(uint256 => Certificate[]) public batchCertificates` - Certificates per batch
- `mapping(string => bool) public usedCertificateHashes` - Prevent duplicate certificates
- `mapping(uint256 => AuditTrail[]) public batchAuditTrail` - Complete audit history

#### Ownership Tracking
- `mapping(uint256 => address[]) public ownershipHistory` - Historical ownership
- `mapping(address => uint256[]) public ownerBatches` - Batches per owner
- `mapping(uint256 => uint256) public activePendingRequests` - Active transfer requests

#### Counters
- `uint256 private _nextBatchId` - Auto-incrementing batch IDs
- `uint256 private _nextRequestId` - Auto-incrementing request IDs

### 4. Events
- **Participant Management**: `ParticipantRegistered`, `ParticipantDeactivated`
- **Batch Lifecycle**: `BatchRegistered`, `BatchStatusUpdated`
- **Transfer Management**: `TransferRequested`, `TransferApproved`, `TransferRejected`, `OwnershipTransferred`
- **Certificate Management**: `CertificateLinked`, `CertificateRevoked`
- **Audit Trail**: `AuditEntry`

### 5. Access Control Modifiers
- `onlyContractOwner()` - Contract administration
- `onlyRegisteredParticipant()` - Requires active participant registration
- `onlyRole(ParticipantRole)` - Role-based access control
- `batchExists(uint256)` - Validates batch existence
- `onlyBatchOwner(uint256)` - Batch ownership verification
- `onlyBatchOwnerOrRegulator(uint256)` - Owner or regulator access
- `validTransferRequest(uint256)` - Transfer request validation

### 6. View Functions
- `getTotalBatches()` - Total number of batches
- `getBatchesByOwner(address)` - Batches owned by address
- `getOwnershipHistory(uint256)` - Complete ownership history
- `getBatchCertificates(uint256)` - All certificates for a batch
- `getBatchAuditTrail(uint256)` - Complete audit trail
- `getActivePendingRequest(uint256)` - Current pending transfer
- `isValidParticipant(address)` - Participant validation

## Design Features

### Multi-Signature Transfer Pattern
- Two-step transfer process: request → accept
- Prevents unauthorized ownership changes
- Maintains clear audit trail

### Role-Based Access Control
- Different permissions for different participant types
- Regulators have oversight capabilities
- Flexible role assignment system

### Off-Chain Integration Ready
- IPFS hash storage for certificates
- Metadata URI support for large documents
- Event emission for external system integration

### Comprehensive Audit Trail
- Every action is logged with timestamp
- Actor identification for all operations
- Location data support for physical tracking

### Certificate Management
- Multiple certificates per batch
- Certificate type categorization
- Validity tracking and revocation support

## Gas Optimization Considerations
- Efficient storage patterns using mappings
- Event-based audit trail (cheaper than storage)
- Minimal on-chain data storage
- Batch operations support for multiple updates

This contract structure provides a solid foundation for the supply chain provenance system with room for extension and customization based on specific business requirements.