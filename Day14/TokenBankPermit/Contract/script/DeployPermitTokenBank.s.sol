// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/PermitToken.sol";
import "../src/TokenBank.sol";

contract DeployPermitTokenBank is Script {
    function run() external {
        vm.startBroadcast();

        PermitToken token = new PermitToken();
        TokenBank bank = new TokenBank(address(token));

        console.log("PermitToken deployed at:", address(token));
        console.log("TokenBank deployed at:", address(bank));

        vm.stopBroadcast();
    }
}
