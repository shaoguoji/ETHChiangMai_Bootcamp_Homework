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
import {Permit2} from "./Permit2.sol";

contract TokenBankPermit2 is TokenBank {
    HookERC20 private erc20Token;
    Permit2 public permit2;

    event logHookReceived(
        address indexed _from,
        uint256 indexed value,
        bytes data
    );

    constructor(address tokenAddr, address permit2Addr) TokenBank(tokenAddr) {
        erc20Token = HookERC20(tokenAddr);
        permit2 = Permit2(permit2Addr);
    }

    function tokensReceived(
        address _from,
        uint256 _value,
        bytes memory _data
    ) public {
        require(
            msg.sender == address(erc20Token),
            "only be called by token contract"
        );
        amount[_from] += _value;
        emit logHookReceived(_from, _value, _data);
    }

    function depositWithPermit2(
        uint256 _amount,
        uint256 _nonce,
        uint256 _deadline,
        bytes calldata _signature
    ) public {
        permit2.permitTransferFrom(
            Permit2.PermitTransferFrom({
                permitted: Permit2.TokenPermissions({
                    token: address(erc20Token),
                    amount: _amount
                }),
                nonce: _nonce,
                deadline: _deadline
            }),
            Permit2.TransferDetails({
                to: address(this),
                requestedAmount: _amount
            }),
            msg.sender,
            _signature
        );
        amount[msg.sender] += _amount;
    }

    function amountsOf(address _user) public view returns (uint256) {
        return amount[_user];
    }
}
