// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {OpenspaceNFT} from "../src/OpenspaceNFT.sol";

contract DeployScript is Script {
    OpenspaceNFT public nft;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        nft = new OpenspaceNFT();
        _saveDeployment("OpenspaceNFT", address(nft));
        console.log("OpenspaceNFT deployed to:", _loadDeployedAddress("OpenspaceNFT"));

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
