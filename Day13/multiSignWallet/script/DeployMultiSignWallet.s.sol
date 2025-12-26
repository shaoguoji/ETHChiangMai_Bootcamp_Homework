// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/multiSignWallet.sol";

contract DeployMultiSignWallet is Script {
    function run() external returns (MultiSignWallet) {
        vm.startBroadcast();
        MultiSignWallet wallet = new MultiSignWallet();
        vm.stopBroadcast();
        return wallet;
    }
}
