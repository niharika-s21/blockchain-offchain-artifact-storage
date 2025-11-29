const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Register Participants on Testnet
 * Registers example participants after contract deployment
 */

async function main() {
    console.log("=".repeat(70));
    console.log("PARTICIPANT REGISTRATION - TESTNET");
    console.log("=".repeat(70));
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "sepolia" : network.name;
    
    console.log("\n📡 Network:", networkName);
    console.log("   Chain ID:", network.chainId.toString());
    
    // Load deployment info
    const deploymentFile = path.join(__dirname, "..", "deployments", `${networkName}-deployment.json`);
    
    if (!fs.existsSync(deploymentFile)) {
        console.error("\n❌ ERROR: Deployment file not found!");
        console.error("   Please run deployment script first:");
        console.error(`   npx hardhat run scripts/deploy-testnet.js --network ${networkName}`);
        process.exit(1);
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    const contractAddress = deploymentInfo.contractAddress;
    
    console.log("   Contract:", contractAddress);
    
    // Get signers
    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Deployer:", deployer.address);
    
    // Get contract instance
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = SupplyChain.attach(contractAddress);
    
    console.log("\n👥 Registering Participants...");
    console.log("-".repeat(70));
    
    // For testnet, we'll use the deployer's address for demo purposes
    // In production, you would use actual participant addresses
    
    // You can either:
    // 1. Use hardcoded test addresses
    // 2. Let user input addresses
    // 3. Use addresses from environment variables
    
    // Example participants (you can modify these)
    const participants = [
        {
            address: deployer.address, // Using deployer as Refinery for demo
            role: 1, // Refinery
            name: "Demo Refinery",
            location: "Houston, TX"
        },
        // Add more participants here if you have multiple test accounts
        // {
        //     address: "0x...",
        //     role: 3, // Terminal
        //     name: "Demo Terminal",
        //     location: "New York, NY"
        // },
    ];
    
    console.log(`\n📋 Registering ${participants.length} participant(s)...\n`);
    
    for (const participant of participants) {
        try {
            // Check if already registered
            const existing = await supplyChain.participants(participant.address);
            
            if (existing.isActive) {
                console.log(`⏭️  ${participant.name} already registered (${participant.address})`);
                continue;
            }
            
            // Register participant
            console.log(`📝 Registering: ${participant.name}`);
            console.log(`   Address: ${participant.address}`);
            console.log(`   Role: ${getRoleName(participant.role)}`);
            console.log(`   Location: ${participant.location}`);
            
            const tx = await supplyChain.registerParticipant(
                participant.address,
                participant.role,
                participant.name,
                participant.location
            );
            
            console.log(`   Transaction: ${tx.hash}`);
            console.log(`   Waiting for confirmation...`);
            
            await tx.wait();
            
            console.log(`   ✅ ${participant.name} registered successfully!\n`);
            
        } catch (error) {
            console.error(`   ❌ Failed to register ${participant.name}:`, error.message);
        }
    }
    
    console.log("=".repeat(70));
    console.log("✅ PARTICIPANT REGISTRATION COMPLETED!");
    console.log("=".repeat(70));
    
    console.log("\n📝 Registered Participants:");
    for (const participant of participants) {
        const p = await supplyChain.participants(participant.address);
        if (p.isActive) {
            console.log(`   ✓ ${p.name} - ${getRoleName(p.role)} (${participant.address})`);
        }
    }
    
    console.log("\n💡 Next Steps:");
    console.log("   1. Import participant addresses into MetaMask");
    console.log("   2. Create batches using the registered accounts");
    console.log("   3. Test the full supply chain workflow");
    console.log();
}

function getRoleName(role) {
    const roles = {
        0: 'None',
        1: 'Refinery',
        2: 'Distributor',
        3: 'Terminal',
        4: 'Regulator',
        5: 'Airline'
    };
    return roles[role] || 'Unknown';
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ ERROR:", error.message);
        process.exit(1);
    });

