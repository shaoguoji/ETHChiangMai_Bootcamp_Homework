// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILendingPool - Lending Pool Interface
 * @notice Simple interface for ETH lending markets (Aave-style)
 */
interface ILendingPool {
    /**
     * @dev Deposit ETH into the lending pool
     */
    function depositETH() external payable;

    /**
     * @dev Withdraw ETH from the lending pool
     * @param amount Amount of ETH to withdraw
     */
    function withdrawETH(uint256 amount) external;

    /**
     * @dev Get the current balance including accrued interest
     * @param account The account to check
     * @return Current balance with interest
     */
    function getBalance(address account) external view returns (uint256);
}
