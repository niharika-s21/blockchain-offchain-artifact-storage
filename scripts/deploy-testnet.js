const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

/**
 * Testnet Deployment Script
 * Deploys SupplyChain contract to public testnet (Sepolia/Mumbai)
 */

async function main() {
    console.log("=".repeat(70));
    console.log("TESTNET DEPLOYMENT - SUPPLY CHAIN SMART CONTRACT");
    console.log("=".repeat(70));
    
    // Get network info
    const network = await ethers.provider.getNetwork();
    const networkName = network.name === "unknown" ? "sepolia" : network.name;
    console.log("\n📡 Network Information:");
    console.log("   Network:", networkName);
    console.log("   Chain ID:", network.chainId.toString());
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    
    console.log("\n👤 Deployer Account:");
    console.log("   Address:", deployer.address);
    console.log("   Balance:", ethers.formatEther(balance), "ETH");
    
    // Check if deployer has enough balance
    if (balance === 0n) {
        console.log("\n❌ ERROR: Deployer account has no balance!");
        console.log("💡 Get testnet ETH from:");
        console.log("   Sepolia: https://sepoliafaucet.com/");
        console.log("   Mumbai: https://faucet.polygon.technology/");
        process.exit(1);
    }
    
    console.log("\n📦 Deploying SupplyChain Contract...");
    console.log("-".repeat(70));
    
    // Deploy the contract with default network gas settings
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    
    console.log("   Compiling contract...");
    console.log("   Using network default gas price...");
    
    const supplyChain = await SupplyChain.deploy();
    
    console.log("   Waiting for deployment transaction...");
    await supplyChain.waitForDeployment();
    
    const contractAddress = await supplyChain.getAddress();
    const deploymentTx = supplyChain.deploymentTransaction();
    
    console.log("\n✅ CONTRACT DEPLOYED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("\n📍 Deployment Details:");
    console.log("   Contract Address:", contractAddress);
    console.log("   Transaction Hash:", deploymentTx.hash);
    console.log("   Block Number:", deploymentTx.blockNumber);
    console.log("   Deployer:", deployer.address);
    console.log("   Gas Used:", deploymentTx.gasLimit.toString());
    
    // Wait for a few block confirmations
    console.log("\n⏳ Waiting for block confirmations...");
    const receipt = await deploymentTx.wait(3); // Wait for 3 confirmations
    console.log(`   ✓ Confirmed in block ${receipt.blockNumber}`);
    
    // Save deployment info
    const deploymentInfo = {
        network: networkName,
        chainId: network.chainId.toString(),
        contractAddress: contractAddress,
        deployer: deployer.address,
        transactionHash: deploymentTx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date().toISOString(),
        gasUsed: receipt.gasUsed.toString(),
    };
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    // Save deployment info to file
    const deploymentFile = path.join(deploymentsDir, `${networkName}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: deployments/${networkName}-deployment.json`);
    
    // Export ABI
    const artifact = await ethers.getContractFactory("SupplyChain");
    const abi = artifact.interface.formatJson();
    const abiFile = path.join(deploymentsDir, `SupplyChain-ABI.json`);
    fs.writeFileSync(abiFile, abi);
    console.log(`💾 Contract ABI saved to: deployments/SupplyChain-ABI.json`);
    
    // Update frontend contract address
    console.log("\n🔧 Updating Frontend Configuration...");
    const frontendContextPath = path.join(__dirname, "..", "frontend", "src", "context", "BlockchainContext.js");
    
    if (fs.existsSync(frontendContextPath)) {
        let contextContent = fs.readFileSync(frontendContextPath, "utf8");
        
        // Update contract address
        const addressRegex = /const CONTRACT_ADDRESS = ["']0x[a-fA-F0-9]{40}["']/;
        const newAddress = `const CONTRACT_ADDRESS = "${contractAddress}"`;
        
        if (addressRegex.test(contextContent)) {
            contextContent = contextContent.replace(addressRegex, newAddress);
            fs.writeFileSync(frontendContextPath, contextContent);
            console.log("   ✓ Frontend contract address updated");
        } else {
            console.log("   ⚠️  Could not auto-update frontend. Manual update required.");
        }
        
        // Copy ABI to frontend
        const frontendAbiPath = path.join(__dirname, "..", "frontend", "src", "contracts", "SupplyChain.json");
        const contractArtifact = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "..", "artifacts", "contracts", "SupplyChain.sol", "SupplyChain.json"),
                "utf8"
            )
        );
        fs.writeFileSync(frontendAbiPath, JSON.stringify(contractArtifact, null, 2));
        console.log("   ✓ Frontend ABI updated");
    } else {
        console.log("   ⚠️  Frontend context file not found");
    }
    
    // Print explorer links
    console.log("\n🔗 Blockchain Explorer Links:");
    if (networkName === "sepolia") {
        console.log("   Contract:", `https://sepolia.etherscan.io/address/${contractAddress}`);
        console.log("   Transaction:", `https://sepolia.etherscan.io/tx/${deploymentTx.hash}`);
    } else if (networkName === "mumbai" || network.chainId === 80001n) {
        console.log("   Contract:", `https://mumbai.polygonscan.com/address/${contractAddress}`);
        console.log("   Transaction:", `https://mumbai.polygonscan.com/tx/${deploymentTx.hash}`);
    }
    
    // Verification instructions
    console.log("\n📝 Next Steps:");
    console.log("=".repeat(70));
    console.log("\n1. Verify Contract on Block Explorer:");
    console.log("   Run: npx hardhat verify --network", networkName, contractAddress);
    
    console.log("\n2. Register Participants:");
    console.log("   Run: npx hardhat run scripts/register-participants.js --network", networkName);
    
    console.log("\n3. Update MetaMask:");
    console.log("   - Switch to", networkName.toUpperCase(), "network");
    console.log("   - Import test accounts if needed");
    
    console.log("\n4. Update Frontend:");
    console.log("   - Contract address has been auto-updated");
    console.log("   - Restart frontend: cd frontend && npm start");
    
    console.log("\n5. Test the Application:");
    console.log("   - Open http://localhost:3000");
    console.log("   - Connect MetaMask to testnet");
    console.log("   - Create and track batches!");
    
    console.log("\n" + "=".repeat(70));
    console.log("✅ TESTNET DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ DEPLOYMENT FAILED!");
        console.error("=".repeat(70));
        console.error("Error:", error.message);
        if (error.message.includes("insufficient funds")) {
            console.log("\n💡 Solution: Get testnet ETH from:");
            console.log("   Sepolia: https://sepoliafaucet.com/");
            console.log("   Mumbai: https://faucet.polygon.technology/");
        }
        console.error();
        process.exit(1);
    });

