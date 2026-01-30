import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("Starting PriceCheckHook deployment...");

    try {
        // 1. Get the deployer's signer
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with the account:", deployer.address);

        // Check deployer balance
        const balance = await ethers.provider.getBalance(deployer.address);
        console.log("Account balance:", ethers.formatEther(balance), "ETH");

        if (balance === 0n) {
            throw new Error("Deployer account has no balance! Please fund the account.");
        }

        // 2. Configure initial thresholds
        // Default: 95% min (9500 basis points), 105% max (10500 basis points)
        const MIN_THRESHOLD = 9500;  // 95%
        const MAX_THRESHOLD = 10500; // 105%

        console.log("Initial Configuration:");
        console.log(`  Min Price Threshold: ${MIN_THRESHOLD / 100}% (${MIN_THRESHOLD} basis points)`);
        console.log(`  Max Price Threshold: ${MAX_THRESHOLD / 100}% (${MAX_THRESHOLD} basis points)`);

        // 3. Get the contract factory
        console.log("\\nGetting PriceCheckHook contract factory...");
        const PriceCheckHookFactory = await ethers.getContractFactory("PriceCheckHook");

        // 4. Deploy the contract
        console.log("Deploying PriceCheckHook...");
        const priceCheckHook = await PriceCheckHookFactory.deploy(
            MIN_THRESHOLD,
            MAX_THRESHOLD
        );

        // 5. Wait for deployment
        await priceCheckHook.waitForDeployment();
        const contractAddress = await priceCheckHook.getAddress();
        console.log(`\\nPriceCheckHook initially deployed to: ${contractAddress}`);

        // 6. Wait for block confirmations
        console.log("Waiting for 2 block confirmations...");
        const deploymentTx = priceCheckHook.deploymentTransaction();

        if (deploymentTx) {
            const receipt = await deploymentTx.wait(2);
            console.log(`Confirmed in block: ${receipt?.blockNumber}`);
        }

        // 7. Verify configuration
        console.log("\\nVerifying deployed contract configuration...");
        const deployedMinThreshold = await priceCheckHook.minPriceThreshold();
        const deployedMaxThreshold = await priceCheckHook.maxPriceThreshold();
        const deployedOwner = await priceCheckHook.owner();

        console.log(`  Min Threshold: ${deployedMinThreshold} (${Number(deployedMinThreshold) / 100}%)`);
        console.log(`  Max Threshold: ${deployedMaxThreshold} (${Number(deployedMaxThreshold) / 100}%)`);
        console.log(`  Owner: ${deployedOwner}`);

        // 8. Update deployments.json
        console.log("\\nUpdating deployments.json...");
        const deploymentsPath = path.join(__dirname, "..", "deployments.json");

        let deployments: any = {};
        if (fs.existsSync(deploymentsPath)) {
            const fileContent = fs.readFileSync(deploymentsPath, "utf-8");
            deployments = JSON.parse(fileContent);
        }

        if (!deployments.sepolia) {
            deployments.sepolia = {};
        }

        deployments.sepolia.PriceCheckHook = contractAddress;
        deployments.sepolia.PriceCheckHook_deployedAt = new Date().toISOString();
        deployments.sepolia.PriceCheckHook_config = {
            minThreshold: MIN_THRESHOLD,
            maxThreshold: MAX_THRESHOLD
        };

        fs.writeFileSync(
            deploymentsPath,
            JSON.stringify(deployments, null, 2)
        );
        console.log("✅ deployments.json updated");

        // 9. Final summary
        console.log("\\n" + "=".repeat(60));
        console.log("🎉 DEPLOYMENT SUCCESSFUL!");
        console.log("=".repeat(60));
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Network: Sepolia`);
        console.log(`Deployer: ${deployer.address}`);
        console.log(`Min Threshold: ${MIN_THRESHOLD / 100}%`);
        console.log(`Max Threshold: ${MAX_THRESHOLD / 100}%`);
        console.log("=".repeat(60));
        console.log("\\n📝 Next Steps:");
        console.log(`1. Verify on Etherscan:`);
        console.log(`   npx hardhat verify --network sepolia ${contractAddress} ${MIN_THRESHOLD} ${MAX_THRESHOLD}`);
        console.log(`\\n2. Update frontend .env:`);
        console.log(`   VITE_PRICE_CHECK_HOOK_ADDRESS=${contractAddress}`);
        console.log("=".repeat(60));

    } catch (error) {
        console.error("\\n❌ Deployment failed:");
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
