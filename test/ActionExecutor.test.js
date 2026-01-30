const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ActionExecutor", function () {
    let actionExecutor;
    let owner;
    let addr1;
    let addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const ActionExecutor = await ethers.getContractFactory("ActionExecutor");
        actionExecutor = await ActionExecutor.deploy();
        await actionExecutor.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await actionExecutor.owner()).to.equal(owner.address);
        });

        it("Should initialize actionCount to 0", async function () {
            expect(await actionExecutor.actionCount()).to.equal(0);
        });
    });

    describe("performAction", function () {
        it("Should increment actionCount when called", async function () {
            await actionExecutor.performAction();
            expect(await actionExecutor.actionCount()).to.equal(1);

            await actionExecutor.performAction();
            expect(await actionExecutor.actionCount()).to.equal(2);
        });

        it("Should emit ActionPerformed event with correct parameters", async function () {
            await expect(actionExecutor.performAction())
                .to.emit(actionExecutor, "ActionPerformed")
                .withArgs(owner.address, 1);
        });

        it("Should allow any address to call performAction", async function () {
            await actionExecutor.connect(addr1).performAction();
            expect(await actionExecutor.actionCount()).to.equal(1);

            await actionExecutor.connect(addr2).performAction();
            expect(await actionExecutor.actionCount()).to.equal(2);
        });

        it("Should handle multiple consecutive calls correctly", async function () {
            const numCalls = 10;

            for (let i = 0; i < numCalls; i++) {
                await actionExecutor.performAction();
            }

            expect(await actionExecutor.actionCount()).to.equal(numCalls);
        });

        it("Should emit events with different callers", async function () {
            await expect(actionExecutor.connect(addr1).performAction())
                .to.emit(actionExecutor, "ActionPerformed")
                .withArgs(addr1.address, 1);

            await expect(actionExecutor.connect(addr2).performAction())
                .to.emit(actionExecutor, "ActionPerformed")
                .withArgs(addr2.address, 2);
        });
    });

    describe("Gas Optimization", function () {
        it("Should use minimal gas for performAction", async function () {
            const tx = await actionExecutor.performAction();
            const receipt = await tx.wait();

            // Gas should be reasonable (less than 50,000)
            expect(receipt.gasUsed).to.be.lessThan(50000);
            console.log("      Gas used for performAction:", receipt.gasUsed.toString());
        });
    });
});
