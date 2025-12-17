// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script } from "forge-std/Script.sol";
import { BaseERC721 } from "../src/BaseERC721.sol";

contract DeployBaseERC721 is Script {
    BaseERC721 public baseERC721;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        baseERC721 = new BaseERC721("testERC721", "testERC721", "ipfs://testERC721");

        vm.stopBroadcast();
    }
}
