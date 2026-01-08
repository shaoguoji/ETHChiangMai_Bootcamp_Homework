// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KKToken - Staking Reward Token
 * @notice ERC20 token that can only be minted by the StakingPool contract
 */
contract KKToken is ERC20, Ownable {
    constructor() ERC20("KK Token", "KK") Ownable(msg.sender) {}

    /**
     * @dev Mint KK tokens to an address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
