# 1. Install Node.js (if not already installed)
# Visit https://nodejs.org/ or use brew on macOS:
brew install node

# 2. Initialize the project
npm init -y

# 3. Install Hardhat and core dependencies
npm install --save-dev hardhat@^2.27.0 @nomicfoundation/hardhat-toolbox

# 4. Install additional blockchain dependencies
npm install --save-dev @openzeppelin/contracts dotenv
npm install --save-dev @openzeppelin/contracts dotenv

# 5. Install frontend dependencies (for later)
npm install --save react react-dom ethers web3modal

# 6. Initialize Hardhat project
npx hardhat init