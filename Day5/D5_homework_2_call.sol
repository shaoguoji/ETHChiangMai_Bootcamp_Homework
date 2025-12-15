// https://decert.me/quests/5849ac2d-7a6f-4c94-978c-73c582a575dd

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


/** 
题目#3
staticcall
  
补充完整 Caller 合约的 callGetData 方法，使用 staticcall 调用 Callee 合约中 getData 函数，并返回值。当调用失败时，抛出“staticcall function failed”异常。
*/
contract Callee {
    function getData() public pure returns (uint256) {
        return 42;
    }
}

contract Caller {
    function callGetData(address callee) public view returns (uint256 data) {
        // call by staticcall
        (bool success, bytes memory res) = callee.staticcall(abi.encodeWithSignature("getData()"));
        
        require(success, "staticcall function failed");
        
        data = abi.decode(res, (uint256));

        return data;
    }
}

/**
题目#4
使用 call 方法来发送 Ether
  
补充完整 Caller 合约 的 sendEther 方法，用于向指定地址发送 Ether。要求：

使用 call 方法发送 Ether
如果发送失败，抛出“sendEther failed”异常并回滚交易。
如果发送成功，则返回 true
*/
pragma solidity ^0.8.0;

contract Caller {
    function sendEther(address to, uint256 value) public returns (bool) {
        // 使用 call 发送 ether
        (bool success,) = to.call{value: value}(new bytes(0));

        require(success, "sendEther failed");

        return success;
    }

    receive() external payable {}
}

/** 
题目#5
call 调用函数
  
补充完整 Caller 合约的 callSetValue 方法，用于设置 Callee 合约的 value 值。要求：

使用 call 方法调用用 Callee 的 setValue 方法，并附带 1 Ether
如果发送失败，抛出“call function failed”异常并回滚交易。
如果发送成功，则返回 true
*/
pragma solidity ^0.8.0;

contract Callee {
    uint256 value;

    function getValue() public view returns (uint256) {
        return value;
    }

    function setValue(uint256 value_) public payable {
        require(msg.value > 0);
        value = value_;
    }
}

contract Caller {
    function callSetValue(address callee, uint256 value) public returns (bool) {
        bytes memory payload = abi.encodeCall(Callee.setValue, value);

        // call setValue()
        (bool success,) = callee.call{value: 1 ether}(payload);
        require(success, "call function failed");

        return success;
    }
}

/** 
题目#6
使用 delegatecall 调用函数
  
补充完整 Caller 合约 的 delegateSetValue 方法，调用 Callee 的 setValue 方法用于设置 value 值。要求：

使用 delegatecall
如果发送失败，抛出“delegate call failed”异常并回滚交易。
*/
pragma solidity ^0.8.0;

contract Callee {
    uint256 public value;

    function setValue(uint256 _newValue) public {
        value = _newValue;
    }
}

contract Caller {
    uint256 public value;

    function delegateSetValue(address callee, uint256 _newValue) public {
        // delegatecall setValue()
        bytes memory payload = abi.encodeCall(Callee.setValue, _newValue);

        // call setValue()
        (bool success,) = callee.delegatecall(payload);
        require(success, "delegate call failed");
    }
}

