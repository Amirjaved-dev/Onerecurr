// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ActionExecutor
 * @author One Recurr Team
 * @notice A minimal, publicly accessible action counter for EIP-7702 testing on Sepolia
 * @dev This contract serves as a controlled target for initial EIP-7702 delegated execution tests.
 *      The performAction function is intentionally unrestricted to allow flexible testing scenarios.
 *      In production environments, consider access control based on your specific requirements.
 */
contract ActionExecutor is Ownable {
    
    /// @notice Tracks the total number of actions performed
    /// @dev Incremented by one each time performAction is called
    uint256 public actionCount;

    /**
     * @notice Emitted when an action is successfully performed
     * @param caller The address that triggered the action
     * @param newCount The updated action count after incrementing
     */
    event ActionPerformed(address indexed caller, uint256 newCount);

    /**
     * @notice Initializes the contract and sets the deployer as the owner
     * @dev Calls the Ownable constructor to establish ownership
     */
    constructor() Ownable(msg.sender) {
        // actionCount initialized to 0 by default
    }

    /**
     * @notice Increments the action counter by one
     * @dev This function is publicly callable (no access restrictions) to facilitate
     *      comprehensive EIP-7702 testing scenarios. Gas-optimized using unchecked arithmetic
     *      since overflow is virtually impossible within practical constraints.
     * @custom:security-note While publicly accessible for testing, monitor for spam in production
     */
    function performAction() external {
        unchecked {
            ++actionCount;
        }
        emit ActionPerformed(msg.sender, actionCount);
    }
}
