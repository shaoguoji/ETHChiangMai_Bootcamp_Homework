// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {HookERC20} from "../src/HookERC20.sol";
import {TokenBankV2} from "../src/TokenBankV2.sol";
import {Delegate} from "../src/Delegate.sol";

contract DeployTokenBankV2 is Script {
    HookERC20 public hookERC20;
    TokenBankV2 public tokenBankV2;
    Delegate public delegate;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        hookERC20 = new HookERC20();    
        tokenBankV2 = new TokenBankV2(address(hookERC20));
        delegate = new Delegate();

        vm.stopBroadcast();

        // 输出部署信息
        console.log("\n=== V2 Deployment Summary ===");
        console.log("HookERC20:", address(hookERC20));
        console.log("TokenBankV2:", address(tokenBankV2));
        console.log("Delegate:", address(delegate));
    }
}
