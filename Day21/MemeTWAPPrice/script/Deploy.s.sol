// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {Counter} from "../src/Counter.sol";

contract DeployScript is Script {
    Counter public counter;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        counter = new Counter();
        _saveDeployment("Counter", address(counter));
        console.log("Counter deployed to:", _loadDeployedAddress("Counter"));

        vm.stopBroadcast();
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

    function _loadDeployedAddress(string memory name) internal view returns (address) {
        string memory chainId = vm.toString(block.chainid);
        string memory root = vm.projectRoot();
        string memory filePath = string.concat(
            root,
            string.concat("/deployments/", string.concat(name, string.concat("_", string.concat(chainId, ".json"))))
        );

        require(vm.exists(filePath), "deployment file not found");

        string memory json = vm.readFile(filePath);
        return vm.parseJsonAddress(json, ".address");
    }
}
