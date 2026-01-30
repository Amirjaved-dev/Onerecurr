import { ethers } from "hardhat";

// The address of the deployed ActionExecutor on Sepolia
const CONTRACT_ADDRESS = "0x29e26275177A5DD5cc92bE0dF2700D1BE2F9D6BE";

async function main() {
    console.log(`Connecting to ActionExecutor at ${CONTRACT_ADDRESS}...`);

    try {
        // 1. Attach to the deployed contract
        const actionExecutor = await ethers.getContractAt("ActionExecutor", CONTRACT_ADDRESS);

        // 2. Read the current action count
        const initialCount = await actionExecutor.actionCount();
        console.log(`Initial Action Count: ${initialCount.toString()}`);

        // 3. Perform an action
        console.log("Performing action (sending transaction)...");
        const tx = await actionExecutor.performAction();
        console.log(`Transaction sent: ${tx.hash}`);

        // 4. Wait for confirmation
        console.log("Waiting for confirmation...");
        await tx.wait(1); // Wait for 1 confirmation

        // 5. Verify the new count
        const newCount = await actionExecutor.actionCount();
        console.log(`New Action Count: ${newCount.toString()}`);

        if (newCount > initialCount) {
            console.log("✅ Verification Successful: Action count incremented!");
        } else {
            console.error("❌ Verification Failed: Action count did not increment.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Verification script failed:");
        console.error(error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
