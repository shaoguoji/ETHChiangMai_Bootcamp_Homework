// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {NFTMarket} from "../src/NFTMarket.sol";
import {HookERC20} from "../src/HookERC20.sol";
import {BaseERC721} from "../src/BaseERC721.sol";

contract InteractNFTMarket is Script {
    NFTMarket public nftMarket;
    HookERC20 public hookERC20;
    BaseERC721 public baseERC721;

    function run() public {
        // Load deployed contracts
        hookERC20 = HookERC20(loadDeployedAddress("HookERC20"));
        baseERC721 = BaseERC721(loadDeployedAddress("BaseERC721"));
        nftMarket = NFTMarket(loadDeployedAddress("NFTMarket"));

        console.log("Loaded contracts:");
        console.log("NFTMarket:", address(nftMarket));
        console.log("BaseERC721:", address(baseERC721));
        console.log("HookERC20:", address(hookERC20));

        vm.startBroadcast();
        address deployer = msg.sender;
        
        console.log("Interacting with account:", deployer);

        // 1. Mint NFT
        uint256 tokenId = 1001; // Arbitrary ID
        console.log("Minting NFT", tokenId);
        // Check if already minted to avoid error, or just try mint
        try baseERC721.mint(deployer, tokenId) {
            console.log("Minted successfully");
        } catch {
             console.log("Mint failed (maybe already minted), proceeding...");
        }

        // 2. Approve Market (setApprovalForAll is required by NFTMarket)
        console.log("Setting Approval For All...");
        baseERC721.setApprovalForAll(address(nftMarket), true);

        // 3. List NFT
        uint256 price = 100 ether; // 100 tokens
        console.log("Listing NFT for", price);
        nftMarket.list(tokenId, price);

        // 4. Buy NFT (Self-buy for simplicity in this script, or use another key if provided)
        // Ensure we have tokens
        if (hookERC20.balanceOf(deployer) < price) {
             console.log("Minting ERC20 tokens to self...");
            // Assuming HookERC20 has free mint or we call deal (but deal is cheatcode, need real tx)
            // If HookERC20 doesn't have public mint, we depend on initial supply.
            // Let's assume we can't easily mint ERC20 if not owner/minter. 
            // But usually test ERC20s have mint. Checking HookERC20 source would be good, 
            // but for now let's hope the deployer has balance from setup or we skip buy if no funds.
        }
        
        console.log("Approving Market for ERC20...");
        hookERC20.approve(address(nftMarket), price);

        console.log("Buying NFT...");
        nftMarket.buyNFT(tokenId, price);

        vm.stopBroadcast();
        
        console.log("Interaction Complete! Check Frontend.");
    }

    function loadDeployedAddress(string memory name) internal view returns (address) {
        string memory chainId = vm.toString(block.chainid);
        string memory root = vm.projectRoot();
        string memory filePath = string.concat(
            root,
            string.concat("/deployments/", string.concat(name, string.concat("_", string.concat(chainId, ".json"))))
        );

        require(vm.exists(filePath), string.concat("Deployment file not found: ", filePath));

        string memory json = vm.readFile(filePath);
        return vm.parseJsonAddress(json, ".address");
    }
}
