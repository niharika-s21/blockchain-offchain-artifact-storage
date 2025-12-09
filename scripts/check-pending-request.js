const { ethers } = require("hardhat");

async function main() {
    console.log("=".repeat(70));
    console.log("CHECKING PENDING REQUEST - BATCH #1");
    console.log("=".repeat(70));
    
    const CONTRACT_ADDRESS = "0xa0398D83e2AEe3CF9b4CCeC19390Ca16B64499FA";
    const BATCH_ID = 1;
    
    // Get contract instance
    const SupplyChain = await ethers.getContractAt("SupplyChain", CONTRACT_ADDRESS);
    
    console.log("\n📦 Contract:", CONTRACT_ADDRESS);
    console.log("🔢 Batch ID:", BATCH_ID);
    
    // Get batch details
    console.log("\n" + "=".repeat(70));
    console.log("BATCH DETAILS");
    console.log("=".repeat(70));
    
    const batch = await SupplyChain.getBatchDetails(BATCH_ID);
    console.log("Current Owner:", batch.currentOwner);
    console.log("Pending Owner:", batch.pendingOwner);
    console.log("Status:", batch.status);
    
    // Check activePendingRequests mapping
    console.log("\n" + "=".repeat(70));
    console.log("ACTIVE PENDING REQUESTS MAPPING");
    console.log("=".repeat(70));
    
    try {
        const requestId = await SupplyChain.activePendingRequests(BATCH_ID);
        console.log("✅ Request ID from mapping:", requestId.toString());
        
        if (requestId > 0) {
            console.log("\n📋 TRANSFER REQUEST DETAILS");
            console.log("=".repeat(70));
            
            try {
                const request = await SupplyChain.getActivePendingRequest(BATCH_ID);
                console.log("Request ID:", requestId.toString());
                console.log("From:", request.from);
                console.log("To:", request.to);
                console.log("Batch ID:", request.batchId.toString());
                console.log("Reason:", request.reason);
                console.log("Transport Details:", request.transportDetails);
                console.log("Requested At:", new Date(Number(request.requestedAt) * 1000).toLocaleString());
                console.log("Is Active:", request.isActive);
                
                console.log("\n✅ DIAGNOSIS: Request exists in blockchain");
                console.log("   The frontend should be able to load this request.");
                
            } catch (err) {
                console.log("\n❌ ERROR calling getActivePendingRequest():");
                console.log("   Message:", err.message);
                console.log("   This means the contract function is failing.");
            }
            
        } else {
            console.log("\n❌ DIAGNOSIS: Request ID is 0");
            console.log("   This means no active request exists in the mapping.");
            console.log("   But batch has pendingOwner set - this is inconsistent!");
            console.log("\n🔍 POSSIBLE CAUSES:");
            console.log("   1. The transfer was accepted/rejected and mapping was cleared");
            console.log("   2. The pendingOwner wasn't cleared after transfer completion");
            console.log("   3. Contract state is inconsistent");
        }
        
    } catch (err) {
        console.log("\n❌ ERROR reading activePendingRequests mapping:");
        console.log("   Message:", err.message);
    }
    
    // Try to get transfer request counter
    console.log("\n" + "=".repeat(70));
    console.log("TRANSFER REQUEST COUNTER");
    console.log("=".repeat(70));
    
    try {
        const counter = await SupplyChain.transferRequestCounter();
        console.log("Total transfer requests created:", counter.toString());
    } catch (err) {
        console.log("Error:", err.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ SCRIPT FAILED!");
        console.error(error);
        process.exit(1);
    });
