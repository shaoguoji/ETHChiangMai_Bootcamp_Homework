// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/UpgradeableNFT.sol";
import "../src/NFTMarketV1.sol";
import "../src/HookERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployUpgradeableNFTMarket
 * @dev Deploy upgradeable NFT marketplace with UUPS proxy pattern
 * 
 * Usage:
 * forge script script/DeployUpgradeableNFTMarket.s.sol --rpc-url $RPC_URL --broadcast --private-key $PRIVATE_KEY
 */
contract DeployUpgradeableNFTMarket is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deployer:", deployer);
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy HookERC20
        HookERC20 erc20 = new HookERC20();
        console.log("HookERC20 deployed at:", address(erc20));

        // 2. Deploy UpgradeableNFT implementation
        UpgradeableNFT nftImplementation = new UpgradeableNFT();
        console.log("UpgradeableNFT implementation:", address(nftImplementation));

        // 3. Deploy UpgradeableNFT proxy
        bytes memory nftInitData = abi.encodeWithSelector(
            UpgradeableNFT.initialize.selector,
            "Upgradeable NFT",
            "UNFT",
            "https://example.com/nft/"
        );
        ERC1967Proxy nftProxy = new ERC1967Proxy(address(nftImplementation), nftInitData);
        console.log("UpgradeableNFT proxy:", address(nftProxy));

        // 4. Deploy NFTMarketV1 implementation
        NFTMarketV1 marketImplementation = new NFTMarketV1();
        console.log("NFTMarketV1 implementation:", address(marketImplementation));

        // 5. Deploy NFTMarket proxy
        bytes memory marketInitData = abi.encodeWithSelector(
            NFTMarketV1.initialize.selector,
            address(erc20),
            address(nftProxy)
        );
        ERC1967Proxy marketProxy = new ERC1967Proxy(address(marketImplementation), marketInitData);
        console.log("NFTMarket proxy:", address(marketProxy));

        vm.stopBroadcast();

        // Save deployment addresses
        _saveDeployment("HookERC20", address(erc20));
        _saveDeployment("UpgradeableNFT_Implementation", address(nftImplementation));
        _saveDeployment("UpgradeableNFT_Proxy", address(nftProxy));
        _saveDeployment("NFTMarketV1_Implementation", address(marketImplementation));
        _saveDeployment("NFTMarket_Proxy", address(marketProxy));

        console.log("\n=== Deployment Summary ===");
        console.log("HookERC20:", address(erc20));
        console.log("UpgradeableNFT (proxy):", address(nftProxy));
        console.log("NFTMarket (proxy):", address(marketProxy));
        console.log("NFTMarketV1 version:", NFTMarketV1(address(marketProxy)).version());
    }

    function _saveDeployment(string memory name, address addr) internal {
        string memory chainId = vm.toString(block.chainid);
        string memory json = vm.serializeAddress("", "address", addr);
        string memory path = string.concat(
            "deployments/",
            name,
            "_",
            chainId,
            ".json"
        );
        vm.writeJson(json, path);
    }
}
