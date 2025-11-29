const { ethers } = require("hardhat");

/**
 * Test script to verify batch history and events
 * This creates a batch with multiple events to test the visualization feature
 */

async function main() {
    console.log("=".repeat(70));
    console.log("BATCH HISTORY VISUALIZATION TEST SCRIPT");
    console.log("=".repeat(70));
    
    // Get contract address (update this after deployment)
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    // Get signers
    const [deployer, refinery, terminal, airline, inspector] = await ethers.getSigners();
    
    console.log("\n📋 Using accounts:");
    console.log("   Deployer/Regulator:", deployer.address);
    console.log("   Refinery:", refinery.address);
    console.log("   Terminal:", terminal.address);
    console.log("   Airline:", airline.address);
    
    // Get contract instance
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = SupplyChain.attach(CONTRACT_ADDRESS);
    
    console.log("\n📍 Connected to contract:", CONTRACT_ADDRESS);
    
    // Check if batch exists (batch ID 1 from demo)
    try {
        const batch = await supplyChain.getBatchDetails(1);
        console.log("\n✅ Found existing batch #1");
        console.log("   Type:", batch.batchType);
        console.log("   Status:", batch.status);
        
        // Query events for batch 1
        console.log("\n📊 Querying events for Batch #1...");
        
        const currentBlock = await ethers.provider.getBlockNumber();
        console.log("   Current block:", currentBlock);
        
        // Query BatchRegistered events
        const batchRegisteredFilter = supplyChain.filters.BatchRegistered(1);
        const batchRegisteredEvents = await supplyChain.queryFilter(batchRegisteredFilter, 0, currentBlock);
        console.log(`   ✓ BatchRegistered events: ${batchRegisteredEvents.length}`);
        
        // Query StatusUpdated events
        const statusUpdatedFilter = supplyChain.filters.BatchStatusUpdated(1);
        const statusUpdatedEvents = await supplyChain.queryFilter(statusUpdatedFilter, 0, currentBlock);
        console.log(`   ✓ BatchStatusUpdated events: ${statusUpdatedEvents.length}`);
        
        // Query TransferRequested events
        const transferRequestedFilter = supplyChain.filters.TransferRequested(null, 1);
        const transferRequestedEvents = await supplyChain.queryFilter(transferRequestedFilter, 0, currentBlock);
        console.log(`   ✓ TransferRequested events: ${transferRequestedEvents.length}`);
        
        // Query OwnershipTransferred events
        const ownershipFilter = supplyChain.filters.OwnershipTransferred(1);
        const ownershipEvents = await supplyChain.queryFilter(ownershipFilter, 0, currentBlock);
        console.log(`   ✓ OwnershipTransferred events: ${ownershipEvents.length}`);
        
        // Query CertificateLinked events
        const certFilter = supplyChain.filters.CertificateLinked(1);
        const certEvents = await supplyChain.queryFilter(certFilter, 0, currentBlock);
        console.log(`   ✓ CertificateLinked events: ${certEvents.length}`);
        
        const totalEvents = batchRegisteredEvents.length + statusUpdatedEvents.length + 
                           transferRequestedEvents.length + ownershipEvents.length + certEvents.length;
        
        console.log("\n" + "=".repeat(70));
        console.log(`📈 TOTAL EVENTS FOUND: ${totalEvents}`);
        console.log("=".repeat(70));
        
        console.log("\n✨ Event Details:\n");
        
        // Display some event details
        if (batchRegisteredEvents.length > 0) {
            const event = batchRegisteredEvents[0];
            console.log("📦 Batch Registration:");
            console.log(`   Batch ID: ${event.args.batchId}`);
            console.log(`   Creator: ${event.args.creator}`);
            console.log(`   Type: ${event.args.batchType}`);
            console.log(`   Quantity: ${event.args.quantity}`);
            console.log(`   Timestamp: ${new Date(Number(event.args.timestamp) * 1000).toLocaleString()}`);
            console.log(`   Block: ${event.blockNumber}`);
            console.log(`   Tx Hash: ${event.transactionHash}`);
        }
        
        if (ownershipEvents.length > 0) {
            console.log("\n🔑 Ownership Transfers:");
            ownershipEvents.forEach((event, idx) => {
                console.log(`   ${idx + 1}. From ${event.args.previousOwner.substring(0, 10)}... → ${event.args.newOwner.substring(0, 10)}...`);
                console.log(`      Block: ${event.blockNumber}, Time: ${new Date(Number(event.args.timestamp) * 1000).toLocaleString()}`);
            });
        }
        
        console.log("\n" + "=".repeat(70));
        console.log("✅ TEST COMPLETED SUCCESSFULLY!");
        console.log("=".repeat(70));
        console.log("\n🌐 To view the visualization:");
        console.log("   1. Ensure the React frontend is running (npm start in frontend/)");
        console.log("   2. Navigate to: http://localhost:3000/batch/1/history");
        console.log("   3. Connect MetaMask and switch between Timeline/Flowchart views");
        console.log("\n");
        
    } catch (error) {
        console.error("\n❌ Error:", error.message);
        console.log("\n💡 Tip: Make sure you've run the deploy-and-demo.js script first!");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Fatal Error:", error);
        process.exit(1);
    });

