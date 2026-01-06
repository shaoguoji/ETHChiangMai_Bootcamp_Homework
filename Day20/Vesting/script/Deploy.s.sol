// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";
import "../src/Vesting.sol";

contract DeployScript is Script {
    function run() external {

        address beneficiary = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8;
        
        vm.startBroadcast();
        
        // 1. Deploy ERC20 token
        MockERC20 token = new MockERC20("Vesting Token", "VEST");
        console.log("MockERC20 deployed at:", address(token));
        
        // 2. Deploy Vesting contract with 1 million tokens
        uint256 totalAmount = 1_000_000 * 10 ** token.decimals();
        Vesting vesting = new Vesting(beneficiary, address(token), totalAmount);
        console.log("Vesting deployed at:", address(vesting));
        console.log("Beneficiary:", beneficiary);
        console.log("Total vesting amount:", totalAmount);
        
        // 3. Transfer 1 million tokens to Vesting contract
        token.transfer(address(vesting), totalAmount);
        console.log("Transferred tokens to Vesting contract");
        
        // 4. Log vesting schedule info
        console.log("Cliff end time:", vesting.getCliffEndTime());
        console.log("Vesting end time:", vesting.getVestingEndTime());
        
        vm.stopBroadcast();
    }
}
