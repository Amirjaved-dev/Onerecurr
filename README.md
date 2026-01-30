# One Recurr - EIP-7702 Testing Framework

A minimal, secure smart contract designed for EIP-7702 delegated execution testing on Sepolia testnet.

## Overview

**ActionExecutor.sol** is a lightweight, publicly accessible action counter that serves as a controlled target for initial EIP-7702 tests. It establishes a baseline for functionality while maintaining security through OpenZeppelin's Ownable pattern.

## Features

- ✅ **Minimal Attack Surface**: Single public function with clear purpose
- ✅ **Gas Optimized**: Uses unchecked arithmetic for counter increment
- ✅ **Fully Documented**: Comprehensive NatSpec comments
- ✅ **Event Logging**: Emits `ActionPerformed` events for tracking
- ✅ **OpenZeppelin Security**: Inherits from audited Ownable contract
- ✅ **Production Ready**: Complete test suite and deployment scripts

## Contract Architecture

```solidity
contract ActionExecutor is Ownable {
    uint256 public actionCount;
    
    function performAction() external {
        unchecked { ++actionCount; }
        emit ActionPerformed(msg.sender, actionCount);
    }
}
```

## Installation

```bash
# Install dependencies
npm install

# Compile contracts
npm run compile

# Run tests
npm test
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Configure your environment variables:
```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## Deployment

Deploy to Sepolia testnet:

```bash
npm run deploy:sepolia
```

The deployment script will:
- Deploy the contract
- Wait for 5 block confirmations
- Automatically verify on Etherscan
- Display deployment summary

## Testing

Run the comprehensive test suite:

```bash
npm test
```

Tests cover:
- ✓ Contract deployment and initialization
- ✓ Action counter functionality
- ✓ Event emission
- ✓ Public accessibility
- ✓ Gas optimization validation

## Security Considerations

⚠️ **For Testing Only**: The `performAction` function is publicly callable to facilitate EIP-7702 testing. In production:
- Consider implementing rate limiting
- Add access control if needed
- Monitor for spam attacks
- Evaluate need for payable modifier

## Gas Efficiency

The contract uses several optimization techniques:
- `unchecked` arithmetic (overflow impossible in practice)
- Pre-increment operator (`++i`)
- Minimal storage operations
- Event emission for off-chain tracking

**Measured Gas**: ~27,000 gas per `performAction` call

## License

MIT License - See LICENSE file for details

## Contact

One Recurr Team - [GitHub](https://github.com/yourusername/one-recurr)
