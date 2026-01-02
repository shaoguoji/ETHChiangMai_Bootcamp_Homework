// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/NFTMarketV1.sol";
import "../src/NFTMarketV2.sol";

/**
 * @title UpgradeToV2
 * @dev Upgrade NFTMarket proxy from V1 to V2
 * 
 * Usage:
 * forge script script/UpgradeToV2.s.sol --rpc-url $RPC_URL --broadcast --account <keystore_account>
 */
contract UpgradeToV2 is Script {
    function run() external {
        // Load existing proxy address
        address marketProxy = _loadDeployedAddress("NFTMarket_Proxy");
        console.log("NFTMarket proxy:", marketProxy);
        
        // Check current version
        string memory currentVersion = NFTMarketV1(marketProxy).version();
        console.log("Current version:", currentVersion);

        vm.startBroadcast();

        // 1. Deploy NFTMarketV2 implementation
        NFTMarketV2 v2Implementation = new NFTMarketV2();
        console.log("NFTMarketV2 implementation deployed at:", address(v2Implementation));

        // 2. Upgrade proxy to V2 (no additional initialization needed)
        NFTMarketV1(marketProxy).upgradeToAndCall(
            address(v2Implementation),
            "" // No initialization data for V2
        );

        vm.stopBroadcast();

        // Save new implementation address
        _saveDeployment("NFTMarketV2_Implementation", address(v2Implementation));

        // Verify upgrade
        string memory newVersion = NFTMarketV2(marketProxy).version();
        console.log("New version:", newVersion);
        
        console.log("\n=== Upgrade Summary ===");
        console.log("Proxy address (unchanged):", marketProxy);
        console.log("Old implementation: NFTMarketV1");
        console.log("New implementation:", address(v2Implementation));
        console.log("Version:", currentVersion, "->", newVersion);
    }

    function _loadDeployedAddress(string memory name) internal view returns (address) {
        string memory chainId = vm.toString(block.chainid);
        string memory path = string.concat(
            "deployments/",
            name,
            "_",
            chainId,
            ".json"
        );
        
        require(vm.exists(path), "Deployment file not found");
        
        string memory json = vm.readFile(path);
        return vm.parseJsonAddress(json, ".address");
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
