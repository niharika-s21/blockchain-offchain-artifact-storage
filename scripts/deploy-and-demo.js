const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying SupplyChain contract...");
    
    // Get signers and deploy
    const [deployer, refinery, terminal] = await ethers.getSigners();
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    const contractAddress = await supplyChain.getAddress();
    console.log("Contract deployed to:", contractAddress);

    // Register participants
    await supplyChain.registerParticipant(refinery.address, 1, "Houston Refinery", "Houston, TX");
    await supplyChain.registerParticipant(terminal.address, 3, "JFK Terminal", "New York, NY");
    console.log("Participants registered");

    // Batch lifecycle demo
    console.log("\nBatch Lifecycle Demo:");

    // 1. Register batch
    await supplyChain.connect(refinery).registerBatch(
        "Jet Fuel A1", 15000, "Houston Refinery", "ipfs://metadata123"
    );
    console.log(" Batch created (ID: 1)");

    // 2. Update to InTransit
    await supplyChain.connect(refinery).updateStatus(1, 1, "Loaded for transport", "Houston");
    console.log(" Status: InTransit");

    // 3. Update to Delivered
    await supplyChain.connect(refinery).updateStatus(1, 2, "Delivered to terminal", "New York");
    console.log(" Status: Delivered");

    // 4. Update to QualityTested
    await supplyChain.connect(refinery).updateStatus(1, 3, "Quality tests passed", "Lab");
    console.log(" Status: QualityTested");

    // 5. Final approval
    await supplyChain.connect(deployer).updateStatus(1, 4, "Approved for use", "Regulatory Office");
    console.log(" Status: Approved");

    // Final summary
    const batch = await supplyChain.getBatchDetails(1);
    const auditTrail = await supplyChain.getBatchAuditTrail(1);
    
    console.log(`\nFinal State: ${batch.batchType} (${batch.quantity} liters) - Status: Approved`);
    console.log(`Audit Trail: ${auditTrail.length} entries recorded`);
    console.log("Demo completed successfully!");
    
    return { contractAddress, batchId: 1 };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });