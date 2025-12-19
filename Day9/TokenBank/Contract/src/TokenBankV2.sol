// https://decert.me/quests/4df553df-fbab-49c8-a05f-83256432c6af

/**
题目#1
扩展 ERC20 合约 ，添加一个有hook 功能的转账函数，如函数名为：transferWithCallback ，在转账时，如果目标地址是合约地址的话，调用目标地址的 tokensReceived() 方法。

继承 TokenBank 编写 TokenBankV2，支持存入扩展的 ERC20 Token，用户可以直接调用 transferWithCallback 将 扩展的 ERC20 Token 存入到 TokenBankV2 中。

（备注：TokenBankV2 需要实现 tokensReceived 来实现存款记录工作）

请贴出代码库链接。
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TokenBank} from "./TokenBank.sol";
import {HookERC20} from "./HookERC20.sol";

contract TokenBankV2 is TokenBank {
    HookERC20 private erc20Token;

    event logHookReceived(address indexed _from, uint256 value);

    constructor(address tokenAddr) TokenBank(tokenAddr) {
        erc20Token = HookERC20(tokenAddr);
    }

    function tokensReceived(address _from, uint256 _value) public {
        require(msg.sender == address(erc20Token), "only be called by token contract");
        amount[_from] += _value;
        emit logHookReceived(_from, _value);
    }

    function amountsOf(address _user) public view returns(uint256) {
        return amount[_user];
    }
}
