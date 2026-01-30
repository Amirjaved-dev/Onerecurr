import { ethers } from "hardhat";

async function main() {
    console.log("Starting ActionExecutor deployment...");

    try {
        // 1. Get the deployer's signer
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with the account:", deployer.address);

        // 2. Get the contract factory for ActionExecutor
        // The contract is named "ActionExecutor"
        const ActionExecutorFactory = await ethers.getContractFactory("ActionExecutor");

        // 3. Deploy the contract
        // The constructor does not take any arguments
        console.log("Deploying ActionExecutor...");
        const actionExecutor = await ActionExecutorFactory.deploy();

        // 4. Wait for the deployment to complete
        await actionExecutor.waitForDeployment();

        const contractAddress = await actionExecutor.getAddress();
        console.log(`ActionExecutor initially deployed to: ${contractAddress}`);

        // 5. Wait for at least 2 block confirmations
        // This ensures propagation and reduces the risk of reorgs affecting verification
        console.log("Waiting for 2 block confirmations...");
        const deploymentTx = actionExecutor.deploymentTransaction();

        if (deploymentTx) {
            await deploymentTx.wait(2);
        }

        // 6. Log the final verified address
        console.log("----------------------------------------------------");
        console.log(`ActionExecutor deployed to: ${contractAddress}`);
        console.log("----------------------------------------------------");

    } catch (error) {
        console.error("Deployment failed:");
        console.error(error);
        process.exit(1);
    }
}

// Execute the main function
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
