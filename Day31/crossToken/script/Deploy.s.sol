// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {MyToken} from "../src/MyToken.sol";

contract DeployScript is Script {
    MyToken public token;

    function setUp() public {}

    function run() public {
        console.log("================================================");
        console.log("Deploying MyToken (CRT)");
        console.log("================================================");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", msg.sender);

        vm.startBroadcast();

        token = new MyToken("CrossChainToken", "CRT");
        _saveDeployment("MyToken", address(token));

        vm.stopBroadcast();

        console.log("================================================");
        console.log("MyToken deployed to:", address(token));
        console.log("Initial supply:", token.totalSupply());
        console.log("Deployment saved to: deployments/MyToken_%s.json", vm.toString(block.chainid));
        console.log("================================================");
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
