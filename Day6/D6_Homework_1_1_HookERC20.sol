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

import { BaseERC20 } from "../Day5/D5_homework_3_erc20.sol";

interface ITokensReceivedCallback {
    function tokensReceived(address from, uint256 value, bytes memory data) external;
}

contract HookERC20 is BaseERC20{

    constructor() {
        name = "HookERC20";
        symbol = "HERC20";
        decimals = 18;
        totalSupply = 1e8*1e18;
    }

    function transferWithCallback(address _to, uint256 _value, bytes memory data) public returns (bool success) {
        require (transfer(_to, _value), "transfer failed");
        if (_to.code.length > 0) {
            ITokensReceivedCallback(_to).tokensReceived(msg.sender, _value, data);
        }
        return true;
    }
}