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

    describe("Multi-Sig Ownership Transfer", function () {
        let batchId;

        beforeEach(async function () {
            // Register a batch for transfer tests
            const tx = await supplyChain.connect(refinery).registerBatch(
                "Jet Fuel A1",
                10000,
                "Houston Refinery",
                "ipfs://metadata"
            );
            await tx.wait();
            batchId = 1;
        });

        describe("Request Transfer", function () {
            it("Should create a transfer request successfully", async function () {
                const tx = await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "Delivery to terminal",
                    "Truck transport via I-10"
                );

                // Check events
                await expect(tx)
                    .to.emit(supplyChain, "TransferRequested")
                    .withArgs(1, batchId, refinery.address, terminal.address, "Delivery to terminal", await ethers.provider.getBlock("latest").then(b => b.timestamp));

                await expect(tx)
                    .to.emit(supplyChain, "AuditEntry");

                // Verify batch has pending owner
                const batch = await supplyChain.getBatchDetails(batchId);
                expect(batch.pendingOwner).to.equal(terminal.address);
                expect(batch.currentOwner).to.equal(refinery.address);

                // Verify transfer request was created
                const request = await supplyChain.transferRequests(1);
                expect(request.batchId).to.equal(batchId);
                expect(request.from).to.equal(refinery.address);
                expect(request.to).to.equal(terminal.address);
                expect(request.reason).to.equal("Delivery to terminal");
                expect(request.transportDetails).to.equal("Truck transport via I-10");
                expect(request.isActive).to.be.true;
            });

            it("Should fail if requester is not the batch owner", async function () {
                await expect(
                    supplyChain.connect(terminal).requestTransfer(
                        batchId,
                        terminal.address,
                        "Unauthorized transfer",
                        "Details"
                    )
                ).to.be.revertedWith("Not the current batch owner");
            });

            it("Should fail if new owner is invalid", async function () {
                // Zero address
                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        ethers.ZeroAddress,
                        "Invalid transfer",
                        "Details"
                    )
                ).to.be.revertedWith("Invalid new owner address");

                // Transfer to self
                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        refinery.address,
                        "Self transfer",
                        "Details"
                    )
                ).to.be.revertedWith("Cannot transfer to yourself");
            });

            it("Should fail if new owner is not registered", async function () {
                const [, , , , unregistered] = await ethers.getSigners();

                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        unregistered.address,
                        "Unregistered recipient",
                        "Details"
                    )
                ).to.be.revertedWith("New owner is not a registered participant");
            });

            it("Should fail if transfer already pending", async function () {
                // Create first transfer request
                await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "First request",
                    "Details"
                );

                // Try to create second request
                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        terminal.address,
                        "Second request",
                        "Details"
                    )
                ).to.be.revertedWith("Transfer request already pending for this batch");
            });

            it("Should fail if reason is empty", async function () {
                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        terminal.address,
                        "",
                        "Details"
                    )
                ).to.be.revertedWith("Transfer reason cannot be empty");
            });

            it("Should fail to transfer rejected batch", async function () {
                // Reject the batch
                await supplyChain.connect(refinery).updateStatus(
                    batchId,
                    5, // Rejected
                    "Quality issues",
                    "Lab"
                );

                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        terminal.address,
                        "Transfer rejected batch",
                        "Details"
                    )
                ).to.be.revertedWith("Cannot transfer rejected or consumed batches");
            });
        });

        describe("Accept Transfer", function () {
            let requestId;

            beforeEach(async function () {
                // Create a transfer request first
                const tx = await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "Transfer to terminal",
                    "Transport details"
                );
                await tx.wait();
                requestId = 1;
            });

            it("Should accept transfer and change ownership", async function () {
                const tx = await supplyChain.connect(terminal).acceptTransfer(requestId);

                // Check events
                await expect(tx)
                    .to.emit(supplyChain, "TransferApproved")
                    .withArgs(requestId, batchId, refinery.address, terminal.address, await ethers.provider.getBlock("latest").then(b => b.timestamp));

                await expect(tx)
                    .to.emit(supplyChain, "OwnershipTransferred")
                    .withArgs(batchId, refinery.address, terminal.address, await ethers.provider.getBlock("latest").then(b => b.timestamp));

                // Verify ownership changed
                const batch = await supplyChain.getBatchDetails(batchId);
                expect(batch.currentOwner).to.equal(terminal.address);
                expect(batch.pendingOwner).to.equal(ethers.ZeroAddress);

                // Verify request is no longer active
                const request = await supplyChain.transferRequests(requestId);
                expect(request.isActive).to.be.false;

                // Verify ownership history was updated
                const history = await supplyChain.getOwnershipHistory(batchId);
                expect(history.length).to.equal(2);
                expect(history[0]).to.equal(refinery.address);
                expect(history[1]).to.equal(terminal.address);

                // Verify new owner has batch in their list
                const terminalBatches = await supplyChain.getBatchesByOwner(terminal.address);
                expect(terminalBatches.length).to.equal(1);
                expect(terminalBatches[0]).to.equal(batchId);
            });

            it("Should fail if caller is not the pending owner", async function () {
                const [, , , , unauthorized] = await ethers.getSigners();

                await expect(
                    supplyChain.connect(unauthorized).acceptTransfer(requestId)
                ).to.be.revertedWith("Not authorized to accept this transfer");
            });

            it("Should fail if transfer request is not active", async function () {
                // Accept the transfer
                await supplyChain.connect(terminal).acceptTransfer(requestId);

                // Try to accept again
                await expect(
                    supplyChain.connect(terminal).acceptTransfer(requestId)
                ).to.be.revertedWith("Transfer request is not active");
            });

            it("Should update audit trail on successful transfer", async function () {
                await supplyChain.connect(terminal).acceptTransfer(requestId);

                const auditTrail = await supplyChain.getBatchAuditTrail(batchId);
                
                // Should have: BATCH_CREATED, TRANSFER_REQUESTED, TRANSFER_ACCEPTED
                expect(auditTrail.length).to.equal(3);
                expect(auditTrail[1].action).to.equal("TRANSFER_REQUESTED");
                expect(auditTrail[2].action).to.equal("TRANSFER_ACCEPTED");
                expect(auditTrail[2].actor).to.equal(terminal.address);
            });
        });

        describe("Reject Transfer", function () {
            let requestId;

            beforeEach(async function () {
                const tx = await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "Transfer request",
                    "Details"
                );
                await tx.wait();
                requestId = 1;
            });

            it("Should reject transfer successfully", async function () {
                const tx = await supplyChain.connect(terminal).rejectTransfer(
                    requestId,
                    "Quality concerns"
                );

                // Check events
                await expect(tx)
                    .to.emit(supplyChain, "TransferRejected")
                    .withArgs(requestId, batchId, refinery.address, terminal.address, "Quality concerns", await ethers.provider.getBlock("latest").then(b => b.timestamp));

                // Verify batch state
                const batch = await supplyChain.getBatchDetails(batchId);
                expect(batch.currentOwner).to.equal(refinery.address);
                expect(batch.pendingOwner).to.equal(ethers.ZeroAddress);

                // Verify request is inactive
                const request = await supplyChain.transferRequests(requestId);
                expect(request.isActive).to.be.false;
            });

            it("Should fail if rejection reason is empty", async function () {
                await expect(
                    supplyChain.connect(terminal).rejectTransfer(requestId, "")
                ).to.be.revertedWith("Rejection reason cannot be empty");
            });

            it("Should update audit trail on rejection", async function () {
                await supplyChain.connect(terminal).rejectTransfer(requestId, "Not ready");

                const auditTrail = await supplyChain.getBatchAuditTrail(batchId);
                expect(auditTrail.length).to.equal(3);
                expect(auditTrail[2].action).to.equal("TRANSFER_REJECTED");
            });
        });

        describe("Cancel Transfer", function () {
            let requestId;

            beforeEach(async function () {
                const tx = await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "Transfer request",
                    "Details"
                );
                await tx.wait();
                requestId = 1;
            });

            it("Should allow requester to cancel transfer", async function () {
                const tx = await supplyChain.connect(refinery).cancelTransfer(requestId);

                await expect(tx)
                    .to.emit(supplyChain, "AuditEntry");

                // Verify batch state
                const batch = await supplyChain.getBatchDetails(batchId);
                expect(batch.currentOwner).to.equal(refinery.address);
                expect(batch.pendingOwner).to.equal(ethers.ZeroAddress);

                // Verify request is inactive
                const request = await supplyChain.transferRequests(requestId);
                expect(request.isActive).to.be.false;
            });

            it("Should fail if caller is not the requester", async function () {
                await expect(
                    supplyChain.connect(terminal).cancelTransfer(requestId)
                ).to.be.revertedWith("Only the requester can cancel the transfer");
            });

            it("Should fail if request is not active", async function () {
                await supplyChain.connect(refinery).cancelTransfer(requestId);

                await expect(
                    supplyChain.connect(refinery).cancelTransfer(requestId)
                ).to.be.revertedWith("Transfer request is not active");
            });
        });

        describe("Complex Transfer Scenarios", function () {
            it("Should handle sequential transfers correctly", async function () {
                // First transfer: refinery -> terminal
                await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "Initial delivery",
                    "Transport 1"
                );
                await supplyChain.connect(terminal).acceptTransfer(1);

                // Verify ownership
                let batch = await supplyChain.getBatchDetails(batchId);
                expect(batch.currentOwner).to.equal(terminal.address);

                // Second transfer: terminal -> regulator
                await supplyChain.registerParticipant(
                    regulator.address,
                    4, // Regulator role
                    "Regulatory Body",
                    "Washington DC"
                );

                await supplyChain.connect(terminal).requestTransfer(
                    batchId,
                    regulator.address,
                    "Quality inspection",
                    "Transport 2"
                );
                await supplyChain.connect(regulator).acceptTransfer(2);

                // Verify final ownership
                batch = await supplyChain.getBatchDetails(batchId);
                expect(batch.currentOwner).to.equal(regulator.address);

                // Verify complete ownership history
                const history = await supplyChain.getOwnershipHistory(batchId);
                expect(history.length).to.equal(3);
                expect(history[0]).to.equal(refinery.address);
                expect(history[1]).to.equal(terminal.address);
                expect(history[2]).to.equal(regulator.address);
            });

            it("Should allow new transfer after rejection", async function () {
                // First request
                await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "First attempt",
                    "Details"
                );

                // Reject it
                await supplyChain.connect(terminal).rejectTransfer(1, "Not ready");

                // Second request should work
                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        terminal.address,
                        "Second attempt",
                        "Details"
                    )
                ).to.not.be.reverted;
            });

            it("Should allow new transfer after cancellation", async function () {
                // First request
                await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "First attempt",
                    "Details"
                );

                // Cancel it
                await supplyChain.connect(refinery).cancelTransfer(1);

                // Second request should work
                await expect(
                    supplyChain.connect(refinery).requestTransfer(
                        batchId,
                        terminal.address,
                        "Second attempt",
                        "Details"
                    )
                ).to.not.be.reverted;
            });

            it("Should track multiple batches with different ownership correctly", async function () {
                // Create second batch
                await supplyChain.connect(refinery).registerBatch(
                    "Diesel",
                    5000,
                    "Houston",
                    "ipfs://metadata2"
                );
                const batchId2 = 2;

                // Transfer first batch to terminal
                await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "Transfer batch 1",
                    "Details"
                );
                await supplyChain.connect(terminal).acceptTransfer(1);

                // Verify current ownership via batch details
                const batch1 = await supplyChain.getBatchDetails(batchId);
                const batch2 = await supplyChain.getBatchDetails(batchId2);

                expect(batch1.currentOwner).to.equal(terminal.address);
                expect(batch2.currentOwner).to.equal(refinery.address);

                // Note: getBatchesByOwner returns all batches ever owned/created by an address (historical)
                // not just currently owned batches
                const refineryBatches = await supplyChain.getBatchesByOwner(refinery.address);
                const terminalBatches = await supplyChain.getBatchesByOwner(terminal.address);

                expect(refineryBatches.length).to.equal(2); // Created both batches
                expect(terminalBatches.length).to.equal(1); // Received one batch
                expect(terminalBatches[0]).to.equal(batchId);
            });
        });

        describe("Get Active Pending Request", function () {
            it("Should return active pending request", async function () {
                await supplyChain.connect(refinery).requestTransfer(
                    batchId,
                    terminal.address,
                    "Transfer request",
                    "Details"
                );

                const request = await supplyChain.getActivePendingRequest(batchId);
                expect(request.batchId).to.equal(batchId);
                expect(request.from).to.equal(refinery.address);
                expect(request.to).to.equal(terminal.address);
                expect(request.isActive).to.be.true;
            });

            it("Should fail if no active pending request", async function () {
                await expect(
                    supplyChain.getActivePendingRequest(batchId)
                ).to.be.revertedWith("No active pending request");
            });
        });
    });
});