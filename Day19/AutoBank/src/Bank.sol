// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Bank {
    mapping (address => uint256) userBlance;
    address public admin;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    receive() external payable {
        userBlance[msg.sender] += msg.value;
    }

    function setAdmin(address _admin) public onlyAdmin {
        admin = _admin;
    }

    function withDraw(uint256 value, address to) public onlyAdmin {
        if (address(this).balance >= value) {
            payable(to).transfer(value);
        } else {
            revert("Not enough balance");
        }
    }
}