// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MemeFactory.sol";
import "../src/MemeToken.sol";

contract Deploy is Script {
    function run() external {
        // Sepolia Uniswap V2 Router 02 Address
        address uniswapRouter = 0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3;

        vm.startBroadcast();
        
        MemeFactory factory = new MemeFactory(uniswapRouter);
        
        vm.stopBroadcast();
        
        console.log("MemeFactory deployed at:", address(factory));
        console.log("Using Uniswap Router:", uniswapRouter);
    }
}
