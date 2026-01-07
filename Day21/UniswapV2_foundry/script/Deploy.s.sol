// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {UniswapV2Factory} from "../src/v2-core/UniswapV2Factory.sol";
import {UniswapV2Router02} from "../src/v2-periphery/UniswapV2Router02.sol";
import {WETH9} from "../src/WETH9.sol";

contract DeployScript is Script {
    UniswapV2Factory public factory;
    UniswapV2Router02 public router;
    WETH9 public weth;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy WETH9
        weth = new WETH9();
        _saveDeployment("WETH9", address(weth));
        console.log("WETH9 deployed to:", address(weth));

        // Deploy UniswapV2Factory with deployer as feeToSetter
        factory = new UniswapV2Factory(msg.sender);
        _saveDeployment("UniswapV2Factory", address(factory));
        console.log("UniswapV2Factory deployed to:", address(factory));

        // Deploy UniswapV2Router02
        router = new UniswapV2Router02(address(factory), address(weth));
        _saveDeployment("UniswapV2Router02", address(router));
        console.log("UniswapV2Router02 deployed to:", address(router));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("WETH9:", address(weth));
        console.log("Factory:", address(factory));
        console.log("Router:", address(router));
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
