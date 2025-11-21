const { ethers } = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    console.log("Checking Batch #2 at contract:", CONTRACT_ADDRESS);
    console.log("=".repeat(60));
    
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const contract = SupplyChain.attach(CONTRACT_ADDRESS);
    
    try {
        const batch = await contract.getBatchDetails(2);
        console.log("\n📦 Batch #2 Information:");
        console.log("   Batch Type:", batch.batchType);
        console.log("   Quantity:", batch.quantity.toString());
        console.log("   Origin:", batch.originLocation);
        console.log("   Creator:", batch.creator);
        console.log("   Current Owner:", batch.currentOwner);
        console.log("   Status:", batch.status.toString());
        
        const ownershipHistory = await contract.getOwnershipHistory(2);
        console.log("\n📜 Ownership History:");
        ownershipHistory.forEach((owner, i) => {
            console.log(`   ${i + 1}. ${owner}`);
        });
        
    } catch (error) {
        console.log("❌ Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

