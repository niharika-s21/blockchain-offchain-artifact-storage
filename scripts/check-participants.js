const { ethers } = require("hardhat");

async function main() {
    const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    
    console.log("Checking participants at contract:", CONTRACT_ADDRESS);
    console.log("=".repeat(60));
    
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const contract = SupplyChain.attach(CONTRACT_ADDRESS);
    
    const accounts = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account #0
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906"  // Account #3
    ];
    
    for (let i = 0; i < accounts.length; i++) {
        try {
            const participant = await contract.participants(accounts[i]);
            console.log(`\nAccount #${i} (${accounts[i].slice(0, 10)}...${accounts[i].slice(-4)})`);
            console.log(`  Name: ${participant.name}`);
            console.log(`  Role: ${participant.role}`);
            console.log(`  Active: ${participant.isActive}`);
            console.log(`  Location: ${participant.location}`);
        } catch (error) {
            console.log(`\nAccount #${i}: Error checking - ${error.message}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

