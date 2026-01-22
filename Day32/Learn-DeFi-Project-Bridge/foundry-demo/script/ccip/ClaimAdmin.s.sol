// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelperUtils} from "./utils/HelperUtils.s.sol";
import {HelperConfig} from "./HelperConfig.s.sol";
import {RegistryModuleOwnerCustom} from
    "@chainlink/contracts-ccip/tokenAdminRegistry/RegistryModuleOwnerCustom.sol";
import {BurnMintERC20} from "@chainlink/contracts/src/v0.8/shared/token/ERC20/BurnMintERC20.sol";

contract ClaimAdmin is Script {
    function run() external {
        string memory chainName = HelperUtils.getChainName(block.chainid);

        string memory root = vm.projectRoot();
        string memory deployedTokenPath = string.concat(root, "/script/ccip/output/deployedToken_", chainName, ".json");
        string memory configPath = string.concat(root, "/script/ccip/config.json");

        address tokenAddress =
            HelperUtils.getAddressFromJson(vm, deployedTokenPath, string.concat(".deployedToken_", chainName));
        address tokenAdmin = HelperUtils.getAddressFromJson(vm, configPath, ".BnMToken.ccipAdminAddress");

        HelperConfig helperConfig = new HelperConfig();
        (,,,, address registryModuleOwnerCustom,,,) = helperConfig.activeNetworkConfig();

        require(tokenAddress != address(0), "Invalid token address");
        require(registryModuleOwnerCustom != address(0), "Registry module owner custom is not defined for this network");

        vm.startBroadcast();

        claimAdminWithCCIPAdmin(tokenAddress, tokenAdmin, registryModuleOwnerCustom);

        vm.stopBroadcast();
    }

    function claimAdminWithCCIPAdmin(address tokenAddress, address tokenAdmin, address registryModuleOwnerCustom)
        internal
    {
        BurnMintERC20 tokenContract = BurnMintERC20(tokenAddress);
        RegistryModuleOwnerCustom registryContract = RegistryModuleOwnerCustom(registryModuleOwnerCustom);

        address tokenContractCCIPAdmin = tokenContract.getCCIPAdmin();
        console.log("Current token admin:", tokenContractCCIPAdmin);

        require(
            tokenContractCCIPAdmin == tokenAdmin, "CCIP admin of token doesn't match the token admin address."
        );

        console.log("Claiming admin of the token via getCCIPAdmin() for CCIP admin:", tokenAdmin);
        registryContract.registerAdminViaGetCCIPAdmin(tokenAddress);
        console.log("Admin claimed successfully for token:", tokenAddress);
    }
}
