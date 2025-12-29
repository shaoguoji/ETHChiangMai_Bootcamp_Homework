// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {TokenBankPermit2} from "../src/TokenBankPermit2.sol";
import {HookERC20} from "../src/HookERC20.sol";
import {Permit2} from "../src/Permit2.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        HookERC20 token = new HookERC20();
        Permit2 permit2 = new Permit2();
        TokenBankPermit2 bank = new TokenBankPermit2(
            address(token),
            address(permit2)
        );

        console.log("Token address:", address(token));
        console.log("Permit2 address:", address(permit2));
        console.log("Bank address:", address(bank));

        vm.stopBroadcast();
    }
}
