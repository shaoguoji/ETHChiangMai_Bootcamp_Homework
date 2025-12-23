// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/KGIRL.sol";

contract BatchMint is Script {
    function run() external {
        // The account is provided via the --account flag
        vm.startBroadcast();

        address contractAddress = 0x342E81D93dE16D1F1cB366b52a432964dB0a6cc9;
        address toAddress = 0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd;

        KGirlsNFT nft = KGirlsNFT(contractAddress);

        for (uint i = 0; i < 7; i++) {
            nft.safeMintWithBase(toAddress);
            console.log("Minted token for:", toAddress);
        }

        vm.stopBroadcast();
    }
}
