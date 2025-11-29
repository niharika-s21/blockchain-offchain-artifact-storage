const { ethers } = require("hardhat");

/**
 * Manual Event Query Test
 * Run this to test individual event queries
 */

async function main() {
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const BATCH_ID = 1;
    
    console.log("\n🔍 MANUAL EVENT QUERY TEST\n");
    console.log("Contract:", CONTRACT_ADDRESS);
    console.log("Batch ID:", BATCH_ID);
    console.log("=".repeat(70));
    
    // Get contract
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const contract = SupplyChain.attach(CONTRACT_ADDRESS);
    
    const currentBlock = await ethers.provider.getBlockNumber();
    console.log("\nCurrent Block:", currentBlock);
    
    // Test 1: Query BatchRegistered events
    console.log("\n📦 TEST 1: BatchRegistered Events");
    console.log("-".repeat(70));
    const filter1 = contract.filters.BatchRegistered(BATCH_ID);
    const events1 = await contract.queryFilter(filter1, 0, currentBlock);
    console.log(`Found ${events1.length} events`);
    
    events1.forEach((event, idx) => {
        console.log(`\nEvent ${idx + 1}:`);
        console.log("  Batch ID:", event.args.batchId.toString());
        console.log("  Creator:", event.args.creator);
        console.log("  Batch Type:", event.args.batchType);
        console.log("  Quantity:", event.args.quantity.toString());
        console.log("  Block:", event.blockNumber);
        console.log("  Tx Hash:", event.transactionHash);
    });
    
    // Test 2: Query BatchStatusUpdated events
    console.log("\n\n🔄 TEST 2: BatchStatusUpdated Events");
    console.log("-".repeat(70));
    const filter2 = contract.filters.BatchStatusUpdated(BATCH_ID);
    const events2 = await contract.queryFilter(filter2, 0, currentBlock);
    console.log(`Found ${events2.length} events`);
    
    const statusNames = ['Created', 'InTransit', 'Delivered', 'QualityTested', 'Approved', 'Rejected', 'Consumed'];
    events2.forEach((event, idx) => {
        console.log(`\nEvent ${idx + 1}:`);
        console.log("  New Status:", statusNames[event.args.newStatus]);
        console.log("  Updated By:", event.args.updatedBy);
        console.log("  Block:", event.blockNumber);
    });
    
    // Test 3: Query Transfer events
    console.log("\n\n📤 TEST 3: TransferRequested Events");
    console.log("-".repeat(70));
    const filter3 = contract.filters.TransferRequested(null, BATCH_ID);
    const events3 = await contract.queryFilter(filter3, 0, currentBlock);
    console.log(`Found ${events3.length} events`);
    
    events3.forEach((event, idx) => {
        console.log(`\nEvent ${idx + 1}:`);
        console.log("  Request ID:", event.args.requestId.toString());
        console.log("  From:", event.args.from);
        console.log("  To:", event.args.to);
        console.log("  Reason:", event.args.reason);
        console.log("  Block:", event.blockNumber);
    });
    
    // Test 4: Query OwnershipTransferred events
    console.log("\n\n🔑 TEST 4: OwnershipTransferred Events");
    console.log("-".repeat(70));
    const filter4 = contract.filters.OwnershipTransferred(BATCH_ID);
    const events4 = await contract.queryFilter(filter4, 0, currentBlock);
    console.log(`Found ${events4.length} events`);
    
    events4.forEach((event, idx) => {
        console.log(`\nEvent ${idx + 1}:`);
        console.log("  Previous Owner:", event.args.previousOwner);
        console.log("  New Owner:", event.args.newOwner);
        console.log("  Block:", event.blockNumber);
        console.log("  Timestamp:", new Date(Number(event.args.timestamp) * 1000).toLocaleString());
    });
    
    // Test 5: Query all events (any type)
    console.log("\n\n📋 TEST 5: All Events Combined");
    console.log("-".repeat(70));
    const allEvents = [
        ...events1.map(e => ({ type: 'BatchRegistered', block: e.blockNumber, event: e })),
        ...events2.map(e => ({ type: 'BatchStatusUpdated', block: e.blockNumber, event: e })),
        ...events3.map(e => ({ type: 'TransferRequested', block: e.blockNumber, event: e })),
        ...events4.map(e => ({ type: 'OwnershipTransferred', block: e.blockNumber, event: e }))
    ];
    
    // Sort by block number
    allEvents.sort((a, b) => a.block - b.block);
    
    console.log(`Total events: ${allEvents.length}`);
    console.log("\nChronological order:");
    allEvents.forEach((item, idx) => {
        console.log(`  ${idx + 1}. Block #${item.block}: ${item.type}`);
    });
    
    // Summary
    console.log("\n" + "=".repeat(70));
    console.log("📊 SUMMARY");
    console.log("=".repeat(70));
    console.log(`BatchRegistered: ${events1.length}`);
    console.log(`BatchStatusUpdated: ${events2.length}`);
    console.log(`TransferRequested: ${events3.length}`);
    console.log(`OwnershipTransferred: ${events4.length}`);
    console.log(`Total: ${allEvents.length}`);
    console.log("\n✅ ALL QUERY TESTS PASSED!\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });

