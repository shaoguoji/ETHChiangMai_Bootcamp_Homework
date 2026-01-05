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

        // Receiver address for automation withdrawals
        address receiver = 0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd;

        // Step 1: Deploy Bank - deployer becomes admin
        bank = new Bank();
        _saveDeployment("Bank", address(bank));
        
        // Step 2: Deploy Automation with bank address and receiver
        automation = new Automation(address(bank), receiver, 100 gwei);
        _saveDeployment("Automation", address(automation));

        // Step 3: Set Automation as the new admin of Bank
        bank.setAdmin(address(automation));

        vm.stopBroadcast();

        console.log("Bank deployed to: ", address(bank));
        console.log("Automation deployed to: ", address(automation));
        console.log("Receiver set to: ", receiver);
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
