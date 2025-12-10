// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Counter {
    uint public counter;

    function get() public view returns (uint) {
        return counter;
    }

    function add(uint x) public {
        counter = counter + x;
    }
}

// https://sepolia.etherscan.io/tx/0xaf4954c8a8c60965428fba6ac733b45574cbba94f0fe185228ca1d49ee370ee2
