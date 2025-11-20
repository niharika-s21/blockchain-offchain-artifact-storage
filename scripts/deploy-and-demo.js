const { ethers } = require("hardhat");

async function main() {
    console.log("=".repeat(60));
    console.log("SUPPLY CHAIN SMART CONTRACT DEPLOYMENT & DEMO");
    console.log("=".repeat(60));
    
    // Get signers and deploy
    const [deployer, refinery, terminal, airline] = await ethers.getSigners();
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    
    console.log("\n📦 Deploying SupplyChain contract...");
    const supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();

    const contractAddress = await supplyChain.getAddress();
    console.log("✅ Contract deployed to:", contractAddress);
    console.log("   Deployer (Regulator):", deployer.address);

    // Register participants
    console.log("\n👥 Registering Participants...");
    await supplyChain.registerParticipant(refinery.address, 1, "Houston Refinery", "Houston, TX");
    console.log("✅ Registered: Houston Refinery");
    
    await supplyChain.registerParticipant(terminal.address, 3, "JFK Terminal", "New York, NY");
    console.log("✅ Registered: JFK Terminal");
    
    await supplyChain.registerParticipant(airline.address, 5, "Delta Airlines", "Atlanta, GA");
    console.log("✅ Registered: Delta Airlines");

    // Batch lifecycle demo
    console.log("\n" + "=".repeat(60));
    console.log("BATCH LIFECYCLE DEMONSTRATION");
    console.log("=".repeat(60));

    // 1. Register batch
    console.log("\n📋 STEP 1: Batch Registration");
    await supplyChain.connect(refinery).registerBatch(
        "Jet Fuel A1", 15000, "Houston Refinery", "ipfs://metadata123"
    );
    console.log("✅ Batch created");
    console.log("   ID: 1");
    console.log("   Type: Jet Fuel A1");
    console.log("   Quantity: 15,000 liters");
    console.log("   Owner: Houston Refinery");

    // 2. Update to InTransit
    console.log("\n🚛 STEP 2: Transport Initiated");
    await supplyChain.connect(refinery).updateStatus(
        1, 1, "Loaded onto truck for transport to JFK", "GPS: 29.7604,-95.3698"
    );
    console.log("✅ Status: InTransit");

    // 3. Multi-sig transfer to terminal
    console.log("\n🔄 STEP 3: Multi-Signature Ownership Transfer");
    console.log("   Refinery → Terminal");
    
    console.log("   → Refinery requests transfer...");
    const transferTx = await supplyChain.connect(refinery).requestTransfer(
        1, 
        terminal.address, 
        "Delivery to JFK Terminal",
        "Truck transport via I-10, ETA 3 days"
    );
    await transferTx.wait();
    console.log("   ✓ Transfer request created (Request ID: 1)");
    
    console.log("   → Terminal accepts transfer...");
    await supplyChain.connect(terminal).acceptTransfer(1);
    console.log("   ✓ Transfer accepted");
    console.log("✅ Ownership transferred to JFK Terminal");

    // 4. Update to Delivered
    console.log("\n📦 STEP 4: Delivery Confirmation");
    await supplyChain.connect(terminal).updateStatus(
        1, 2, "Arrived at JFK Terminal", "GPS: 40.6413,-73.7781"
    );
    console.log("✅ Status: Delivered");

    // 5. Update to QualityTested
    console.log("\n🔬 STEP 5: Quality Testing");
    await supplyChain.connect(terminal).updateStatus(
        1, 3, "Quality tests passed - meets ASTM D1655 standards", "Terminal Lab"
    );
    console.log("✅ Status: QualityTested");

    // 6. Second transfer to airline
    console.log("\n🔄 STEP 6: Second Multi-Sig Transfer");
    console.log("   Terminal → Airline");
    
    console.log("   → Terminal requests transfer...");
    await supplyChain.connect(terminal).requestTransfer(
        1,
        airline.address,
        "Sale to Delta Airlines",
        "Pipeline transfer to aircraft refueling station"
    );
    console.log("   ✓ Transfer request created (Request ID: 2)");
    
    console.log("   → Airline accepts transfer...");
    await supplyChain.connect(airline).acceptTransfer(2);
    console.log("   ✓ Transfer accepted");
    console.log("✅ Ownership transferred to Delta Airlines");

    // 7. Final approval
    console.log("\n✔️  STEP 7: Regulatory Approval");
    await supplyChain.connect(deployer).updateStatus(
        1, 4, "FAA approval granted for aviation use", "Regulatory Office"
    );
    console.log("✅ Status: Approved");

    // Final summary
    console.log("\n" + "=".repeat(60));
    console.log("FINAL STATE SUMMARY");
    console.log("=".repeat(60));
    
    const batch = await supplyChain.getBatchDetails(1);
    const ownershipHistory = await supplyChain.getOwnershipHistory(1);
    const auditTrail = await supplyChain.getBatchAuditTrail(1);
    
    console.log("\n📊 Batch Information:");
    console.log("   Type:", batch.batchType);
    console.log("   Quantity:", batch.quantity.toString(), "liters");
    console.log("   Origin:", batch.originLocation);
    console.log("   Current Owner:", batch.currentOwner);
    console.log("   Status:", ["Created", "InTransit", "Delivered", "QualityTested", "Approved"][batch.status]);

    console.log("\n📜 Ownership History:");
    ownershipHistory.forEach((owner, i) => {
        const names = {
            [refinery.address]: "Houston Refinery",
            [terminal.address]: "JFK Terminal",
            [airline.address]: "Delta Airlines"
        };
        console.log(`   ${i + 1}. ${names[owner] || owner}`);
    });

    console.log("\n📝 Audit Trail:");
    console.log(`   Total entries: ${auditTrail.length}`);
    auditTrail.slice(0, 5).forEach((entry, i) => {
        console.log(`   ${i + 1}. ${entry.action}`);
        console.log(`      Details: ${entry.details}`);
        if (entry.locationData) {
            console.log(`      Location: ${entry.locationData}`);
        }
    });
    if (auditTrail.length > 5) {
        console.log(`   ... and ${auditTrail.length - 5} more entries`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ DEMO COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));
    console.log("\nKey Features Demonstrated:");
    console.log("  ✓ Batch registration with metadata");
    console.log("  ✓ Status lifecycle management");
    console.log("  ✓ Multi-signature ownership transfers (2 transfers)");
    console.log("  ✓ Role-based access control");
    console.log("  ✓ Comprehensive audit trail");
    console.log("  ✓ Event emission for transparency");
    
    return { contractAddress, batchId: 1 };
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });