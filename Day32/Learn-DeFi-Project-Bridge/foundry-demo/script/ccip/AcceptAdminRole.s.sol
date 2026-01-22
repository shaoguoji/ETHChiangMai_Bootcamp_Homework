// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelperUtils} from "./utils/HelperUtils.s.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {TokenAdminRegistry} from "@chainlink/contracts-ccip/tokenAdminRegistry/TokenAdminRegistry.sol";

contract AcceptAdminRole is Script {
    function run() external {
        string memory chainName = HelperUtils.getChainName(block.chainid);

        string memory root = vm.projectRoot();
        string memory deployedTokenPath = string.concat(root, "/script/ccip/output/deployedToken_", chainName, ".json");

        address tokenAddress =
            HelperUtils.getAddressFromJson(vm, deployedTokenPath, string.concat(".deployedToken_", chainName));

        HelperConfig helperConfig = new HelperConfig();
        (,,, address tokenAdminRegistry,,,,) = helperConfig.activeNetworkConfig();

        require(tokenAddress != address(0), "Invalid token address");
        require(tokenAdminRegistry != address(0), "TokenAdminRegistry is not defined for this network");

        vm.startBroadcast();

        address signer = msg.sender;

        TokenAdminRegistry tokenAdminRegistryContract = TokenAdminRegistry(tokenAdminRegistry);

        TokenAdminRegistry.TokenConfig memory tokenConfig = tokenAdminRegistryContract.getTokenConfig(tokenAddress);

        address pendingAdministrator = tokenConfig.pendingAdministrator;

        require(pendingAdministrator == signer, "Only the pending administrator can accept the admin role");

        tokenAdminRegistryContract.acceptAdminRole(tokenAddress);

        console.log("Accepted admin role for token:", tokenAddress);

        vm.stopBroadcast();
    }
}
