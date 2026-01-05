// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {Bank} from "../src/Bank.sol";
import {Automation} from "../src/Automation.sol";

contract BankScript is Script {
    Bank public bank;
    Automation public automation;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Step 1: Deploy Bank - msg.sender (deployer) becomes admin
        bank = new Bank();
        _saveDeployment("Bank", address(bank));
        
        // Step 2: Deploy Automation with bank address and deployer as receiver
        automation = new Automation(address(bank), msg.sender, 100 gwei);
        _saveDeployment("Automation", address(automation));

        // Step 3: Set Automation as the new admin of Bank
        bank.setAdmin(address(automation));

        vm.stopBroadcast();

        console.log("Bank deployed to: ", address(bank));
        console.log("Automation deployed to: ", address(automation));
    }

    function _saveDeployment(string memory name, address addr) internal {
        string memory chainId = vm.toString(block.chainid);
        string memory json = vm.serializeAddress("", "address", addr);
        string memory path = string.concat(
            "deployments/",
            name,
            "_",
            chainId,
            ".json"
        );
        vm.writeJson(json, path);
    }
}
