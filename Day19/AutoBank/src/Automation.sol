// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

interface IBank {
    function withDraw(uint256 value, address to) external;
}

contract Automation is AutomationCompatible {
    IBank public bank;
    address public receiver;
    uint256 public withdrawThreshold;

    constructor(address _bank, address _receiver, uint256 _withdrawThreshold) {
        bank = IBank(_bank);
        receiver = _receiver;
        withdrawThreshold = _withdrawThreshold;
    }
    
    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = (address(bank).balance >= withdrawThreshold);
        performData = "";
    }

    function performUpkeep(bytes calldata) external override {
        bank.withDraw(address(bank).balance/2, receiver);
    }

    function setWithdrawThreshold(uint256 _threshold) external {
        withdrawThreshold = _threshold;
    }
}