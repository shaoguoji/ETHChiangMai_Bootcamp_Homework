// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {MockUSDT} from "../src/MockUSDT.sol";
import {CallOptionToken} from "../src/CallOptionToken.sol";

contract DeployScript is Script {
    MockUSDT public usdt;
    CallOptionToken public option;

    // 配置参数
    uint256 public constant STRIKE_PRICE = 2000 * 1e18; // 2000 USDT per ETH
    uint256 public constant EXPIRATION_DAYS = 7; // 7 天后到期

    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        // 部署 MockUSDT
        usdt = new MockUSDT();
        _saveDeployment("MockUSDT", address(usdt));
        console.log("MockUSDT deployed to:", address(usdt));

        // 计算行权日期
        uint256 expirationDate = block.timestamp + EXPIRATION_DAYS * 1 days;
        console.log("Expiration date:", expirationDate);

        // 部署 CallOptionToken
        option = new CallOptionToken(
            "ETH Call Option 2000",
            "ETH-CALL-2000",
            STRIKE_PRICE,
            expirationDate,
            address(usdt)
        );
        _saveDeployment("CallOptionToken", address(option));
        console.log("CallOptionToken deployed to:", address(option));

        vm.stopBroadcast();
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

    function _loadDeployedAddress(string memory name) internal view returns (address) {
        string memory chainId = vm.toString(block.chainid);
        string memory root = vm.projectRoot();
        string memory filePath = string.concat(
            root,
            string.concat("/deployments/", string.concat(name, string.concat("_", string.concat(chainId, ".json"))))
        );

        require(vm.exists(filePath), "deployment file not found");

        string memory json = vm.readFile(filePath);
        return vm.parseJsonAddress(json, ".address");
    }
}
