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

contract HookERC20 {
    string public name; 
    string public symbol; 
    uint8 public decimals; 

    uint256 public totalSupply; 

    mapping (address => uint256) balances; 

    mapping (address => mapping (address => uint256)) allowances; 

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor() {
        // write your code here
        // set name,symbol,decimals,totalSupply
        name = "BaseERC20";
        symbol = "BERC20";
        decimals = 18;
        totalSupply = 1e8*1e18;

        balances[msg.sender] = totalSupply;  
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        // write your code here
        require(_owner != address(0), "zero adress");
        return balances[_owner];
    }

    function transferWithCallback(address _to, uint256 _value) public returns (bool success) {
        require (transfer(_to, _value), "transfer failed");
        if (_to.code.length > 0) {
            (bool ok,) = _to.call(abi.encodeWithSignature("tokensReceived(address,uint256)", msg.sender, _value));
            require(ok, "hook callback failed");
        }
        return true;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        // write your code here
        require(_to != address(0), "zero address");
        require(balances[msg.sender] > 0, "no money");
        require(balances[msg.sender] >= _value, "ERC20: transfer amount exceeds balance");

        balances[msg.sender] -= _value;
        balances[_to] += _value;

        emit Transfer(msg.sender, _to, _value);  
        return true;   
    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        // write your code here
        require(_from != address(0));
        require(_to != address(0));
        require(balances[_from] >= _value, "ERC20: transfer amount exceeds balance");
        require(allowances[_from][msg.sender] >= _value, "ERC20: transfer amount exceeds allowance");

        allowances[_from][msg.sender] -= _value;
        balances[_from] -= _value;
        balances[_to] += _value;

        emit Transfer(_from, _to, _value); 
        return true; 
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        // write your code here
        require(_spender != address(0), "zero address");

        allowances[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value); 
        return true; 
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining) {   
        // write your code here
        require(_owner != address(0));
        require(_spender != address(0));
        
        return allowances[_owner][_spender];
    }
}