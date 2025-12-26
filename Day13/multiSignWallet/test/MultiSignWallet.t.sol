// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/multiSignWallet.sol";

contract MultiSignWalletTest is Test {
    MultiSignWallet public walletFactory;
    bytes4 public walletId;
    address[] public signers;
    address public owner;
    address public user1;
    address public user2;
    address public user3;

    function setUp() public {
        walletFactory = new MultiSignWallet();
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        user3 = address(0x3);

        signers.push(user1);
        signers.push(user2);
        signers.push(user3);
    }

    function testCreateWallet() public {
        walletId = walletFactory.createWallet(signers, 2);
        (bytes4 wid, address wOwner, , uint256 reqSigners, uint256 signCount) = walletFactory.wallets(walletId);
        
        assertEq(wid, walletId);
        assertEq(wOwner, owner);
        assertEq(reqSigners, 2);
        assertEq(signCount, 0);
    }

    function testSubmitProposal() public {
        walletId = walletFactory.createWallet(signers, 2);
        
        Transaction memory newTx = Transaction({
            to: address(0x4),
            value: 1 ether,
            data: "",
            executed: false
        });

        walletFactory.submitProposal(walletId, newTx);
        
        (,, Transaction memory savedTx,,) = walletFactory.wallets(walletId);
        assertEq(savedTx.to, newTx.to);
        assertEq(savedTx.value, newTx.value);
    }

    function testSignAndExecuteProposal() public {
        walletId = walletFactory.createWallet(signers, 2);
        
        // Fund the contract so it can execute transactions
        vm.deal(address(walletFactory), 10 ether);

        Transaction memory newTx = Transaction({
            to: address(0x4),
            value: 1 ether,
            data: "",
            executed: false
        });

        walletFactory.submitProposal(walletId, newTx);

        // Signer 1 signs
        vm.prank(user1);
        walletFactory.SignToConfirmProposal(walletId);

        // Signer 2 signs
        vm.prank(user2);
        walletFactory.SignToConfirmProposal(walletId);

        uint256 preBalance = address(0x4).balance;

        // Execute
        walletFactory.executeProposal(walletId);

        uint256 postBalance = address(0x4).balance;
        assertEq(postBalance - preBalance, 1 ether);
        
        (,, Transaction memory savedTx,,) = walletFactory.wallets(walletId);
        assertTrue(savedTx.executed);
    }

    function testRevertExecuteNotEnoughSigners() public {
        walletId = walletFactory.createWallet(signers, 3);
        
        Transaction memory newTx = Transaction({
            to: address(0x4),
            value: 1 ether,
            data: "",
            executed: false
        });

        walletFactory.submitProposal(walletId, newTx);

        vm.prank(user1);
        walletFactory.SignToConfirmProposal(walletId);

        vm.expectRevert("Not enough signers");
        walletFactory.executeProposal(walletId);
    }
}
