// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenBank {
    IERC20 public erc20Token;
    mapping(address => uint256) public amount;

    constructor(address tokenAddr) {
        erc20Token = IERC20(tokenAddr);
    }

    function deposit(uint256 _value) public {
        require(_value > 0, "zero");
        bool success = erc20Token.transferFrom(
            msg.sender,
            address(this),
            _value
        );
        require(success, "deposit failed!");
        amount[msg.sender] += _value;
    }

    function permitDeposit(
        uint256 _value,
        uint256 _deadline,
        uint8 _v,
        bytes32 _r,
        bytes32 _s
    ) public {
        require(_value > 0, "zero");
        IERC20Permit(address(erc20Token)).permit(
            msg.sender,
            address(this),
            _value,
            _deadline,
            _v,
            _r,
            _s
        );
        deposit(_value);
    }

    function withdraw(uint256 _value) public {
        require(amount[msg.sender] >= _value, "insufficient deposited");
        amount[msg.sender] -= _value;
        bool success = erc20Token.transfer(msg.sender, _value);
        require(success, "withdraw failed!");
    }
}
