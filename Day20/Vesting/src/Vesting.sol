// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Vesting
 * @dev A token vesting contract with cliff and linear release
 * 
 * Vesting Schedule:
 * - Cliff: 12 months (no tokens can be released during this period)
 * - Linear Release: 24 months (1/24 of tokens released each month)
 * - Total Vesting Period: 36 months
 */
contract Vesting {
    using SafeERC20 for IERC20;

    // Events
    event TokensReleased(address indexed beneficiary, uint256 amount);

    // State variables
    address public immutable beneficiary;
    IERC20 public immutable token;
    uint256 public immutable startTime;
    uint256 public immutable totalAmount;
    uint256 public released;

    // Constants
    uint256 public constant MONTH_DURATION = 30 days;
    uint256 public constant CLIFF_DURATION = 12 * MONTH_DURATION; // 12 months
    uint256 public constant VESTING_DURATION = 24 * MONTH_DURATION; // 24 months
    uint256 public constant VESTING_MONTHS = 24;

    /**
     * @dev Constructor sets up the vesting schedule
     * @param _beneficiary Address that will receive vested tokens
     * @param _token Address of the ERC20 token being vested
     * @param _totalAmount Total amount of tokens to be vested
     */
    constructor(address _beneficiary, address _token, uint256 _totalAmount) {
        require(_beneficiary != address(0), "Vesting: beneficiary is zero address");
        require(_token != address(0), "Vesting: token is zero address");
        require(_totalAmount > 0, "Vesting: total amount is zero");

        beneficiary = _beneficiary;
        token = IERC20(_token);
        totalAmount = _totalAmount;
        startTime = block.timestamp;
    }

    /**
     * @dev Calculate the total amount of tokens that have vested up to the current time
     * @return The total vested amount
     */
    function vestedAmount() public view returns (uint256) {
        uint256 currentTime = block.timestamp;
        
        // Before cliff ends, nothing is vested
        if (currentTime < startTime + CLIFF_DURATION) {
            return 0;
        }
        
        // After full vesting period, everything is vested
        if (currentTime >= startTime + CLIFF_DURATION + VESTING_DURATION) {
            return totalAmount;
        }
        
        // During linear vesting: calculate months since cliff ended
        // Month 13 (first month after cliff) = 1/24 vested
        // Month 14 = 2/24 vested, etc.
        uint256 timeAfterCliff = currentTime - startTime - CLIFF_DURATION;
        uint256 monthsVested = (timeAfterCliff / MONTH_DURATION) + 1;
        
        // Cap at 24 months
        if (monthsVested > VESTING_MONTHS) {
            monthsVested = VESTING_MONTHS;
        }
        
        return (totalAmount * monthsVested) / VESTING_MONTHS;
    }

    /**
     * @dev Calculate the amount of tokens currently available for release
     * @return The releasable amount
     */
    function releasable() public view returns (uint256) {
        return vestedAmount() - released;
    }

    /**
     * @dev Release vested tokens to the beneficiary
     * Reverts if there are no tokens to release
     */
    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "Vesting: no tokens to release");
        
        released += amount;
        token.safeTransfer(beneficiary, amount);
        
        emit TokensReleased(beneficiary, amount);
    }

    /**
     * @dev Get the remaining time until cliff ends
     * @return Time in seconds until cliff ends, 0 if cliff has ended
     */
    function getCliffEndTime() external view returns (uint256) {
        return startTime + CLIFF_DURATION;
    }

    /**
     * @dev Get the end time of the entire vesting period
     * @return Time when all tokens will be fully vested
     */
    function getVestingEndTime() external view returns (uint256) {
        return startTime + CLIFF_DURATION + VESTING_DURATION;
    }
}
