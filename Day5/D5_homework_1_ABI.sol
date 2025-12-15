// https://decert.me/challenge/10c11aa7-2ccd-4bcc-8ccd-56b51f0c12b8

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// #1
contract ABI {
    function transfer(address recipient, uint256 amount) public {
        // TODO
    }

    function getABI() public pure returns(bytes4) {
        return bytes4(abi.encodeWithSignature("transfer(address,uint256)"));
        // return this.transfer.selector;
        // return bytes4(keccak256("transfer(address,uint256)"))
    }
}


// #2
pragma solidity ^0.8.0;

contract ABIEncoder {
    function encodeUint(uint256 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }

    function encodeMultiple(
        uint num,
        string memory text
    ) public pure returns (bytes memory) {
       return abi.encode(num, text);
    }
}

contract ABIDecoder {
    function decodeUint(bytes memory data) public pure returns (uint) {
        return abi.decode(data, (uint));
    }

    function decodeMultiple(
        bytes memory data
    ) public pure returns (uint, string memory) {
        return abi.decode(data, (uint, string));
    }
}


// #3
contract FunctionSelector {
    uint256 private storedValue;

    function getValue() public view returns (uint) {
        return storedValue;
    }

    function setValue(uint value) public {
        storedValue = value;
    }

    function getFunctionSelector1() public pure returns (bytes4) {
        return bytes4(abi.encodeWithSignature("getValue()"));
    }

    function getFunctionSelector2() public pure returns (bytes4) {
        return bytes4(abi.encodeWithSignature("setValue(uint)"));
    }
}

// #4
/**
题目#4
encodeWithSignature、encodeWithSelector 和 encodeCall
  
补充完整getDataByABI，对getData函数签名及参数进行编码，调用成功后解码并返回数据
补充完整setDataByABI1，使用abi.encodeWithSignature()编码调用setData函数，确保调用能够成功
补充完整setDataByABI2，使用abi.encodeWithSelector()编码调用setData函数，确保调用能够成功
补充完整setDataByABI3，使用abi.encodeCall()编码调用setData函数，确保调用能够成功
*/
contract DataStorage {
    string private data;

    function setData(string memory newData) public {
        data = newData;
    }

    function getData() public view returns (string memory) {
        return data;
    }
}

contract DataConsumer {
    address private dataStorageAddress;

    constructor(address _dataStorageAddress) {
        dataStorageAddress = _dataStorageAddress;
    }

    function getDataByABI() public returns (string memory) {
        // payload
        bytes memory payload = abi.encode(bytes4(keccak256("getData()")));

        (bool success, bytes memory data) = dataStorageAddress.call(payload);
        require(success, "call function failed");
        
        // return data
        return  abi.decode(data, (string));
    }

    function setDataByABI1(string calldata newData) public returns (bool) {
        // playload
        bytes memory payload = abi.encodeWithSignature("setData(string)", newData);
        (bool success, ) = dataStorageAddress.call(payload);

        return success;
    }

    function setDataByABI2(string calldata newData) public returns (bool) {
        // selector
        bytes4 selector = DataStorage.setData.selector;
        // playload
        bytes memory payload = abi.encodeWithSelector(selector, newData);

        (bool success, ) = dataStorageAddress.call(payload);

        return success;
    }

    function setDataByABI3(string calldata newData) public returns (bool) {
        // playload
        bytes memory playload = abi.encodeCall(DataStorage.setData, (newData));

        (bool success, ) = dataStorageAddress.call(playload);
        return success;
    }
}

pragma solidity ^0.8.0;

contract Callee {
    function getData() public pure returns (uint256) {
        return 42;
    }
}


