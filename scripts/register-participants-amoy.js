const { ethers } = require("hardhat");

/**
 * Register Participants Script for Polygon Amoy Testnet
 * Run: npx hardhat run scripts/register-participants-amoy.js --network amoy
 */

async function main() {
    console.log("=".repeat(70));
    console.log("REGISTERING PARTICIPANTS - POLYGON AMOY TESTNET");
    console.log("=".repeat(70));
    
    // Contract address on Amoy
    const CONTRACT_ADDRESS = "0xa0398D83e2AEe3CF9b4CCeC19390Ca16B64499FA";
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Registering participants using account:", deployer.address);
    
    // Get contract instance
    const SupplyChain = await ethers.getContractAt("SupplyChain", CONTRACT_ADDRESS);
    console.log("📄 Contract:", CONTRACT_ADDRESS);
    
    // Check if deployer is contract owner
    const contractOwner = await SupplyChain.contractOwner();
    console.log("🔑 Contract Owner:", contractOwner);
    
    if (contractOwner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log("\n❌ ERROR: You are not the contract owner!");
        console.log("   Current deployer:", deployer.address);
        console.log("   Contract owner:", contractOwner);
        console.log("\n💡 Only the contract owner can register participants.");
        process.exit(1);
    }
    
    console.log("\n✅ You are the contract owner. Proceeding with registration...\n");
    
    // Participants to register
    const participants = [
        {
            address: deployer.address, // Register yourself first
            role: 4, // Regulator (admin role)
            name: "Contract Administrator",
            location: "System"
        },
        {
            address: "0xb6fc74053174be699cdfb6744c90d32107765e1d",
            role: 1, // Refinery
            name: "Refinery",
            location: "Production Facility"
        },
        {
            address: "0x83a161f765e719eba9327798c9ca63e9302a1180",
            role: 5, // Airline
            name: "Delta Airlines",
            location: "Airline Operations"
        },
        {
            address: "0x569219307ec292c3ede10a88ad23151d21c1e562",
            role: 3, // Terminal
            name: "JFK Terminal",
            location: "New York, NY"
        }
    ];
    
    // Role names for display
    const ROLES = {
        0: 'None',
        1: 'Refinery',
        2: 'Distributor',
        3: 'Terminal',
        4: 'Regulator',
        5: 'Airline'
    };
    
    console.log("📋 Participants to register:", participants.length);
    console.log("-".repeat(70));
    
    let registered = 0;
    let skipped = 0;
    
    for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        
        console.log(`\n[${i + 1}/${participants.length}] Registering: ${participant.name}`);
        console.log(`   Address: ${participant.address}`);
        console.log(`   Role: ${ROLES[participant.role]}`);
        console.log(`   Location: ${participant.location}`);
        
        try {
            // Check if already registered
            const existingParticipant = await SupplyChain.participants(participant.address);
            
            if (existingParticipant.isActive) {
                console.log(`   ⚠️  Already registered - Skipping`);
                skipped++;
                continue;
            }
            
            // Register participant
            const tx = await SupplyChain.registerParticipant(
                participant.address,
                participant.role,
                participant.name,
                participant.location
            );
            
            console.log(`   🔄 Transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            console.log(`   ✅ Registered successfully! (Block: ${receipt.blockNumber})`);
            registered++;
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.message.includes("Exists")) {
                console.log(`   💡 Participant already exists`);
                skipped++;
            }
        }
    }
    
    console.log("\n" + "=".repeat(70));
    console.log("REGISTRATION SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Successfully registered: ${registered}`);
    console.log(`⚠️  Skipped (already registered): ${skipped}`);
    console.log(`❌ Failed: ${participants.length - registered - skipped}`);
    
    console.log("\n📝 Next Steps:");
    console.log("=".repeat(70));
    console.log("1. Verify on PolygonScan:");
    console.log(`   https://amoy.polygonscan.com/address/${CONTRACT_ADDRESS}`);
    console.log("\n2. Add more participants:");
    console.log("   Edit this script and add wallet addresses to the 'participants' array");
    console.log("\n3. Start using the frontend:");
    console.log("   cd frontend && npm start");
    console.log("\n4. Connect MetaMask to Polygon Amoy testnet");
    console.log();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ REGISTRATION FAILED!");
        console.error("=".repeat(70));
        console.error("Error:", error.message);
        console.error();
        process.exit(1);
    });
