const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain - Batch Lifecycle", function () {
    let SupplyChain;
    let supplyChain;
    let owner;
    let refinery;
    let terminal;
    let regulator;

    beforeEach(async function () {
        // Get signers
        [owner, refinery, terminal, regulator] = await ethers.getSigners();

        // Deploy contract
        SupplyChain = await ethers.getContractFactory("SupplyChain");
        supplyChain = await SupplyChain.deploy();
        await supplyChain.waitForDeployment();

        // Register participants
        await supplyChain.registerParticipant(
            refinery.address,
            1, // ParticipantRole.Refinery
            "Test Refinery",
            "Houston, TX"
        );

        await supplyChain.registerParticipant(
            terminal.address,
            3, // ParticipantRole.Terminal
            "Test Terminal",
            "New York, NY"
        );
    });

    describe("Batch Registration", function () {
        it("Should register a new batch successfully", async function () {
            const tx = await supplyChain.connect(refinery).registerBatch(
                "Jet Fuel A1",
                10000, // 10,000 liters
                "Houston Refinery",
                "ipfs://QmTest123"
            );

            // Check if events were emitted
            await expect(tx)
                .to.emit(supplyChain, "BatchRegistered")
                .withArgs(1, refinery.address, "Jet Fuel A1", 10000, await ethers.provider.getBlock("latest").then(b => b.timestamp));

            await expect(tx)
                .to.emit(supplyChain, "AuditEntry");

            // Verify batch details
            const batch = await supplyChain.getBatchDetails(1);
            expect(batch.id).to.equal(1);
            expect(batch.creator).to.equal(refinery.address);
            expect(batch.currentOwner).to.equal(refinery.address);
            expect(batch.status).to.equal(0); // BatchStatus.Created
            expect(batch.batchType).to.equal("Jet Fuel A1");
            expect(batch.quantity).to.equal(10000);
            expect(batch.originLocation).to.equal("Houston Refinery");
            expect(batch.metadataURI).to.equal("ipfs://QmTest123");
        });

        it("Should fail to register batch with invalid parameters", async function () {
            // Empty batch type
            await expect(
                supplyChain.connect(refinery).registerBatch("", 1000, "Location", "ipfs://test")
            ).to.be.revertedWith("Batch type cannot be empty");

            // Zero quantity
            await expect(
                supplyChain.connect(refinery).registerBatch("Fuel", 0, "Location", "ipfs://test")
            ).to.be.revertedWith("Quantity must be greater than zero");

            // Empty origin location
            await expect(
                supplyChain.connect(refinery).registerBatch("Fuel", 1000, "", "ipfs://test")
            ).to.be.revertedWith("Origin location cannot be empty");
        });

        it("Should fail if unregistered participant tries to register batch", async function () {
            const [, , , , unregistered] = await ethers.getSigners();
            
            await expect(
                supplyChain.connect(unregistered).registerBatch("Fuel", 1000, "Location", "ipfs://test")
            ).to.be.revertedWith("Caller is not a registered participant");
        });
    });

    describe("Status Updates", function () {
        let batchId;

        beforeEach(async function () {
            // Register a batch first
            const tx = await supplyChain.connect(refinery).registerBatch(
                "Diesel",
                5000,
                "Refinery Location",
                "ipfs://metadata"
            );
            const receipt = await tx.wait();
            batchId = 1; // First batch
        });

        it("Should update batch status successfully", async function () {
            const tx = await supplyChain.connect(refinery).updateStatus(
                batchId,
                1, // BatchStatus.InTransit
                "Batch loaded for transport",
                "GPS: 29.7604,-95.3698"
            );

            // Check event emission
            await expect(tx)
                .to.emit(supplyChain, "BatchStatusUpdated")
                .withArgs(batchId, 1, refinery.address, await ethers.provider.getBlock("latest").then(b => b.timestamp));

            // Verify status was updated
            const batch = await supplyChain.getBatchDetails(batchId);
            expect(batch.status).to.equal(1); // BatchStatus.InTransit
        });

        it("Should enforce valid status transitions", async function () {
            // Try invalid transition: Created -> Delivered (skipping InTransit)
            await expect(
                supplyChain.connect(refinery).updateStatus(batchId, 2, "Invalid transition", "")
            ).to.be.revertedWith("Invalid status transition");

            // Valid transition: Created -> InTransit
            await supplyChain.connect(refinery).updateStatus(batchId, 1, "Valid transition", "");
            
            // Try to go backward: InTransit -> Created
            await expect(
                supplyChain.connect(refinery).updateStatus(batchId, 0, "Backward transition", "")
            ).to.be.revertedWith("Invalid status transition");
        });

        it("Should handle batch rejection", async function () {
            const tx = await supplyChain.connect(refinery).updateStatus(
                batchId,
                5, // BatchStatus.Rejected
                "Quality issues detected",
                "Inspection facility"
            );

            await expect(tx)
                .to.emit(supplyChain, "BatchStatusUpdated")
                .withArgs(batchId, 5, refinery.address, await ethers.provider.getBlock("latest").then(b => b.timestamp));

            // Verify status
            const batch = await supplyChain.getBatchDetails(batchId);
            expect(batch.status).to.equal(5); // BatchStatus.Rejected
        });

        it("Should allow regulators to update status", async function () {
            // Owner (deployer) is a regulator by default in constructor
            const tx = await supplyChain.connect(owner).updateStatus(
                batchId,
                1, // BatchStatus.InTransit
                "Regulator approved transport",
                "Regulatory office"
            );

            await expect(tx)
                .to.emit(supplyChain, "BatchStatusUpdated");
        });

        it("Should fail if unauthorized user tries to update status", async function () {
            const [, , , , unauthorized] = await ethers.getSigners();
            
            await expect(
                supplyChain.connect(unauthorized).updateStatus(batchId, 1, "Unauthorized", "")
            ).to.be.revertedWith("Not authorized to access this batch");
        });
    });

    describe("Audit Trail", function () {
        it("Should create audit trail entries for batch operations", async function () {
            // Register batch
            await supplyChain.connect(refinery).registerBatch("Fuel", 1000, "Location", "ipfs://test");
            
            // Update status
            await supplyChain.connect(refinery).updateStatus(1, 1, "Moving to transport", "GPS:123,456");

            // Get audit trail
            const auditTrail = await supplyChain.getBatchAuditTrail(1);
            
            expect(auditTrail.length).to.equal(2);
            expect(auditTrail[0].action).to.equal("BATCH_CREATED");
            expect(auditTrail[0].actor).to.equal(refinery.address);
            expect(auditTrail[1].action).to.equal("STATUS_UPDATED");
            expect(auditTrail[1].details).to.equal("Moving to transport");
            expect(auditTrail[1].locationData).to.equal("GPS:123,456");
        });
    });

    describe("Batch Queries", function () {
        beforeEach(async function () {
            // Register multiple batches
            await supplyChain.connect(refinery).registerBatch("Fuel A", 1000, "Location A", "ipfs://a");
            await supplyChain.connect(refinery).registerBatch("Fuel B", 2000, "Location B", "ipfs://b");
        });

        it("Should return correct total batch count", async function () {
            const total = await supplyChain.getTotalBatches();
            expect(total).to.equal(2);
        });

        it("Should return batches by owner", async function () {
            const batches = await supplyChain.getBatchesByOwner(refinery.address);
            expect(batches.length).to.equal(2);
            expect(batches[0]).to.equal(1);
            expect(batches[1]).to.equal(2);
        });

        it("Should return ownership history", async function () {
            const history = await supplyChain.getOwnershipHistory(1);
            expect(history.length).to.equal(1);
            expect(history[0]).to.equal(refinery.address);
        });
    });
});