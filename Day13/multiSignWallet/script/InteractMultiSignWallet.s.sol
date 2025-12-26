// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/multiSignWallet.sol";

contract InteractMultiSignWallet is Script {
    MultiSignWallet public walletFactory;

    function run() external {
        // Retrieve deployment from previous run or deploy new one
        // For simplicity in this script, we deploy a new one or assume an address.
        // In a real scenario, we might read from broadcast json or env.
        
        vm.startBroadcast();
        walletFactory = new MultiSignWallet();
        address[] memory signers = new address[](3);
        signers[0] = msg.sender; // Ensure current sender is a signer
        signers[1] = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil Account 1
        signers[2] = 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC; // Anvil Account 2

        bytes4 walletId = walletFactory.createWallet(signers, 2);
        console.log("Wallet created with ID:");
        console.logBytes4(walletId);

        // Fund the contract so it can execute transactions
        payable(address(walletFactory)).transfer(1 ether);

        Transaction memory txInfo = Transaction({
            to: address(0x123),
            value: 0.1 ether,
            data: "",
            executed: false
        });

        walletFactory.submitProposal(walletId, txInfo);
        console.log("Proposal submitted");

        // Confirm proposal
        // Note: msg.sender is currently Account 0 (deployer)
        walletFactory.SignToConfirmProposal(walletId);
        console.log("Signer 1 confirmed");

        // We need to switch context to sign as another user, but vm.prank doesn't work in Broadcast for different EOAs unless we provide private keys. 
        // For this script to work on a real network or Anvil, we would need to handle signing with different private keys.
        // Here we just stop broadcast to end the "deployer" actions.
        vm.stopBroadcast();
        
        // Simulating the second signature if we were running this locally with known keys
        // or just rely on the test for multi-user simulation.
        // In a script intended for `forge script`, we typically only perform actions for the caller.
    }
}
