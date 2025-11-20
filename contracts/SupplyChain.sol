// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SupplyChain
 * @dev A comprehensive supply chain provenance contract for tracking batches
 * with off-chain artifact storage using IPFS and multi-signature transfers
 */
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
    
    // ==================== STRUCTS ====================
    
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
    
    struct Certificate {
        uint256 batchId;
        string certificateType;     // e.g., "Quality", "Safety", "Environmental"
        string ipfsHash;            // IPFS hash of the certificate document
        address issuedBy;           // Who issued the certificate
        uint256 issuedAt;
        bool isValid;               // Whether certificate is still valid
    }
    
    struct AuditTrail {
        uint256 batchId;
        address actor;              // Who performed the action
        string action;              // What action was performed
        string details;             // Additional details about the action
        uint256 timestamp;
        string locationData;        // GPS coordinates or location info
    }
    
    // ==================== STATE VARIABLES ====================
    
    // Core mappings
    mapping(uint256 => Batch) public batches;
    mapping(address => Participant) public participants;
    mapping(uint256 => TransferRequest) public transferRequests;
    
    // Certificate tracking
    mapping(uint256 => Certificate[]) public batchCertificates;
    mapping(string => bool) public usedCertificateHashes;
    
    // Audit trail
    mapping(uint256 => AuditTrail[]) public batchAuditTrail;
    
    // Ownership and transfer tracking
    mapping(uint256 => address[]) public ownershipHistory;
    mapping(address => uint256[]) public ownerBatches;
    
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
    
    // Certificate events
    event CertificateLinked(
        uint256 indexed batchId, 
        string certificateType,
        string indexed ipfsHash, 
        address indexed issuedBy,
        uint256 timestamp
    );
    
    event CertificateRevoked(
        uint256 indexed batchId, 
        string ipfsHash, 
        address indexed revokedBy,
        uint256 timestamp
    );
    
    // Audit events
    event AuditEntry(
        uint256 indexed batchId,
        address indexed actor,
        string action,
        string details,
        uint256 timestamp
    );
    
    // ==================== MODIFIERS ====================
    
    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Only contract owner can perform this action");
        _;
    }
    
    modifier onlyRegisteredParticipant() {
        require(participants[msg.sender].isActive, "Caller is not a registered participant");
        _;
    }
    
    modifier onlyRole(ParticipantRole requiredRole) {
        require(participants[msg.sender].role == requiredRole, "Insufficient role permissions");
        _;
    }
    
    modifier batchExists(uint256 batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        _;
    }
    
    modifier onlyBatchOwner(uint256 batchId) {
        require(batches[batchId].currentOwner == msg.sender, "Not the current batch owner");
        _;
    }
    
    modifier onlyBatchOwnerOrRegulator(uint256 batchId) {
        require(
            batches[batchId].currentOwner == msg.sender || 
            participants[msg.sender].role == ParticipantRole.Regulator,
            "Not authorized to access this batch"
        );
        _;
    }
    
    modifier validTransferRequest(uint256 requestId) {
        require(transferRequests[requestId].isActive, "Transfer request is not active");
        require(transferRequests[requestId].to == msg.sender, "Not authorized to accept this transfer");
        _;
    }
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() {
        contractOwner = msg.sender;
        
        // Register contract deployer as first participant with admin role
        participants[msg.sender] = Participant({
            participantAddress: msg.sender,
            role: ParticipantRole.Regulator,
            name: "Contract Administrator",
            location: "System",
            isActive: true,
            registeredAt: block.timestamp
        });
        
        emit ParticipantRegistered(msg.sender, ParticipantRole.Regulator, "Contract Administrator");
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @dev Get total number of batches created
     */
    function getTotalBatches() external view returns (uint256) {
        return _nextBatchId - 1;
    }
    
    /**
     * @dev Get all batches owned by a specific address
     */
    function getBatchesByOwner(address owner) external view returns (uint256[] memory) {
        return ownerBatches[owner];
    }
    
    /**
     * @dev Get ownership history for a batch
     */
    function getOwnershipHistory(uint256 batchId) external view batchExists(batchId) returns (address[] memory) {
        return ownershipHistory[batchId];
    }
    
    /**
     * @dev Get all certificates for a batch
     */
    function getBatchCertificates(uint256 batchId) external view batchExists(batchId) returns (Certificate[] memory) {
        return batchCertificates[batchId];
    }
    
    /**
     * @dev Get audit trail for a batch
     */
    function getBatchAuditTrail(uint256 batchId) external view batchExists(batchId) returns (AuditTrail[] memory) {
        return batchAuditTrail[batchId];
    }
    
    /**
     * @dev Get active transfer request for a batch (if any)
     */
    function getActivePendingRequest(uint256 batchId) external view batchExists(batchId) returns (TransferRequest memory) {
        uint256 requestId = activePendingRequests[batchId];
        require(requestId != 0, "No active pending request");
        return transferRequests[requestId];
    }
    
    /**
     * @dev Check if participant is registered and active
     */
    function isValidParticipant(address participant) external view returns (bool) {
        return participants[participant].isActive;
    }
    
    // ==================== PARTICIPANT MANAGEMENT ====================
    
    /**
     * @dev Register a new participant in the supply chain
     * @param participant Address of the participant to register
     * @param role Role of the participant
     * @param name Name of the participant organization
     * @param location Physical location of the participant
     */
    function registerParticipant(
        address participant,
        ParticipantRole role,
        string calldata name,
        string calldata location
    ) external onlyContractOwner {
        require(participant != address(0), "Invalid participant address");
        require(role != ParticipantRole.None, "Invalid role");
        require(bytes(name).length > 0, "Name cannot be empty");
        require(!participants[participant].isActive, "Participant already registered");
        
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
    
    /**
     * @dev Deactivate a participant
     * @param participant Address of the participant to deactivate
     */
    function deactivateParticipant(address participant) external onlyContractOwner {
        require(participants[participant].isActive, "Participant not active");
        participants[participant].isActive = false;
        emit ParticipantDeactivated(participant);
    }
    
    // ==================== BATCH LIFECYCLE IMPLEMENTATION ====================
    
    /**
     * @dev Register a new batch in the supply chain
     * @param batchType Type of the batch (e.g., "Jet Fuel A1", "Diesel")
     * @param quantity Quantity of the batch in appropriate units
     * @param originLocation Physical location where batch was created
     * @param metadataURI IPFS URI containing additional metadata
     * @return batchId The ID of the newly created batch
     */
    function registerBatch(
        string calldata batchType,
        uint256 quantity,
        string calldata originLocation,
        string calldata metadataURI
    ) external onlyRegisteredParticipant returns (uint256 batchId) {
        require(bytes(batchType).length > 0, "Batch type cannot be empty");
        require(quantity > 0, "Quantity must be greater than zero");
        require(bytes(originLocation).length > 0, "Origin location cannot be empty");
        
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
        ownerBatches[msg.sender].push(batchId);
        
        // Create initial audit trail entry
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "BATCH_CREATED",
            details: string(abi.encodePacked("Batch created with type: ", batchType, ", quantity: ", _uint256ToString(quantity))),
            timestamp: block.timestamp,
            locationData: originLocation
        }));
        
        // Emit events
        emit BatchRegistered(batchId, msg.sender, batchType, quantity, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "BATCH_CREATED", 
            string(abi.encodePacked("Created batch: ", batchType)), block.timestamp);
        
        return batchId;
    }
    
    /**
     * @dev Update the status of a batch
     * @param batchId ID of the batch to update
     * @param newStatus New status for the batch
     * @param details Additional details about the status update
     * @param locationData Current location data (optional)
     */
    function updateStatus(
        uint256 batchId,
        BatchStatus newStatus,
        string calldata details,
        string calldata locationData
    ) external batchExists(batchId) onlyBatchOwnerOrRegulator(batchId) {
        Batch storage batch = batches[batchId];
        BatchStatus oldStatus = batch.status;
        
        // Validate status transition
        require(_isValidStatusTransition(oldStatus, newStatus), "Invalid status transition");
        
        // Update batch status and timestamp
        batch.status = newStatus;
        batch.updatedAt = block.timestamp;
        
        // Create audit trail entry
        string memory statusDetails = bytes(details).length > 0 ? details : 
            string(abi.encodePacked("Status changed from ", _statusToString(oldStatus), " to ", _statusToString(newStatus)));
            
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "STATUS_UPDATED",
            details: statusDetails,
            timestamp: block.timestamp,
            locationData: locationData
        }));
        
        // Emit events
        emit BatchStatusUpdated(batchId, newStatus, msg.sender, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "STATUS_UPDATED", statusDetails, block.timestamp);
        
        // Handle special status updates
        if (newStatus == BatchStatus.Rejected) {
            _handleBatchRejection(batchId, details);
        }
    }
    
    /**
     * @dev Get detailed batch information including current status
     * @param batchId ID of the batch to retrieve
     */
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
    
    /**
     * @dev Request transfer of batch ownership to a new owner
     * @param batchId ID of the batch to transfer
     * @param newOwner Address of the proposed new owner
     * @param reason Reason for the transfer
     * @param transportDetails Details about transport method, route, etc.
     * @return requestId The ID of the created transfer request
     */
    function requestTransfer(
        uint256 batchId,
        address newOwner,
        string calldata reason,
        string calldata transportDetails
    ) external batchExists(batchId) onlyBatchOwner(batchId) onlyRegisteredParticipant returns (uint256 requestId) {
        require(newOwner != address(0), "Invalid new owner address");
        require(newOwner != msg.sender, "Cannot transfer to yourself");
        require(participants[newOwner].isActive, "New owner is not a registered participant");
        require(activePendingRequests[batchId] == 0, "Transfer request already pending for this batch");
        require(bytes(reason).length > 0, "Transfer reason cannot be empty");
        
        Batch storage batch = batches[batchId];
        
        // Rejected and Consumed batches cannot be transferred
        require(
            batch.status != BatchStatus.Rejected && batch.status != BatchStatus.Consumed,
            "Cannot transfer rejected or consumed batches"
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
            action: "TRANSFER_REQUESTED",
            details: string(abi.encodePacked("Transfer requested to ", _addressToString(newOwner), ". Reason: ", reason)),
            timestamp: block.timestamp,
            locationData: transportDetails
        }));
        
        // Emit events
        emit TransferRequested(requestId, batchId, msg.sender, newOwner, reason, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "TRANSFER_REQUESTED", reason, block.timestamp);
        
        return requestId;
    }
    
    /**
     * @dev Accept a pending transfer request (multi-sig second step)
     * @param requestId ID of the transfer request to accept
     */
    function acceptTransfer(uint256 requestId) external validTransferRequest(requestId) onlyRegisteredParticipant {
        TransferRequest storage request = transferRequests[requestId];
        Batch storage batch = batches[request.batchId];
        
        require(batch.exists, "Batch does not exist");
        require(batch.currentOwner == request.from, "Original owner has changed");
        require(batch.pendingOwner == request.to, "Pending owner has changed");
        
        // Store previous owner for event
        address previousOwner = batch.currentOwner;
        uint256 batchId = request.batchId;
        
        // Execute ownership transfer
        batch.currentOwner = request.to;
        batch.pendingOwner = address(0);
        batch.updatedAt = block.timestamp;
        
        // Update ownership tracking
        ownershipHistory[batchId].push(request.to);
        ownerBatches[request.to].push(batchId);
        
        // Deactivate the request
        request.isActive = false;
        activePendingRequests[batchId] = 0;
        
        // Create audit trail entry
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "TRANSFER_ACCEPTED",
            details: string(abi.encodePacked("Ownership transferred from ", _addressToString(previousOwner), " to ", _addressToString(request.to))),
            timestamp: block.timestamp,
            locationData: ""
        }));
        
        // Emit events
        emit TransferApproved(requestId, batchId, previousOwner, request.to, block.timestamp);
        emit OwnershipTransferred(batchId, previousOwner, request.to, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "TRANSFER_ACCEPTED", "Ownership transferred", block.timestamp);
    }
    
    /**
     * @dev Reject a pending transfer request
     * @param requestId ID of the transfer request to reject
     * @param rejectionReason Reason for rejecting the transfer
     */
    function rejectTransfer(uint256 requestId, string calldata rejectionReason) 
        external 
        validTransferRequest(requestId) 
        onlyRegisteredParticipant 
    {
        TransferRequest storage request = transferRequests[requestId];
        Batch storage batch = batches[request.batchId];
        
        require(bytes(rejectionReason).length > 0, "Rejection reason cannot be empty");
        
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
            action: "TRANSFER_REJECTED",
            details: string(abi.encodePacked("Transfer rejected by ", _addressToString(msg.sender), ". Reason: ", rejectionReason)),
            timestamp: block.timestamp,
            locationData: ""
        }));
        
        // Emit events
        emit TransferRejected(requestId, batchId, request.from, request.to, rejectionReason, block.timestamp);
        emit AuditEntry(batchId, msg.sender, "TRANSFER_REJECTED", rejectionReason, block.timestamp);
    }
    
    /**
     * @dev Cancel a transfer request by the original requester
     * @param requestId ID of the transfer request to cancel
     */
    function cancelTransfer(uint256 requestId) external {
        TransferRequest storage request = transferRequests[requestId];
        
        require(request.isActive, "Transfer request is not active");
        require(request.from == msg.sender, "Only the requester can cancel the transfer");
        
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
            action: "TRANSFER_CANCELLED",
            details: "Transfer request cancelled by requester",
            timestamp: block.timestamp,
            locationData: ""
        }));
        
        // Emit audit entry
        emit AuditEntry(batchId, msg.sender, "TRANSFER_CANCELLED", "Transfer cancelled", block.timestamp);
    }
    
    // ==================== INTERNAL HELPER FUNCTIONS ====================
    
    /**
     * @dev Validate if status transition is allowed
     */
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
    
    /**
     * @dev Handle batch rejection logic
     */
    function _handleBatchRejection(uint256 batchId, string memory reason) internal {
        // Additional logic for rejected batches can be implemented here
        // For example: notify previous owners, lock transfers, etc.
        batchAuditTrail[batchId].push(AuditTrail({
            batchId: batchId,
            actor: msg.sender,
            action: "BATCH_REJECTED",
            details: string(abi.encodePacked("Batch rejected. Reason: ", reason)),
            timestamp: block.timestamp,
            locationData: ""
        }));
    }
    
    /**
     * @dev Convert BatchStatus enum to string for logging
     */
    function _statusToString(BatchStatus status) internal pure returns (string memory) {
        if (status == BatchStatus.Created) return "Created";
        if (status == BatchStatus.InTransit) return "InTransit";
        if (status == BatchStatus.Delivered) return "Delivered";
        if (status == BatchStatus.QualityTested) return "QualityTested";
        if (status == BatchStatus.Approved) return "Approved";
        if (status == BatchStatus.Rejected) return "Rejected";
        if (status == BatchStatus.Consumed) return "Consumed";
        return "Unknown";
    }
    
    /**
     * @dev Convert uint256 to string
     */
    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    /**
     * @dev Convert address to string for logging
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}