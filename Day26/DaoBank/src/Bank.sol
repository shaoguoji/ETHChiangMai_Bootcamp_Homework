// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Bank
 * @dev Simple bank contract with admin-controlled withdrawals
 */
contract Bank {
    address public admin;

    event Deposit(address indexed from, uint256 amount);
    event Withdraw(address indexed to, uint256 amount);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);

    error OnlyAdmin();
    error InsufficientBalance();
    error TransferFailed();

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    constructor(address _admin) {
        admin = _admin;
        emit AdminChanged(address(0), _admin);
    }

    /**
     * @dev Deposit ETH into the bank
     */
    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /**
     * @dev Withdraw ETH from the bank (admin only)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdraw(address to, uint256 amount) external onlyAdmin {
        if (address(this).balance < amount) revert InsufficientBalance();
        
        (bool success,) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Withdraw(to, amount);
    }

    /**
     * @dev Change the admin address (admin only)
     * @param newAdmin New admin address
     */
    function setAdmin(address newAdmin) external onlyAdmin {
        address oldAdmin = admin;
        admin = newAdmin;
        emit AdminChanged(oldAdmin, newAdmin);
    }

    /**
     * @dev Receive ETH
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
