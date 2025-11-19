# Batch Lifecycle Implementation

## Overview
The batch lifecycle implementation provides comprehensive tracking and management of fuel batches throughout the supply chain, from creation to final consumption.

## Implemented Functions

### 1. Participant Management

#### `registerParticipant(address, ParticipantRole, string, string)`
- **Purpose**: Register new participants in the supply chain
- **Access**: Contract owner only
- **Parameters**:
  - `participant`: Address of the participant
  - `role`: Role enum (Refinery, Distributor, Terminal, Regulator, Airline)
  - `name`: Organization name
  - `location`: Physical location
- **Events**: `ParticipantRegistered`

#### `deactivateParticipant(address)`
- **Purpose**: Deactivate a participant from the system
- **Access**: Contract owner only
- **Events**: `ParticipantDeactivated`

### 2. Core Batch Functions

#### `registerBatch(string, uint256, string, string)`
- **Purpose**: Create a new batch in the system
- **Access**: Registered participants only
- **Parameters**:
  - `batchType`: Type of fuel (e.g., "Jet Fuel A1", "Diesel")
  - `quantity`: Amount in liters
  - `originLocation`: Where the batch was created
  - `metadataURI`: IPFS link to additional metadata
- **Returns**: `batchId` - Unique identifier for the batch
- **Events**: `BatchRegistered`, `AuditEntry`
- **Features**:
  - Automatic ID generation
  - Ownership tracking initialization
  - Initial audit trail creation
  - Status set to `Created`

#### `updateStatus(uint256, BatchStatus, string, string)`
- **Purpose**: Update the status of an existing batch
- **Access**: Batch owner or regulator only
- **Parameters**:
  - `batchId`: ID of the batch to update
  - `newStatus`: New status enum value
  - `details`: Description of the status change
  - `locationData`: Current location information
- **Events**: `BatchStatusUpdated`, `AuditEntry`
- **Features**:
  - Status transition validation
  - Automatic audit trail updates
  - Special handling for rejection status
  - Location tracking

#### `getBatchDetails(uint256)`
- **Purpose**: Retrieve complete batch information
- **Access**: Public view function
- **Returns**: All batch fields including current status
- **Validation**: Requires batch existence

### 3. Status Transition Rules

The contract enforces a strict status transition workflow:

```
Created → InTransit → Delivered → QualityTested → Approved → Consumed
   ↓         ↓          ↓            ↓
Rejected   Rejected   Rejected    Rejected
```

#### Valid Transitions:
- **Created**: Can transition to `InTransit` or `Rejected`
- **InTransit**: Can transition to `Delivered` or `Rejected`
- **Delivered**: Can transition to `QualityTested` or `Rejected`
- **QualityTested**: Can transition to `Approved` or `Rejected`
- **Approved**: Can transition to `Consumed`
- **Rejected** and **Consumed**: Terminal states (no further transitions)

### 4. Audit Trail System

Every batch operation creates detailed audit entries with:
- **Actor**: Who performed the action
- **Action**: Type of operation (BATCH_CREATED, STATUS_UPDATED, etc.)
- **Details**: Human-readable description
- **Timestamp**: When the action occurred
- **Location Data**: Geographic or facility information

### 5. Access Control

#### Participant Roles:
- **Refinery**: Can create batches, update owned batch status
- **Distributor**: Can update batch status during transport
- **Terminal**: Can update batch status upon delivery
- **Regulator**: Can update any batch status (oversight)
- **Airline**: End consumer, can mark batches as consumed

#### Security Features:
- Role-based function access
- Ownership verification for batch operations
- Participant registration requirement
- Status transition validation

## Events Emitted

### Core Events:
- `BatchRegistered(uint256 batchId, address creator, string batchType, uint256 quantity, uint256 timestamp)`
- `BatchStatusUpdated(uint256 batchId, BatchStatus newStatus, address updatedBy, uint256 timestamp)`
- `AuditEntry(uint256 batchId, address actor, string action, string details, uint256 timestamp)`

### Participant Events:
- `ParticipantRegistered(address participant, ParticipantRole role, string name)`
- `ParticipantDeactivated(address participant)`

## Gas Optimization Features

### Storage Efficiency:
- Packed structs for minimal storage slots
- Event-based audit trail (cheaper than storage arrays)
- Efficient mapping structures

### Batch Operations:
- Single transaction batch registration
- Consolidated status updates
- Minimal external calls

## Usage Examples

### Basic Workflow:
```solidity
// 1. Register participants
supplyChain.registerParticipant(refinery, ParticipantRole.Refinery, "Houston Refinery", "TX");

// 2. Create batch
uint256 batchId = supplyChain.registerBatch("Jet Fuel A1", 10000, "Houston", "ipfs://...");

// 3. Update status through supply chain
supplyChain.updateStatus(batchId, BatchStatus.InTransit, "Loaded for transport", "GPS coordinates");
supplyChain.updateStatus(batchId, BatchStatus.Delivered, "Arrived at terminal", "Terminal location");
supplyChain.updateStatus(batchId, BatchStatus.QualityTested, "Tests completed", "Lab facility");
supplyChain.updateStatus(batchId, BatchStatus.Approved, "Regulatory approval", "FAA office");
```

### Audit Trail Query:
```solidity
AuditTrail[] memory trail = supplyChain.getBatchAuditTrail(batchId);
// Returns complete history of all batch operations
```

## Testing Coverage

The implementation includes comprehensive tests covering:
- ✅ Successful batch registration
- ✅ Input validation and error handling
- ✅ Status transition enforcement
- ✅ Access control verification
- ✅ Audit trail creation
- ✅ Event emission verification
- ✅ Batch query functions
- ✅ Ownership tracking

## Integration Points

### IPFS Integration:
- Metadata URI field for large document storage
- Certificate linking preparation
- Off-chain data referencing

### Frontend Integration:
- Complete event emission for real-time updates
- Query functions for dashboard display
- Role-based permission checking

### External Systems:
- Location data support for GPS tracking
- Timestamp-based operation logging
- Participant organization tracking

This implementation provides a robust foundation for supply chain batch tracking with comprehensive audit capabilities, strict access control, and efficient gas usage patterns.