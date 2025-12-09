const { ethers } = require("hardhat");

/**
 * Debug Transfer Issue on Polygon Amoy
 * This script checks the blockchain state to diagnose transfer acceptance issues
 */

async function main() {
    console.log("=".repeat(80));
    console.log("DEBUGGING TRANSFER ISSUE - POLYGON AMOY");
    console.log("=".repeat(80));
    
    const CONTRACT_ADDRESS = "0xa0398D83e2AEe3CF9b4CCeC19390Ca16B64499FA";
    const BATCH_ID = 1; // From your screenshot
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("\n🔍 Checking from account:", signer.address);
    
    // Connect to contract
    const SupplyChain = await ethers.getContractAt("SupplyChain", CONTRACT_ADDRESS);
    console.log("📄 Contract Address:", CONTRACT_ADDRESS);
    
    // Role names
    const ROLES = ["None", "Refinery", "Distributor", "Terminal", "Regulator", "Airline"];
    const STATUS = ["Created", "InTransit", "Delivered", "QualityTested", "Approved", "Rejected", "Consumed"];
    
    console.log("\n" + "=".repeat(80));
    console.log("BATCH INFORMATION");
    console.log("=".repeat(80));
    
    try {
        const batch = await SupplyChain.batches(BATCH_ID);
        console.log("\n📦 Batch #" + BATCH_ID);
        console.log("   Type:", batch.batchType);
        console.log("   Quantity:", batch.quantity.toString());
        console.log("   Status:", STATUS[batch.status]);
        console.log("   Creator:", batch.creator);
        console.log("   Current Owner:", batch.currentOwner);
        console.log("   Pending Owner:", batch.pendingOwner);
        console.log("   Origin:", batch.originLocation);
        console.log("   Exists:", batch.exists);
        
        // Check if there's a pending transfer
        if (batch.pendingOwner !== ethers.ZeroAddress) {
            console.log("\n⚠️  PENDING TRANSFER DETECTED!");
            console.log("   Transfer to:", batch.pendingOwner);
            
            // Check participant info
            console.log("\n" + "=".repeat(80));
            console.log("PARTICIPANT INFORMATION");
            console.log("=".repeat(80));
            
            // Current owner info
            const currentOwnerInfo = await SupplyChain.participants(batch.currentOwner);
            console.log("\n👤 Current Owner:", batch.currentOwner);
            console.log("   Name:", currentOwnerInfo.name);
            console.log("   Role:", ROLES[currentOwnerInfo.role]);
            console.log("   Active:", currentOwnerInfo.isActive);
            
            // Pending owner info
            const pendingOwnerInfo = await SupplyChain.participants(batch.pendingOwner);
            console.log("\n👤 Pending Owner (Receiver):", batch.pendingOwner);
            console.log("   Name:", pendingOwnerInfo.name);
            console.log("   Role:", ROLES[pendingOwnerInfo.role]);
            console.log("   Active:", pendingOwnerInfo.isActive);
            console.log("   Is Registered:", pendingOwnerInfo.isActive);
            
            // Check if logged-in user matches
            console.log("\n👤 Your Account:", signer.address);
            const yourInfo = await SupplyChain.participants(signer.address);
            console.log("   Name:", yourInfo.name || "NOT REGISTERED");
            console.log("   Role:", ROLES[yourInfo.role]);
            console.log("   Active:", yourInfo.isActive);
            
            // Check if you're the pending owner
            const isPendingOwner = batch.pendingOwner.toLowerCase() === signer.address.toLowerCase();
            console.log("\n🎯 Are you the pending owner?", isPendingOwner ? "YES ✅" : "NO ❌");
            
            if (!isPendingOwner) {
                console.log("\n⚠️  ISSUE FOUND: You are NOT the pending owner!");
                console.log("   Expected:", batch.pendingOwner);
                console.log("   Your address:", signer.address);
                console.log("\n💡 You need to switch to the pending owner's wallet to accept the transfer.");
            }
            
            if (!yourInfo.isActive) {
                console.log("\n⚠️  ISSUE FOUND: Your account is NOT registered as a participant!");
                console.log("💡 The receiver must be registered before they can accept transfers.");
            }
            
            // Find the transfer request
            console.log("\n" + "=".repeat(80));
            console.log("TRANSFER REQUEST SEARCH");
            console.log("=".repeat(80));
            
            let foundRequest = false;
            // Check recent transfer request IDs (try 1-10)
            for (let i = 1; i <= 10; i++) {
                try {
                    const request = await SupplyChain.transferRequests(i);
                    if (request.batchId.toString() === BATCH_ID.toString() && request.isActive) {
                        console.log("\n✅ Found Active Transfer Request #" + i);
                        console.log("   Batch ID:", request.batchId.toString());
                        console.log("   From:", request.from);
                        console.log("   To:", request.to);
                        console.log("   Reason:", request.reason);
                        console.log("   Transport:", request.transportDetails);
                        console.log("   Active:", request.isActive);
                        foundRequest = true;
                    }
                } catch (e) {
                    // Transfer request doesn't exist, continue
                }
            }
            
            if (!foundRequest) {
                console.log("\n⚠️  No active transfer request found in range 1-10");
                console.log("💡 The transfer may have been cancelled or completed");
            }
            
        } else {
            console.log("\n✅ No pending transfer for this batch");
        }
        
        // Check ownership history
        console.log("\n" + "=".repeat(80));
        console.log("OWNERSHIP HISTORY");
        console.log("=".repeat(80));
        
        try {
            const history = await SupplyChain.ownershipHistory(BATCH_ID, 0);
            console.log("\nInitial Owner:", history);
            
            // Try to get more history
            for (let i = 1; i < 5; i++) {
                try {
                    const owner = await SupplyChain.ownershipHistory(BATCH_ID, i);
                    if (owner !== ethers.ZeroAddress) {
                        console.log("Owner " + i + ":", owner);
                    }
                } catch (e) {
                    break;
                }
            }
        } catch (e) {
            console.log("Could not retrieve ownership history");
        }
        
        // Summary
        console.log("\n" + "=".repeat(80));
        console.log("DIAGNOSIS SUMMARY");
        console.log("=".repeat(80));
        
        if (batch.pendingOwner !== ethers.ZeroAddress) {
            const isPendingOwner = batch.pendingOwner.toLowerCase() === signer.address.toLowerCase();
            const receiverInfo = await SupplyChain.participants(batch.pendingOwner);
            
            console.log("\n✓ Transfer is pending");
            console.log("✓ Batch exists:", batch.exists);
            console.log("✓ Current owner:", batch.currentOwner);
            console.log("✓ Pending owner:", batch.pendingOwner);
            console.log("✓ Receiver registered:", receiverInfo.isActive);
            console.log("✓ You are pending owner:", isPendingOwner);
            
            if (!isPendingOwner) {
                console.log("\n❌ ROOT CAUSE: Address mismatch!");
                console.log("   The frontend is connected to:", signer.address);
                console.log("   But transfer is pending to:", batch.pendingOwner);
                console.log("\n🔧 SOLUTION: Switch MetaMask to address:", batch.pendingOwner);
            } else if (!receiverInfo.isActive) {
                console.log("\n❌ ROOT CAUSE: Receiver not registered!");
                console.log("\n🔧 SOLUTION: Register this address first:");
                console.log("   npx hardhat run scripts/register-participants-amoy.js --network amoy");
            } else {
                console.log("\n✅ Everything looks correct!");
                console.log("💡 The accept button should be visible in the frontend.");
                console.log("   If not, check the frontend code for filtering logic.");
            }
        } else {
            console.log("\n✅ No pending transfer - batch is stable");
        }
        
    } catch (error) {
        console.error("\n❌ Error:", error.message);
    }
    
    console.log("\n" + "=".repeat(80));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });
