const hre = require("hardhat");

async function main() {
    console.log("Deploying ActionExecutor contract to Sepolia...");

    // Get the deployer's address
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Get account balance
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

    // Deploy the contract
    const ActionExecutor = await hre.ethers.getContractFactory("ActionExecutor");
    const actionExecutor = await ActionExecutor.deploy();

    await actionExecutor.waitForDeployment();

    const contractAddress = await actionExecutor.getAddress();
    console.log("ActionExecutor deployed to:", contractAddress);
    console.log("Transaction hash:", actionExecutor.deploymentTransaction().hash);

    // Wait for a few block confirmations before verifying
    console.log("Waiting for block confirmations...");
    await actionExecutor.deploymentTransaction().wait(5);

    // Verify the contract on Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying contract on Etherscan...");
        try {
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [],
            });
            console.log("Contract verified successfully!");
        } catch (error) {
            console.log("Verification failed:", error.message);
        }
    }

    console.log("\nDeployment Summary:");
    console.log("===================");
    console.log("Contract Address:", contractAddress);
    console.log("Owner:", deployer.address);
    console.log("Initial actionCount:", await actionExecutor.actionCount());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
