pragma solidity ^0.8.19;

contract BatchProvenance {
    // Struct to hold batch data    
    struct Batch {
        uint256 id;
        address currentOwner;
        address pendingOwner; // for request/accept pattern
        string metadataURL; // optional gDrive link or any storage link
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    // Mapping: batchId -> Batch
    mapping(uint256 => Batch) public batches;

    // Events to provide audit trail
    event BatchRegistered(uint256  batchId, address  owner, string metadataURL, uint256 timestamp);
    event TransferRequested(uint256  batchId, address  from, address  to, uint256 timestamp);
    event OwnershipTransferred(uint256  batchId, address  previousOwner, address  newOwner, uint256 timestamp);
    event StatusUpdated(uint256  batchId, string status, uint256 timestamp);
    event CertificateLinked(uint256  batchId, string cid, address  by, uint256 timestamp);

    // Counter for batch IDs
    uint256 private _nextBatchId = 1;

    // Access control: for simplicity, we currently allow only current owner to call certain functions.
    // In a fuller design, roles (Refinery, Terminal, Regulator) should be implemented.
    modifier onlyExisting(uint256 batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        _;
    }

    modifier onlyOwner(uint256 batchId) {
        require(batches[batchId].currentOwner == msg.sender, "Not current owner");
        _;
    }

    function registerBatch(string calldata metadataURL) external returns (uint256 batchId) {
        batchId = _nextBatchId++;
        Batch storage b = batches[batchId];
        b.id = batchId;
        b.currentOwner = msg.sender;
        b.metadataURL = metadataURL;
        b.createdAt = block.timestamp;
        b.updatedAt = block.timestamp;
        b.exists = true;

        emit BatchRegistered(batchId, msg.sender, metadataURL, block.timestamp);
        return batchId;
    }

    function requestTransfer(uint256 batchId, address newOwner) external onlyExisting(batchId) onlyOwner(batchId) {
        require(newOwner != address(0), "Invalid new owner");
        batches[batchId].pendingOwner = newOwner;
        batches[batchId].updatedAt = block.timestamp;
        emit TransferRequested(batchId, msg.sender, newOwner, block.timestamp);
    }
    
    function acceptTransfer(uint256 batchId) external onlyExisting(batchId) {
        Batch storage b = batches[batchId];
        require(b.pendingOwner == msg.sender, "No pending transfer to caller");
        address previous = b.currentOwner;
        b.currentOwner = msg.sender;
        b.pendingOwner = address(0); // clear
        b.updatedAt = block.timestamp;
        emit OwnershipTransferred(batchId, previous, msg.sender, block.timestamp);
    }

    function linkCertificate(uint256 batchId, string calldata cid) external onlyExisting(batchId) {
        emit CertificateLinked(batchId, cid, msg.sender, block.timestamp);
        batches[batchId].updatedAt = block.timestamp;
    }

    function updateStatus(uint256 batchId, string calldata status) external onlyExisting(batchId) onlyOwner(batchId) {
        emit StatusUpdated(batchId, status, block.timestamp);
        batches[batchId].updatedAt = block.timestamp;
    }

    function getBatch(uint256 batchId) external view onlyExisting(batchId) returns (
        uint256 id,
        address currentOwner,
        address pendingOwner,
        string memory metadataURL,
        uint256 createdAt,
        uint256 updatedAt
    ) {
        Batch storage b = batches[batchId];
        return (b.id, b.currentOwner, b.pendingOwner, b.metadataURL, b.createdAt, b.updatedAt);
    }
}