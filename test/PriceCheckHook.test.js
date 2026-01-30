const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PriceCheckHook", function () {
    let priceCheckHook;
    let owner;
    let addr1;
    let addr2;

    // Default thresholds: 95% min, 105% max
    const DEFAULT_MIN_THRESHOLD = 9500;  // 95% in basis points
    const DEFAULT_MAX_THRESHOLD = 10500; // 105% in basis points
    const BASIS_POINTS = 10000;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();

        const PriceCheckHook = await ethers.getContractFactory("PriceCheckHook");
        priceCheckHook = await PriceCheckHook.deploy(
            DEFAULT_MIN_THRESHOLD,
            DEFAULT_MAX_THRESHOLD
        );
        await priceCheckHook.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct owner", async function () {
            expect(await priceCheckHook.owner()).to.equal(owner.address);
        });

        it("Should initialize with correct thresholds", async function () {
            expect(await priceCheckHook.minPriceThreshold()).to.equal(DEFAULT_MIN_THRESHOLD);
            expect(await priceCheckHook.maxPriceThreshold()).to.equal(DEFAULT_MAX_THRESHOLD);
        });

        it("Should set the correct BASIS_POINTS constant", async function () {
            expect(await priceCheckHook.BASIS_POINTS()).to.equal(BASIS_POINTS);
        });

        it("Should revert if min threshold is 0", async function () {
            const PriceCheckHook = await ethers.getContractFactory("PriceCheckHook");
            await expect(
                PriceCheckHook.deploy(0, DEFAULT_MAX_THRESHOLD)
            ).to.be.revertedWith("PriceCheckHook: min threshold must be > 0");
        });

        it("Should revert if max threshold is less than min", async function () {
            const PriceCheckHook = await ethers.getContractFactory("PriceCheckHook");
            await expect(
                PriceCheckHook.deploy(10000, 9000)
            ).to.be.revertedWith("PriceCheckHook: max must be > min");
        });

        it("Should revert if max threshold is too high", async function () {
            const PriceCheckHook = await ethers.getContractFactory("PriceCheckHook");
            await expect(
                PriceCheckHook.deploy(10000, 25000) // 250% is too high
            ).to.be.revertedWith("PriceCheckHook: max threshold too high");
        });
    });

    describe("validateSwapPrice", function () {
        const ORACLE_PRICE = ethers.parseEther("1"); // 1 ETH as reference price

        it("Should validate price within acceptable range", async function () {
            // Proposed price is 1.0 ETH (100% of oracle) - should be valid
            const proposedPrice = ethers.parseEther("1");
            const isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, ORACLE_PRICE);
            expect(isValid).to.be.true;
        });

        it("Should validate price at lower threshold (95%)", async function () {
            // 0.95 ETH = exactly 95% of oracle price
            const proposedPrice = ethers.parseEther("0.95");
            const isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, ORACLE_PRICE);
            expect(isValid).to.be.true;
        });

        it("Should validate price at upper threshold (105%)", async function () {
            // 1.05 ETH = exactly 105% of oracle price
            const proposedPrice = ethers.parseEther("1.05");
            const isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, ORACLE_PRICE);
            expect(isValid).to.be.true;
        });

        it("Should reject price below minimum threshold", async function () {
            // 0.94 ETH = 94% of oracle price (below 95% min)
            const proposedPrice = ethers.parseEther("0.94");
            const isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, ORACLE_PRICE);
            expect(isValid).to.be.false;
        });

        it("Should reject price above maximum threshold", async function () {
            // 1.06 ETH = 106% of oracle price (above 105% max)
            const proposedPrice = ethers.parseEther("1.06");
            const isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, ORACLE_PRICE);
            expect(isValid).to.be.false;
        });

        it("Should emit PriceValidated event with correct parameters", async function () {
            const proposedPrice = ethers.parseEther("1");
            await expect(priceCheckHook.validateSwapPrice(proposedPrice, ORACLE_PRICE))
                .to.emit(priceCheckHook, "PriceValidated")
                .withArgs(proposedPrice, ORACLE_PRICE, true, true);
        });

        it("Should emit event even when price is invalid", async function () {
            const proposedPrice = ethers.parseEther("1.1"); // 110% - invalid
            await expect(priceCheckHook.validateSwapPrice(proposedPrice, ORACLE_PRICE))
                .to.emit(priceCheckHook, "PriceValidated")
                .withArgs(proposedPrice, ORACLE_PRICE, false, false);
        });

        it("Should revert if proposed price is 0", async function () {
            await expect(
                priceCheckHook.validateSwapPrice(0, ORACLE_PRICE)
            ).to.be.revertedWith("PriceCheckHook: proposed price must be > 0");
        });

        it("Should revert if oracle price is 0", async function () {
            const proposedPrice = ethers.parseEther("1");
            await expect(
                priceCheckHook.validateSwapPrice(proposedPrice, 0)
            ).to.be.revertedWith("PriceCheckHook: oracle price must be > 0");
        });
    });

    describe("checkPrice (view function)", function () {
        const ORACLE_PRICE = ethers.parseEther("1");

        it("Should return correct validity and bounds for valid price", async function () {
            const proposedPrice = ethers.parseEther("1");
            const result = await priceCheckHook.checkPrice(proposedPrice, ORACLE_PRICE);

            expect(result.isValid).to.be.true;
            expect(result.minAcceptable).to.equal(ethers.parseEther("0.95")); // 95%
            expect(result.maxAcceptable).to.equal(ethers.parseEther("1.05")); // 105%
        });

        it("Should return correct validity and bounds for invalid price", async function () {
            const proposedPrice = ethers.parseEther("1.1"); // 110% - invalid
            const result = await priceCheckHook.checkPrice(proposedPrice, ORACLE_PRICE);

            expect(result.isValid).to.be.false;
            expect(result.minAcceptable).to.equal(ethers.parseEther("0.95"));
            expect(result.maxAcceptable).to.equal(ethers.parseEther("1.05"));
        });

        it("Should not emit events (view function)", async function () {
            const proposedPrice = ethers.parseEther("1");
            // View functions don't emit events, so we just verify it doesn't revert
            await expect(priceCheckHook.checkPrice(proposedPrice, ORACLE_PRICE)).to.not.be.reverted;
        });
    });

    describe("setThresholds", function () {
        it("Should allow owner to update thresholds", async function () {
            const newMin = 9000; // 90%
            const newMax = 11000; // 110%

            await priceCheckHook.setThresholds(newMin, newMax);

            expect(await priceCheckHook.minPriceThreshold()).to.equal(newMin);
            expect(await priceCheckHook.maxPriceThreshold()).to.equal(newMax);
        });

        it("Should emit ThresholdsUpdated event", async function () {
            const newMin = 9000;
            const newMax = 11000;

            await expect(priceCheckHook.setThresholds(newMin, newMax))
                .to.emit(priceCheckHook, "ThresholdsUpdated")
                .withArgs(DEFAULT_MIN_THRESHOLD, DEFAULT_MAX_THRESHOLD, newMin, newMax, owner.address);
        });

        it("Should revert if non-owner tries to update", async function () {
            await expect(
                priceCheckHook.connect(addr1).setThresholds(9000, 11000)
            ).to.be.revertedWithCustomError(priceCheckHook, "OwnableUnauthorizedAccount");
        });

        it("Should revert if new min is 0", async function () {
            await expect(
                priceCheckHook.setThresholds(0, 11000)
            ).to.be.revertedWith("PriceCheckHook: min threshold must be > 0");
        });

        it("Should revert if new max is less than min", async function () {
            await expect(
                priceCheckHook.setThresholds(11000, 9000)
            ).to.be.revertedWith("PriceCheckHook: max must be > min");
        });

        it("Should revert if new max is too high", async function () {
            await expect(
                priceCheckHook.setThresholds(10000, 25000)
            ).to.be.revertedWith("PriceCheckHook: max threshold too high");
        });

        it("Should update validation behavior after threshold change", async function () {
            const oraclePrice = ethers.parseEther("1");
            const proposedPrice = ethers.parseEther("0.93"); // 93%

            // Initially invalid (below  95%)
            let isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, oraclePrice);
            expect(isValid).to.be.false;

            // Update thresholds to 90%-110%
            await priceCheckHook.setThresholds(9000, 11000);

            // Now valid (above 90%)
            isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, oraclePrice);
            expect(isValid).to.be.true;
        });
    });

    describe("getThresholds", function () {
        it("Should return current thresholds", async function () {
            const result = await priceCheckHook.getThresholds();
            expect(result.min).to.equal(DEFAULT_MIN_THRESHOLD);
            expect(result.max).to.equal(DEFAULT_MAX_THRESHOLD);
        });

        it("Should return updated thresholds after change", async function () {
            const newMin = 9000;
            const newMax = 11000;

            await priceCheckHook.setThresholds(newMin, newMax);

            const result = await priceCheckHook.getThresholds();
            expect(result.min).to.equal(newMin);
            expect(result.max).to.equal(newMax);
        });
    });

    describe("Edge Cases and Gas Optimization", function () {
        it("Should handle very small oracle prices", async function () {
            const oraclePrice = 1000; // Very small price
            const proposedPrice = 950; // 95%

            const isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, oraclePrice);
            expect(isValid).to.be.true;
        });

        it("Should handle very large prices", async function () {
            const oraclePrice = ethers.parseEther("1000000");
            const proposedPrice = ethers.parseEther("1000000"); // Exact match

            const isValid = await priceCheckHook.validateSwapPrice.staticCall(proposedPrice, oraclePrice);
            expect(isValid).to.be.true;
        });

        it("Should use reasonable gas for validation", async function () {
            const proposedPrice = ethers.parseEther("1");
            const oraclePrice = ethers.parseEther("1");

            const tx = await priceCheckHook.validateSwapPrice(proposedPrice, oraclePrice);
            const receipt = await tx.wait();

            // Validation should be gas-efficient (less than 100,000 gas)
            expect(receipt.gasUsed).to.be.lessThan(100000);
            console.log("      Gas used for validateSwapPrice:", receipt.gasUsed.toString());
        });
    });
});
