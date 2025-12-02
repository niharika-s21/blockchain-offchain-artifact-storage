// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Strings library removed to reduce contract size

contract SupplyChain {
    
    // ==================== ENUMS ====================
    
    enum BatchStatus {
        Created,        // Initial batch creation
        InTransit,      // Batch is being transported
        Delivered,      // Batch has been delivered
        QualityTested,  // Quality certificates uploaded
        Approved,       // Batch approved by regulator
        Rejected,       // Batch rejected
        Consumed        // Final consumption/usage
    }
    
    enum ParticipantRole {
        None,
        Refinery,       // Creates and produces batches
        Distributor,    // Handles transportation
        Terminal,       // Receives and stores batches
        Regulator,      // Oversees quality and compliance
        Airline         // End consumer
    }
    
    struct Participant {
        address participantAddress;
        ParticipantRole role;
        string name;
        string location;
        bool isActive;
        uint256 registeredAt;
    }
    
    struct Batch {
        uint256 id;
        address creator;            // Original creator (refinery)
        address currentOwner;       // Current owner
        address pendingOwner;       // Pending transfer recipient
        BatchStatus status;
        string batchType;           // e.g., "Jet Fuel A1", "Diesel"
        uint256 quantity;           // Amount in liters or appropriate unit
        string originLocation;      // Where batch was created
        string metadataURI;         // IPFS link to additional metadata
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }
    
    struct TransferRequest {
        uint256 batchId;
        address from;
        address to;
        string reason;              // Reason for transfer
        string transportDetails;    // Transport method, route, etc.
        uint256 requestedAt;
        bool isActive;              // Whether request is still pending
    }
    
    // ==================== CERTIFICATE FEATURE (COMMENTED OUT - NOT IMPLEMENTED IN FRONTEND) ====================
    // struct Certificate {
    //     uint256 batchId;
    //     string certificateType;     // e.g., "Quality", "Safety", "Environmental"
    //     string ipfsHash;            // IPFS hash of the certificate document
    //     address issuedBy;           // Who issued the certificate
    //     uint256 issuedAt;
    //     bool isValid;               // Whether certificate is still valid
    // }
    
    struct AuditTrail {
        uint256 batchId;
        address actor;              // Who performed the action
        bytes32 action;             // What action was performed (gas-optimized)
        bytes32 details;            // Additional details (gas-optimized)
        uint256 timestamp;
        bytes32 locationData;       // Location info (gas-optimized)
    }
    
    // ==================== STATE VARIABLES ====================
    
    // Core mappings
    mapping(uint256 => Batch) public batches;
    mapping(address => Participant) public participants;
    mapping(uint256 => TransferRequest) public transferRequests;
    
    // ==================== CERTIFICATE TRACKING (COMMENTED OUT - NOT IMPLEMENTED) ====================
    // mapping(uint256 => Certificate[]) public batchCertificates;
    // mapping(string => bool) public usedCertificateHashes;
    
    // Audit trail
    mapping(uint256 => AuditTrail[]) public batchAuditTrail;
    
    // Ownership and transfer tracking
    mapping(uint256 => address[]) public ownershipHistory;
    // ownerBatches mapping removed to save gas - query getBatchesByOwner instead
    
    // Request management
    mapping(uint256 => uint256) public activePendingRequests; // batchId => requestId
    
    // Counters
    uint256 private _nextBatchId = 1;
    uint256 private _nextRequestId = 1;
    
    // Contract owner for admin functions
    address public contractOwner;
    
    // ==================== EVENTS ====================
    
    // Participant events
    event ParticipantRegistered(address indexed participant, ParticipantRole role, string name);
    event ParticipantDeactivated(address indexed participant);
    
    // Batch lifecycle events
    event BatchRegistered(
        uint256 indexed batchId, 
        address indexed creator, 
        string batchType, 
        uint256 quantity,
        uint256 timestamp
    );
    
    event BatchStatusUpdated(
        uint256 indexed batchId, 
        BatchStatus indexed newStatus, 
        address indexed updatedBy,
        uint256 timestamp
    );
    
    // Transfer events
    event TransferRequested(
        uint256 indexed requestId,
        uint256 indexed batchId, 
        address indexed from, 
        address to,
        string reason,
        uint256 timestamp
    );
    
    event TransferApproved(
        uint256 indexed requestId,
        uint256 indexed batchId, 
        address indexed from, 
        address to,
        uint256 timestamp
    );
    
    event TransferRejected(
        uint256 indexed requestId,
        uint256 indexed batchId, 
        address indexed from, 
        address to,
        string reason,
        uint256 timestamp
    );
    
    event OwnershipTransferred(
        uint256 indexed batchId, 
        address indexed previousOwner, 
        address indexed newOwner,
        uint256 timestamp
    );
    
    // ==================== CERTIFICATE EVENTS (COMMENTED OUT - NOT IMPLEMENTED) ====================
    // event CertificateLinked(
    //     uint256 indexed batchId, 
    //     string certificateType,
    //     string indexed ipfsHash, 
    //     address indexed issuedBy,
    //     uint256 timestamp
    // );
    // 
    // event CertificateRevoked(
    //     uint256 indexed batchId, 
    //     string ipfsHash, 
    //     address indexed revokedBy,
    //     uint256 timestamp
    // );
    
    // Audit events
    event AuditEntry(
        uint256 indexed batchId,
        address indexed actor,
        bytes32 action,
        bytes32 details,
        uint256 timestamp
    );
    
    // ==================== MODIFIERS ====================
    
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Owner only");
        _;
    }
    
    modifier onlyRegisteredParticipant() {
        require(participants[msg.sender].isActive, "Not registered");
        _;
    }
    
    modifier onlyRole(ParticipantRole requiredRole) {
        require(participants[msg.sender].role == requiredRole, "Invalid role");
        _;
    }
    
    modifier batchExists(uint256 batchId) {
        require(batches[batchId].exists, "No batch");
        _;
    }
    
    modifier onlyBatchOwner(uint256 batchId) {
        require(batches[batchId].currentOwner == msg.sender, "Not owner");
        _;
    }
    
    modifier onlyBatchOwnerOrRegulator(uint256 batchId) {
        require(
            batches[batchId].currentOwner == msg.sender || 
            participants[msg.sender].role == ParticipantRole.Regulator,
            "No access"
        );
        _;
    }
    
    modifier validTransferRequest(uint256 requestId) {
        require(transferRequests[requestId].isActive, "No request");
        require(transferRequests[requestId].to == msg.sender, "No auth");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        contractOwner = msg.sender;
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    function getTotalBatches() external view returns (uint256) {
        return _nextBatchId - 1;
    }
    
    // getBatchesByOwner removed to reduce contract size - query from frontend by looping
    // function getBatchesByOwner(address owner) external view returns (uint256[] memory) {
    //     return ownerBatches[owner];
    // }
    
    function getOwnershipHistory(uint256 batchId) external view batchExists(batchId) returns (address[] memory) {
        return ownershipHistory[batchId];
    }
    
    // ==================== CERTIFICATE FUNCTIONS (COMMENTED OUT - NOT IMPLEMENTED) ====================
    // function getBatchCertificates(uint256 batchId) external view batchExists(batchId) returns (Certificate[] memory) {
    //     return batchCertificates[batchId];
    // }
    
    function getBatchAuditTrail(uint256 batchId) external view batchExists(batchId) returns (AuditTrail[] memory) {
        return batchAuditTrail[batchId];
    }
    
    function getActivePendingRequest(uint256 batchId) external view batchExists(batchId) returns (TransferRequest memory) {
        uint256 requestId = activePendingRequests[batchId];
        require(requestId != 0, "No request");
        return transferRequests[requestId];
    }
    
    function isValidParticipant(address participant) external view returns (bool) {
        return participants[participant].isActive;
    }
    
    // ==================== PARTICIPANT MANAGEMENT ====================
    
    function registerParticipant(
        address participant,
        ParticipantRole role,
        string calldata name,
        string calldata location
    ) external onlyContractOwner {
        require(participant != address(0), "Invalid addr");
        require(role != ParticipantRole.None, "Invalid role");
        require(bytes(name).length > 0, "No name");
        require(!participants[participant].isActive, "Exists");
        
        participants[participant] = Participant({
            participantAddress: participant,
            role: role,
            name: name,
            location: location,
            isActive: true,
            registeredAt: block.timestamp
        });
        
        emit ParticipantRegistered(participant, role, name);
    }
    
    function deactivateParticipant(address participant) external onlyContractOwner {
        require(participants[participant].isActive, "Not active");
        participants[participant].isActive = false;
        emit ParticipantDeactivated(participant);
    }
    
    // ==================== BATCH LIFECYCLE IMPLEMENTATION ====================
    
    function registerBatch(
        string calldata batchType,
        uint256 quantity,
        string calldata originLocation,
        string calldata metadataURI
    ) external onlyRegisteredParticipant returns (uint256 batchId) {
        require(bytes(batchType).length > 0, "No type");
        require(quantity > 0, "No quantity");
        require(bytes(originLocation).length > 0, "No origin");
        
        // Generate new batch ID
        batchId = _nextBatchId++;
        
        // Create new batch
        batches[batchId] = Batch({
            id: batchId,
            creator: msg.sender,
            currentOwner: msg.sender,
            pendingOwner: address(0),
            status: BatchStatus.Created,
            batchType: batchType,
            quantity: quantity,
            originLocation: originLocation,
            metadataURI: metadataURI,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });
        
        // Update ownership tracking
        ownershipHistory[batchId].push(msg.sender);
        
        // Create initial audit trail entry
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "BATCH_CREATED",
            details: bytes32(0), // Details stored off-chain or in event
            timestamp: block.timestamp,
            locationData: bytes32(0)
        }));
        
        // Emit events
        emit BatchRegistered(batchId, msg.sender, batchType, quantity, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "BATCH_CREATED", bytes32(0), block.timestamp);
        
        return batchId;
    }
    
    function updateStatus(
        uint256 batchId,
        BatchStatus newStatus,
        string calldata /* details */
    ) external batchExists(batchId) onlyBatchOwnerOrRegulator(batchId) {
        Batch storage batch = batches[batchId];
        BatchStatus oldStatus = batch.status;
        
        // Validate status transition
        require(_isValidStatusTransition(oldStatus, newStatus), "Invalid transition");
        
        // Update batch status and timestamp
        batch.status = newStatus;
        batch.updatedAt = block.timestamp;
        
        // Create audit trail entry (simplified)
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "STATUS_UPDATED",
            details: bytes32(uint256(newStatus)), // Store status as bytes32
            timestamp: block.timestamp,
            locationData: bytes32(0)
        }));
        
        // Emit events
        emit BatchStatusUpdated(batchId, newStatus, msg.sender, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "STATUS_UPDATED", bytes32(uint256(newStatus)), block.timestamp);
        
        // Handle special status updates
        if (newStatus == BatchStatus.Rejected) {
            _handleBatchRejection(batchId);
        }
    }
    
    function getBatchDetails(uint256 batchId) external view batchExists(batchId) returns (
        uint256 id,
        address creator,
        address currentOwner,
        address pendingOwner,
        BatchStatus status,
        string memory batchType,
        uint256 quantity,
        string memory originLocation,
        string memory metadataURI,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Batch storage batch = batches[batchId];
        return (
            batch.id,
            batch.creator,
            batch.currentOwner,
            batch.pendingOwner,
            batch.status,
            batch.batchType,
            batch.quantity,
            batch.originLocation,
            batch.metadataURI,
            batch.createdAt,
            batch.updatedAt
        );
    }
    
    // ==================== MULTI-SIG OWNERSHIP TRANSFER ====================
    
    function requestTransfer(
        uint256 batchId,
        address newOwner,
        string calldata reason,
        string calldata transportDetails
    ) external batchExists(batchId) onlyBatchOwner(batchId) onlyRegisteredParticipant returns (uint256 requestId) {
        require(newOwner != address(0), "Invalid addr");
        require(newOwner != msg.sender, "Self transfer");
        require(participants[newOwner].isActive, "Not registered");
        require(activePendingRequests[batchId] == 0, "Pending");
        require(bytes(reason).length > 0, "No reason");
        
        Batch storage batch = batches[batchId];
        
        // Rejected and Consumed batches cannot be transferred
        require(
            batch.status != BatchStatus.Rejected && batch.status != BatchStatus.Consumed,
            "Invalid status"
        );
        
        // Generate new request ID
        requestId = _nextRequestId++;
        
        // Create transfer request
        transferRequests[requestId] = TransferRequest({
            batchId: batchId,
            from: msg.sender,
            to: newOwner,
            reason: reason,
            transportDetails: transportDetails,
            requestedAt: block.timestamp,
            isActive: true
        });
        
        // Set pending owner and link active request
        batch.pendingOwner = newOwner;
        batch.updatedAt = block.timestamp;
        activePendingRequests[batchId] = requestId;
        
        // Create audit trail entry
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "TRANSFER_REQ",
            details: bytes32(uint256(uint160(newOwner))), // Store address as bytes32
            timestamp: block.timestamp,
            locationData: bytes32(0)
        }));
        
        // Emit events
        emit TransferRequested(requestId, batchId, msg.sender, newOwner, reason, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "TRANSFER_REQ", bytes32(0), block.timestamp);
        
        return requestId;
    }
    
    function acceptTransfer(uint256 requestId) external validTransferRequest(requestId) onlyRegisteredParticipant {
        TransferRequest storage request = transferRequests[requestId];
        Batch storage batch = batches[request.batchId];
        
        require(batch.exists, "No batch");
        require(batch.currentOwner == request.from, "Owner changed");
        require(batch.pendingOwner == request.to, "Pending changed");
        
        // Store previous owner for event
        address previousOwner = batch.currentOwner;
        uint256 batchId = request.batchId;
        
        // Execute ownership transfer
        batch.currentOwner = request.to;
        batch.pendingOwner = address(0);
        batch.updatedAt = block.timestamp;
        
        // Update ownership tracking
        ownershipHistory[batchId].push(request.to);
        
        // Deactivate the request
        request.isActive = false;
        activePendingRequests[batchId] = 0;
        
        // Create audit trail entry
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "TRANSFER_OK",
            details: bytes32(uint256(uint160(request.to))),
            timestamp: block.timestamp,
            locationData: bytes32(0)
        }));
        
        // Emit events
        emit TransferApproved(requestId, batchId, previousOwner, request.to, block.timestamp);
        emit OwnershipTransferred(batchId, previousOwner, request.to, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "TRANSFER_OK", bytes32(0), block.timestamp);
    }
    
    function rejectTransfer(uint256 requestId, string calldata rejectionReason) 
        external 
        validTransferRequest(requestId) 
        onlyRegisteredParticipant 
    {
        TransferRequest storage request = transferRequests[requestId];
        Batch storage batch = batches[request.batchId];
        
        require(bytes(rejectionReason).length > 0, "No reason");
        
        uint256 batchId = request.batchId;
        
        // Clear pending transfer
        batch.pendingOwner = address(0);
        batch.updatedAt = block.timestamp;
        
        // Deactivate the request
        request.isActive = false;
        activePendingRequests[batchId] = 0;
        
        // Create audit trail entry
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "TRANSFER_REJ",
            details: bytes32(0),
            timestamp: block.timestamp,
            locationData: bytes32(0)
        }));
        
        // Emit events
        emit TransferRejected(requestId, batchId, request.from, request.to, rejectionReason, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "TRANSFER_REJ", bytes32(0), block.timestamp);
    }
    
    function cancelTransfer(uint256 requestId) external {
        TransferRequest storage request = transferRequests[requestId];
        
        require(request.isActive, "No request");
        require(request.from == msg.sender, "Not requester");
        
        Batch storage batch = batches[request.batchId];
        uint256 batchId = request.batchId;
        
        // Clear pending transfer
        batch.pendingOwner = address(0);
        batch.updatedAt = block.timestamp;
        
        // Deactivate the request
        request.isActive = false;
        activePendingRequests[batchId] = 0;
        
        // Create audit trail entry
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "TRANSFER_CXL",
            details: bytes32(0),
            timestamp: block.timestamp,
            locationData: bytes32(0)
        }));
        
        // Emit audit entry
        emit AuditEntry(batchId, msg.sender, "TRANSFER_CXL", bytes32(0), block.timestamp);
    }
    
    // ==================== INTERNAL HELPER FUNCTIONS ====================
    
    function _isValidStatusTransition(BatchStatus from, BatchStatus to) internal pure returns (bool) {
        // Created can transition to InTransit or Rejected
        if (from == BatchStatus.Created) {
            return to == BatchStatus.InTransit || to == BatchStatus.Rejected;
        }
        // InTransit can transition to Delivered or Rejected
        if (from == BatchStatus.InTransit) {
            return to == BatchStatus.Delivered || to == BatchStatus.Rejected;
        }
        // Delivered can transition to QualityTested or Rejected
        if (from == BatchStatus.Delivered) {
            return to == BatchStatus.QualityTested || to == BatchStatus.Rejected;
        }
        // QualityTested can transition to Approved or Rejected
        if (from == BatchStatus.QualityTested) {
            return to == BatchStatus.Approved || to == BatchStatus.Rejected;
        }
        // Approved can transition to Consumed
        if (from == BatchStatus.Approved) {
            return to == BatchStatus.Consumed;
        }
        // Rejected and Consumed are terminal states
        return false;
    }
    
    function _handleBatchRejection(uint256 batchId) internal {
        // Additional logic for rejected batches can be implemented here
        // For example: notify previous owners, lock transfers, etc.
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "BATCH_REJECTED",
            details: bytes32(0),
            timestamp: block.timestamp,
            locationData: bytes32(0)
        }));
    }
    
    // Helper functions removed - using OpenZeppelin Strings library instead
    // All string conversions now handled by Strings.toString() methods
}