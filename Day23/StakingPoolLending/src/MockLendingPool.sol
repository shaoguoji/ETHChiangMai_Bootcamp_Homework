// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ILendingPool.sol";

/**
 * @title MockLendingPool - Simulated Lending Pool for Testing
 * @notice Simulates a lending market with configurable interest rate
 * @dev Interest is calculated based on blocks passed since deposit
 */
contract MockLendingPool is ILendingPool {
    /// @notice Interest rate per block (in basis points, 1 = 0.01%)
    uint256 public interestRatePerBlock;

    /// @notice Depositor info
    struct DepositInfo {
        uint256 principal;       // Original deposit amount
        uint256 lastUpdateBlock; // Last block when interest was calculated
        uint256 accruedInterest; // Accumulated interest
    }

    /// @notice Mapping of depositor address to their deposit info
    mapping(address => DepositInfo) public deposits;

    /// @notice Total ETH deposited in the pool
    uint256 public totalDeposits;

    /// @notice Emitted when ETH is deposited
    event Deposited(address indexed user, uint256 amount);

    /// @notice Emitted when ETH is withdrawn
    event Withdrawn(address indexed user, uint256 amount);

    /**
     * @param _interestRatePerBlock Interest rate per block in basis points (e.g., 10 = 0.1%)
     */
    constructor(uint256 _interestRatePerBlock) {
        interestRatePerBlock = _interestRatePerBlock;
    }

    /**
     * @notice Deposit ETH into the lending pool
     */
    function depositETH() external payable override {
        require(msg.value > 0, "Cannot deposit 0");

        DepositInfo storage deposit = deposits[msg.sender];

        // Calculate and add any accrued interest first
        if (deposit.principal > 0) {
            deposit.accruedInterest += _calculateInterest(msg.sender);
        }

        deposit.principal += msg.value;
        deposit.lastUpdateBlock = block.number;
        totalDeposits += msg.value;

        emit Deposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw ETH from the lending pool
     * @param amount Amount of ETH to withdraw (principal + interest)
     */
    function withdrawETH(uint256 amount) external override {
        uint256 balance = getBalance(msg.sender);
        require(amount > 0, "Cannot withdraw 0");
        require(balance >= amount, "Insufficient balance");

        DepositInfo storage deposit = deposits[msg.sender];

        // Calculate total including interest
        uint256 totalInterest = deposit.accruedInterest + _calculateInterest(msg.sender);

        // First use interest, then principal
        if (amount <= totalInterest) {
            deposit.accruedInterest = totalInterest - amount;
        } else {
            uint256 principalToWithdraw = amount - totalInterest;
            deposit.accruedInterest = 0;
            deposit.principal -= principalToWithdraw;
            totalDeposits -= principalToWithdraw;
        }

        deposit.lastUpdateBlock = block.number;

        // Transfer ETH to user
        (bool success,) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Get the current balance including accrued interest
     * @param account The account to check
     * @return Current balance with interest
     */
    function getBalance(address account) public view override returns (uint256) {
        DepositInfo storage deposit = deposits[account];
        return deposit.principal + deposit.accruedInterest + _calculateInterest(account);
    }

    /**
     * @dev Calculate interest since last update
     * @param account The account to calculate for
     * @return Calculated interest amount
     */
    function _calculateInterest(address account) internal view returns (uint256) {
        DepositInfo storage deposit = deposits[account];
        if (deposit.principal == 0 || deposit.lastUpdateBlock >= block.number) {
            return 0;
        }

        uint256 blocksPassed = block.number - deposit.lastUpdateBlock;
        // interest = principal * rate * blocks / 10000 (basis points)
        return (deposit.principal * interestRatePerBlock * blocksPassed) / 10000;
    }

    /**
     * @notice Set interest rate (for testing)
     * @param _rate New interest rate in basis points
     */
    function setInterestRate(uint256 _rate) external {
        interestRatePerBlock = _rate;
    }

    /// @notice Allow contract to receive ETH (for interest payments)
    receive() external payable {}
}
