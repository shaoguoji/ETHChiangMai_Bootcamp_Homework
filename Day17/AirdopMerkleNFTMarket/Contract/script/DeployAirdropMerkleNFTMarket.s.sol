// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AirdopMerkleNFTMarket} from "../src/AirdopMerkleNFTMarket.sol";
import {MyPermitToken} from "../src/MyPermitToken.sol";
import {BaseERC721} from "../src/BaseERC721.sol";

contract DeployAirdropMerkleNFTMarket is Script {
    function run() public {
        vm.startBroadcast();

        // 1. Deploy Token
        MyPermitToken token = new MyPermitToken();
        
        // 2. Deploy NFT
        BaseERC721 nft = new BaseERC721("ArtNFT", "ANFT", "https://ipfs.io/ipfs/");
        
        // 3. Deploy Market
        // Initialize with empty root, admin can set it later via setMerkleRoot
        bytes32 root = bytes32(0);
        AirdopMerkleNFTMarket market = new AirdopMerkleNFTMarket(address(token), address(nft), root);
        
        console.log("MyPermitToken deployed at:", address(token));
        console.log("BaseERC721 deployed at:", address(nft));
        console.log("AirdopMerkleNFTMarket deployed at:", address(market));

        vm.stopBroadcast();
    }
}
