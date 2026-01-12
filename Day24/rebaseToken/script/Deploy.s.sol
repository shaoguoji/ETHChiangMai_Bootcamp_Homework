// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {DeflationaryToken} from "../src/DeflationaryToken.sol";

contract DeployScript is Script {
    function run() public {
        vm.startBroadcast();
        
        DeflationaryToken token = new DeflationaryToken(
            "Deflationary Token",
            "DFT",
            1_000_000 ether
        );
        
        vm.stopBroadcast();
    }
}
