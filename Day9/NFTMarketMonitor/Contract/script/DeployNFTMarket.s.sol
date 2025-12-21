// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {NFTMarket} from "../src/NFTMarket.sol";
import {HookERC20} from "../src/HookERC20.sol";
import {BaseERC721} from "../src/BaseERC721.sol";

contract DeployNFTMarket is Script {
    NFTMarket public nftMarket;
    HookERC20 public hookERC20;
    BaseERC721 public baseERC721;

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        hookERC20 = new HookERC20();
        baseERC721 = new BaseERC721("Test NFT", "TNFT", "ipfs://test_base_url");
        nftMarket = new NFTMarket(address(hookERC20), address(baseERC721));

        vm.stopBroadcast();

        // 输出部署信息
        console.log("\n=== NFTMarket Deployment Summary ===");
        console.log("HookERC20:", address(hookERC20));
        console.log("BaseERC721:", address(baseERC721));
        console.log("NFTMarket:", address(nftMarket));

        saveContract("HookERC20", address(hookERC20));
        saveContract("BaseERC721", address(baseERC721));
        saveContract("NFTMarket", address(nftMarket));

    }

    function saveContract(string memory name, address addr) public {
        string memory chainId = vm.toString(block.chainid);

        string memory json1 = "key";
        string memory finalJson = vm.serializeAddress(json1, "address", addr);
        string memory root = vm.projectRoot();
        string memory deploymentsDir = string.concat(root, "/deployments");
        vm.createDir(deploymentsDir, true);

        string memory dirPath = string.concat(
            string.concat(deploymentsDir, string.concat("/", name)),
            "_"
        );
        vm.writeJson(
            finalJson,
            string.concat(dirPath, string.concat(chainId, ".json"))
        );
    }
}
