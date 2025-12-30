// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {esRNT} from "../src/esRNT.sol";

contract esRNTScript is Script {
    esRNT public _esRNT;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        _esRNT = new esRNT();

        vm.stopBroadcast();

        console.log("esRNT deployed to: ", address(_esRNT));
    }
}
