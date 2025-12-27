// https://decert.me/quests/eeb9f7d8-6fd0-4c38-b09c-75a29bd53af3

/** 
题目#1
编写一个 TokenBank 合约，可以将自己的 Token 存入到 TokenBank， 和从 TokenBank 取出。

TokenBank 有两个方法：

deposit() : 需要记录每个地址的存入数量；
withdraw（）: 用户可以提取自己的之前存入的 token。
在回答框内输入你的代码或者 github 链接。
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseERC20} from "./BaseERC20.sol";

contract TokenBank {
    BaseERC20 private erc20Token;
    mapping (address => uint256) amount;

    constructor(address tokenAddr) {
        erc20Token = BaseERC20(tokenAddr);
    }

    function deposit(uint256 _value) public {
        require(_value > 0, "zero");
        require(erc20Token.balanceOf(msg.sender) >= _value, "insufficient user token");
        bool success = erc20Token.transferFrom(msg.sender, address(this), _value);
        require(success, "deposit failed!");
        amount[msg.sender] += _value;
    }

    function withdraw(uint256 _value) public {
        require(amount[msg.sender] >= _value, "insufficient deposited");
        amount[msg.sender] -= _value;
        bool success = erc20Token.transfer(msg.sender, _value);
        require(success, "withdraw failed!");
    }
}
