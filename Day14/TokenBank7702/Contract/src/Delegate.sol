// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Delegate
 * @dev A delegate contract for EIP-7702 that supports batch execution.
 * Users can authorize their EOA to this contract and execute multiple calls in one transaction.
 */
contract Delegate {
    struct Call {
        address target;
        bytes data;
    }

    event Executed(address indexed target, bytes data, bytes result);
    event BatchExecuted(uint256 callCount);

    /**
     * @dev Execute a single call to a target contract
     * @param target The address to call
     * @param data The calldata to send
     * @return result The return data from the call
     */
    function execute(address target, bytes calldata data) external payable returns (bytes memory result) {
        (bool success, bytes memory returnData) = target.call{value: msg.value}(data);
        require(success, "Delegate: call failed");
        emit Executed(target, data, returnData);
        return returnData;
    }

    /**
     * @dev Execute multiple calls in a single transaction
     * @param calls Array of Call structs containing target and data
     * @return results Array of return data from each call
     */
    function executeBatch(Call[] calldata calls) external payable returns (bytes[] memory results) {
        results = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory result) = calls[i].target.call(calls[i].data);
            require(success, string(abi.encodePacked("Delegate: batch call failed at index ", _toString(i))));
            results[i] = result;
        }
        emit BatchExecuted(calls.length);
    }

    /**
     * @dev Helper function to convert uint to string for error messages
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
