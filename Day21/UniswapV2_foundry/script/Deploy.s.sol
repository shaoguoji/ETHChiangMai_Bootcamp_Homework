// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {Multicall} from "../src/Multicall.sol";

/**
 * @title UniswapV2 Deployment Script
 * @notice Deploys UniswapV2 contracts using pre-compiled bytecode to avoid version conflicts
 * @dev This script uses inherited deployCode() from forge-std to load bytecode from compiled artifacts
 */
contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // Deploy Multicall (required by Uniswap frontend for batch calls)
        Multicall multicall = new Multicall();
        console.log("Multicall deployed to:", address(multicall));
        _saveDeployment("Multicall", address(multicall));

        // Deploy WETH9 (0.8.x compatible)
        address weth = deployCode("WETH9.sol:WETH9");
        console.log("WETH9 deployed to:", weth);
        _saveDeployment("WETH9", weth);

        // Deploy UniswapV2Factory (compiled from 0.5.16 source)
        // Constructor arg: feeToSetter (msg.sender)
        address factory = deployCode("UniswapV2Factory.sol:UniswapV2Factory", abi.encode(msg.sender));
        console.log("UniswapV2Factory deployed to:", factory);
        _saveDeployment("UniswapV2Factory", factory);

        // Deploy UniswapV2Router02 (compiled from 0.6.6 source)
        // Constructor args: factory, WETH
        address router = deployCode("UniswapV2Router02.sol:UniswapV2Router02", abi.encode(factory, weth));
        console.log("UniswapV2Router02 deployed to:", router);
        _saveDeployment("UniswapV2Router02", router);

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("Multicall:", address(multicall));
        console.log("WETH9:", weth);
        console.log("Factory:", factory);
        console.log("Router:", router);
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
