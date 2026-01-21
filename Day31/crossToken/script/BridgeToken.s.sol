// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MyToken} from "../src/MyToken.sol";

interface IOptimismMintableERC20Factory {
    function createOptimismMintableERC20(
        address _remoteToken,
        string memory _name,
        string memory _symbol
    ) external returns (address);
}

interface IL1StandardBridge {
    function bridgeERC20(
        address _localToken,
        address _remoteToken,
        uint256 _amount,
        uint32 _minGasLimit,
        bytes calldata _extraData
    ) external;
}

interface IERC20 {
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract BridgeTokenScript is Script {
    // Sepolia (L1) Chain ID
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;
    // Base Sepolia (L2) Chain ID
    uint256 constant BASE_SEPOLIA_CHAIN_ID = 84532;

    // Sepolia Addresses (L1)
    address constant L1_STANDARD_BRIDGE = 0xfd0Bf71F60660E2f608ed56e1659C450eB113120;
    
    // Base Sepolia Addresses (L2)
    address constant L2_STANDARD_BRIDGE = 0x4200000000000000000000000000000000000010;
    address constant OPTIMISM_MINTABLE_ERC20_FACTORY = 0x4200000000000000000000000000000000000012;

    function run() public {
        uint256 chainId = block.chainid;
        
        console.log("================================================");
        console.log("Cross-Chain Token Bridge Script");
        console.log("================================================");
        console.log("Current Chain ID:", chainId);

        // Start broadcast using the account provided via --account or --private-key
        vm.startBroadcast();

        address sender = vm.envAddress("SENDER");
        console.log("Sender (env):", sender);

        if (chainId == SEPOLIA_CHAIN_ID) {
            runL1Bridge(sender);
        } else if (chainId == BASE_SEPOLIA_CHAIN_ID) {
            runL2Deploy();
        } else {
            console.log("ERROR: Unsupported chain. Use Sepolia (11155111) or Base Sepolia (84532).");
        }

        vm.stopBroadcast();
    }

    /// @notice Deploy L2 Token on Base Sepolia using OptimismMintableERC20Factory
    function runL2Deploy() internal {
        console.log("================================================");
        console.log("Phase: Deploy L2 Token on Base Sepolia");
        console.log("================================================");
        
        // Load L1 Token address from deployment file (Sepolia chainId = 11155111)
        address l1TokenAddress = _loadDeployedAddress("MyToken", SEPOLIA_CHAIN_ID);
        console.log("L1 Token Address (from deployment file):", l1TokenAddress);

        IOptimismMintableERC20Factory factory = IOptimismMintableERC20Factory(OPTIMISM_MINTABLE_ERC20_FACTORY);
        
        address l2Token = factory.createOptimismMintableERC20(
            l1TokenAddress,
            "CrossChainToken",
            "CRT"
        );
        
        // Save L2 Token deployment
        _saveDeployment("MyTokenL2", l2Token);
        
        console.log("================================================");
        console.log("L2 Token deployed at:", l2Token);
        console.log("Deployment saved to: deployments/MyTokenL2_%s.json", vm.toString(block.chainid));
        console.log("================================================");
    }

    /// @notice Bridge tokens from L1 (Sepolia) to L2 (Base Sepolia)
    function runL1Bridge(address sender) internal {
        console.log("================================================");
        console.log("Phase: Bridge Token from Sepolia to Base Sepolia");
        console.log("================================================");

        // Load L1 Token address from deployment file
        address l1TokenAddress = _loadDeployedAddress("MyToken", SEPOLIA_CHAIN_ID);
        console.log("L1 Token Address (from deployment file):", l1TokenAddress);

        // Load L2 Token address from deployment file (Base Sepolia chainId = 84532)
        address l2TokenAddress = _loadDeployedAddress("MyTokenL2", BASE_SEPOLIA_CHAIN_ID);
        console.log("L2 Token Address (from deployment file):", l2TokenAddress);

        // Get bridge amount from env, default to 100 tokens
        uint256 bridgeAmount;
        try vm.envUint("BRIDGE_AMOUNT") returns (uint256 amount) {
            bridgeAmount = amount;
        } catch {
            bridgeAmount = 100 * 10 ** 18; // Default: 100 tokens
        }
        console.log("Bridge Amount:", bridgeAmount);

        // Check balance using the actual sender address
        uint256 balance = IERC20(l1TokenAddress).balanceOf(sender);
        console.log("Current L1 Token Balance:", balance);
        require(balance >= bridgeAmount, "Insufficient L1 Token balance");

        // Step 1: Approve L1StandardBridge
        console.log("Approving L1StandardBridge...");
        IERC20(l1TokenAddress).approve(L1_STANDARD_BRIDGE, bridgeAmount);
        console.log("Approved L1StandardBridge for amount:", bridgeAmount);

        // Step 2: Call bridgeERC20
        console.log("Calling bridgeERC20...");
        IL1StandardBridge(L1_STANDARD_BRIDGE).bridgeERC20(
            l1TokenAddress,
            l2TokenAddress,
            bridgeAmount,
            200000, // minGasLimit
            hex""   // extraData
        );

        console.log("================================================");
        console.log("Bridge transaction sent!");
        console.log("Tokens will arrive on Base Sepolia after finalization.");
        console.log("================================================");
    }

    // ============ Helper Functions ============

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

    function _loadDeployedAddress(string memory name, uint256 targetChainId) internal view returns (address) {
        string memory chainIdStr = vm.toString(targetChainId);
        string memory root = vm.projectRoot();
        string memory filePath = string.concat(
            root,
            "/deployments/",
            name,
            "_",
            chainIdStr,
            ".json"
        );

        require(vm.exists(filePath), string.concat("Deployment file not found: ", filePath));

        string memory json = vm.readFile(filePath);
        return vm.parseJsonAddress(json, ".address");
    }
}
