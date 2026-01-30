// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceCheckHook
 * @author One Recurr Team
 * @notice A price validation contract for the Agentic Paymaster concept
 * @dev This contract validates swap prices against acceptable thresholds before allowing
 *      gas sponsorship by a paymaster. It demonstrates intelligent, conditional gas subsidization
 *      based on price fairness, preventing users from getting unfavorable swap rates.
 * 
 * @custom:security-note This is a simplified implementation for demonstration purposes.
 *      In production, integrate with actual oracle price feeds (e.g., Chainlink) and
 *      implement additional validation logic.
 */
contract PriceCheckHook is Ownable {
    
    /// @notice Minimum acceptable price as a percentage of oracle price (basis points: 10000 = 100%)
    /// @dev Default: 9500 = 95% (user cannot sell for less than 95% of fair price)
    uint256 public minPriceThreshold;
    
    /// @notice Maximum acceptable price as a percentage of oracle price (basis points: 10000 = 100%)
    /// @dev Default: 10500 = 105% (user cannot buy for more than 105% of fair price)
    uint256 public maxPriceThreshold;
    
    /// @notice Basis points constant for percentage calculations
    /// @dev 10000 basis points = 100%
    uint256 public constant BASIS_POINTS = 10000;
    
    /**
     * @notice Emitted when a price is validated
     * @param proposedPrice The price proposed by the user's swap
     * @param oraclePrice The reference price from the oracle
     * @param isValid Whether the price passed validation
     * @param withinRange Whether the price is within acceptable thresholds
     */
    event PriceValidated(
        uint256 indexed proposedPrice,
        uint256 indexed oraclePrice,
        bool isValid,
        bool withinRange
    );
    
    /**
     * @notice Emitted when price thresholds are updated
     * @param oldMinThreshold Previous minimum threshold
     * @param oldMaxThreshold Previous maximum threshold
     * @param newMinThreshold New minimum threshold
     * @param newMaxThreshold New maximum threshold
     * @param updatedBy Address that updated the thresholds
     */
    event ThresholdsUpdated(
        uint256 oldMinThreshold,
        uint256 oldMaxThreshold,
        uint256 newMinThreshold,
        uint256 newMaxThreshold,
        address indexed updatedBy
    );
    
    /**
     * @notice Initializes the contract with default price thresholds
     * @dev Sets deployer as owner and establishes default thresholds of 95%-105%
     * @param _minThreshold Minimum acceptable price threshold in basis points (e.g., 9500 for 95%)
     * @param _maxThreshold Maximum acceptable price threshold in basis points (e.g., 10500 for 105%)
     */
    constructor(uint256 _minThreshold, uint256 _maxThreshold) Ownable(msg.sender) {
        require(_minThreshold > 0, "PriceCheckHook: min threshold must be > 0");
        require(_maxThreshold > _minThreshold, "PriceCheckHook: max must be > min");
        require(_maxThreshold <= BASIS_POINTS * 2, "PriceCheckHook: max threshold too high");
        
        minPriceThreshold = _minThreshold;
        maxPriceThreshold = _maxThreshold;
    }
    
    /**
     * @notice Validates if a proposed swap price is within acceptable range
     * @dev Compares the proposed price against oracle price using configured thresholds.
     *      Price is valid if: (oraclePrice * minThreshold / BASIS_POINTS) <= proposedPrice <= (oraclePrice * maxThreshold / BASIS_POINTS)
     * @param proposedPrice The price at which the user wants to execute the swap (in wei or token decimals)
     * @param oraclePrice The reference "fair" price from an oracle (in wei or token decimals)
     * @return isValid True if the price is within acceptable thresholds, false otherwise
     * @custom:example If oracle price is 1000, min=9500, max=10500:
     *                  Valid range is 950-1050. Price of 1020 would be valid, 1100 would be invalid.
     */
    function validateSwapPrice(
        uint256 proposedPrice,
        uint256 oraclePrice
    ) external returns (bool isValid) {
        require(proposedPrice > 0, "PriceCheckHook: proposed price must be > 0");
        require(oraclePrice > 0, "PriceCheckHook: oracle price must be > 0");
        
        // Calculate acceptable price range
        uint256 minAcceptablePrice = (oraclePrice * minPriceThreshold) / BASIS_POINTS;
        uint256 maxAcceptablePrice = (oraclePrice * maxPriceThreshold) / BASIS_POINTS;
        
        // Check if proposed price is within range
        bool withinRange = proposedPrice >= minAcceptablePrice && proposedPrice <= maxAcceptablePrice;
        
        emit PriceValidated(proposedPrice, oraclePrice, withinRange, withinRange);
        
        return withinRange;
    }
    
    /**
     * @notice View function to check price validity without emitting events
     * @dev Similar to validateSwapPrice but doesn't emit events or modify state
     * @param proposedPrice The price to validate
     * @param oraclePrice The reference oracle price
     * @return isValid True if valid, false otherwise
     * @return minAcceptable The minimum acceptable price based on current thresholds
     * @return maxAcceptable The maximum acceptable price based on current thresholds
     */
    function checkPrice(
        uint256 proposedPrice,
        uint256 oraclePrice
    ) external view returns (
        bool isValid,
        uint256 minAcceptable,
        uint256 maxAcceptable
    ) {
        require(proposedPrice > 0, "PriceCheckHook: proposed price must be > 0");
        require(oraclePrice > 0, "PriceCheckHook: oracle price must be > 0");
        
        minAcceptable = (oraclePrice * minPriceThreshold) / BASIS_POINTS;
        maxAcceptable = (oraclePrice * maxPriceThreshold) / BASIS_POINTS;
        isValid = proposedPrice >= minAcceptable && proposedPrice <= maxAcceptable;
        
        return (isValid, minAcceptable, maxAcceptable);
    }
    
    /**
     * @notice Updates the price thresholds (owner only)
     * @dev Allows the contract owner to adjust acceptable price ranges based on market conditions
     * @param _minThreshold New minimum threshold in basis points
     * @param _maxThreshold New maximum threshold in basis points
     * @custom:security Only callable by contract owner
     */
    function setThresholds(uint256 _minThreshold, uint256 _maxThreshold) external onlyOwner {
        require(_minThreshold > 0, "PriceCheckHook: min threshold must be > 0");
        require(_maxThreshold > _minThreshold, "PriceCheckHook: max must be > min");
        require(_maxThreshold <= BASIS_POINTS * 2, "PriceCheckHook: max threshold too high");
        
        uint256 oldMin = minPriceThreshold;
        uint256 oldMax = maxPriceThreshold;
        
        minPriceThreshold = _minThreshold;
        maxPriceThreshold = _maxThreshold;
        
        emit ThresholdsUpdated(oldMin, oldMax, _minThreshold, _maxThreshold, msg.sender);
    }
    
    /**
     * @notice Returns the current threshold configuration
     * @dev Helper function to retrieve both thresholds in a single call
     * @return min The current minimum threshold in basis points
     * @return max The current maximum threshold in basis points
     */
    function getThresholds() external view returns (uint256 min, uint256 max) {
        return (minPriceThreshold, maxPriceThreshold);
    }
}
