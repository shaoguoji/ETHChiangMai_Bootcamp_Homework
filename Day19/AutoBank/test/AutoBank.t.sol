// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test, console} from "forge-std/Test.sol";
import {Bank} from "../src/Bank.sol";
import {Automation} from "../src/Automation.sol";

contract AutoBankTest is Test {
    Bank public bank;
    Automation public automation;
    
    address public deployer = address(1);
    address public receiver = address(2);
    address public user1 = address(3);
    address public user2 = address(4);
    address public user3 = address(5);
    
    uint256 public constant THRESHOLD = 100 gwei;

    function setUp() public {
        // Deploy as deployer
        vm.startPrank(deployer);
        
        bank = new Bank();
        automation = new Automation(address(bank), receiver, THRESHOLD);
        
        // Set Automation as the admin of Bank
        bank.setAdmin(address(automation));
        
        vm.stopPrank();
        
        // Give users some ETH
        vm.deal(user1, 1 ether);
        vm.deal(user2, 1 ether);
        vm.deal(user3, 1 ether);
    }

    /// @notice Test that checkUpkeep returns false when balance is below threshold
    function test_CheckUpkeep_BelowThreshold() public {
        // User1 deposits 50 gwei (below threshold)
        vm.prank(user1);
        (bool sent,) = address(bank).call{value: 50 gwei}("");
        assertTrue(sent, "Deposit failed");
        
        // Check upkeep should return false
        (bool upkeepNeeded,) = automation.checkUpkeep("");
        assertFalse(upkeepNeeded, "Upkeep should not be needed below threshold");
    }

    /// @notice Test that checkUpkeep returns true when balance reaches threshold
    function test_CheckUpkeep_AtThreshold() public {
        // User1 deposits exactly 100 gwei (at threshold)
        vm.prank(user1);
        (bool sent,) = address(bank).call{value: 100 gwei}("");
        assertTrue(sent, "Deposit failed");
        
        // Check upkeep should return true
        (bool upkeepNeeded,) = automation.checkUpkeep("");
        assertTrue(upkeepNeeded, "Upkeep should be needed at threshold");
    }

    /// @notice Test that checkUpkeep returns true when balance exceeds threshold
    function test_CheckUpkeep_AboveThreshold() public {
        // User1 deposits 200 gwei (above threshold)
        vm.prank(user1);
        (bool sent,) = address(bank).call{value: 200 gwei}("");
        assertTrue(sent, "Deposit failed");
        
        // Check upkeep should return true
        (bool upkeepNeeded,) = automation.checkUpkeep("");
        assertTrue(upkeepNeeded, "Upkeep should be needed above threshold");
    }

    /// @notice Test multiple users depositing until threshold is reached
    function test_MultipleUsers_DepositUntilThreshold() public {
        // User1 deposits 30 gwei
        vm.prank(user1);
        (bool sent1,) = address(bank).call{value: 30 gwei}("");
        assertTrue(sent1, "User1 deposit failed");
        
        // Check upkeep should be false
        (bool upkeepNeeded1,) = automation.checkUpkeep("");
        assertFalse(upkeepNeeded1, "Upkeep should not be needed after user1 deposit");
        
        // User2 deposits 40 gwei (total: 70 gwei)
        vm.prank(user2);
        (bool sent2,) = address(bank).call{value: 40 gwei}("");
        assertTrue(sent2, "User2 deposit failed");
        
        // Check upkeep should still be false
        (bool upkeepNeeded2,) = automation.checkUpkeep("");
        assertFalse(upkeepNeeded2, "Upkeep should not be needed after user2 deposit");
        
        // User3 deposits 30 gwei (total: 100 gwei)
        vm.prank(user3);
        (bool sent3,) = address(bank).call{value: 30 gwei}("");
        assertTrue(sent3, "User3 deposit failed");
        
        // Check upkeep should now be true
        (bool upkeepNeeded3,) = automation.checkUpkeep("");
        assertTrue(upkeepNeeded3, "Upkeep should be needed after threshold reached");
        
        console.log("Bank balance after all deposits:", address(bank).balance);
    }

    /// @notice Test performUpkeep withdraws half the balance to receiver
    function test_PerformUpkeep_WithdrawsHalf() public {
        // Deposit 200 gwei to bank
        vm.prank(user1);
        (bool sent,) = address(bank).call{value: 200 gwei}("");
        assertTrue(sent, "Deposit failed");
        
        uint256 bankBalanceBefore = address(bank).balance;
        uint256 receiverBalanceBefore = receiver.balance;
        
        console.log("Bank balance before performUpkeep:", bankBalanceBefore);
        console.log("Receiver balance before performUpkeep:", receiverBalanceBefore);
        
        // Verify upkeep is needed
        (bool upkeepNeeded,) = automation.checkUpkeep("");
        assertTrue(upkeepNeeded, "Upkeep should be needed");
        
        // Perform upkeep (simulating Chainlink Automation calling this)
        automation.performUpkeep("");
        
        uint256 bankBalanceAfter = address(bank).balance;
        uint256 receiverBalanceAfter = receiver.balance;
        
        console.log("Bank balance after performUpkeep:", bankBalanceAfter);
        console.log("Receiver balance after performUpkeep:", receiverBalanceAfter);
        
        // Bank should have half the original balance
        assertEq(bankBalanceAfter, bankBalanceBefore / 2, "Bank should have half the balance");
        
        // Receiver should have received half the original balance
        assertEq(receiverBalanceAfter - receiverBalanceBefore, bankBalanceBefore / 2, "Receiver should have received half");
    }

    /// @notice Test complete flow: multiple deposits -> check upkeep -> perform upkeep
    function test_CompleteFlow() public {
        console.log("\n=== Starting Complete Flow Test ===\n");
        
        // Step 1: User1 deposits 50 gwei
        console.log("Step 1: User1 deposits 50 gwei");
        vm.prank(user1);
        (bool sent1,) = address(bank).call{value: 50 gwei}("");
        assertTrue(sent1);
        console.log("  Bank balance:", address(bank).balance);
        
        (bool upkeep1,) = automation.checkUpkeep("");
        console.log("  Upkeep needed:", upkeep1);
        assertFalse(upkeep1);
        
        // Step 2: User2 deposits 30 gwei
        console.log("\nStep 2: User2 deposits 30 gwei");
        vm.prank(user2);
        (bool sent2,) = address(bank).call{value: 30 gwei}("");
        assertTrue(sent2);
        console.log("  Bank balance:", address(bank).balance);
        
        (bool upkeep2,) = automation.checkUpkeep("");
        console.log("  Upkeep needed:", upkeep2);
        assertFalse(upkeep2);
        
        // Step 3: User3 deposits 25 gwei (total: 105 gwei, above threshold!)
        console.log("\nStep 3: User3 deposits 25 gwei");
        vm.prank(user3);
        (bool sent3,) = address(bank).call{value: 25 gwei}("");
        assertTrue(sent3);
        console.log("  Bank balance:", address(bank).balance);
        
        (bool upkeep3,) = automation.checkUpkeep("");
        console.log("  Upkeep needed:", upkeep3);
        assertTrue(upkeep3, "Threshold reached, upkeep should be needed!");
        
        // Step 4: Chainlink Automation calls performUpkeep
        console.log("\nStep 4: Chainlink Automation calls performUpkeep");
        uint256 bankBalanceBefore = address(bank).balance;
        uint256 receiverBalanceBefore = receiver.balance;
        
        automation.performUpkeep("");
        
        uint256 bankBalanceAfter = address(bank).balance;
        uint256 receiverBalanceAfter = receiver.balance;
        
        console.log("  Bank balance after:", bankBalanceAfter);
        console.log("  Receiver balance after:", receiverBalanceAfter);
        console.log("  Amount transferred:", receiverBalanceAfter - receiverBalanceBefore);
        
        // Verify half was transferred
        assertEq(bankBalanceAfter, bankBalanceBefore / 2, "Bank should have half");
        assertEq(receiverBalanceAfter, receiverBalanceBefore + bankBalanceBefore / 2, "Receiver should have half");
        
        // After withdrawal, balance is 52 gwei, which is below threshold
        (bool upkeep4,) = automation.checkUpkeep("");
        console.log("\n  After withdrawal, upkeep needed:", upkeep4);
        assertFalse(upkeep4, "After withdrawal, balance should be below threshold");
        
        console.log("\n=== Complete Flow Test Passed! ===\n");
    }

    /// @notice Test that only admin (Automation) can withdraw
    function test_OnlyAutomationCanWithdraw() public {
        // Deposit some ETH
        vm.prank(user1);
        (bool sent,) = address(bank).call{value: 200 gwei}("");
        assertTrue(sent);
        
        // Try to withdraw as a random user - should fail
        vm.prank(user2);
        vm.expectRevert("Not admin");
        bank.withDraw(100 gwei, user2);
        
        // Try to withdraw as deployer - should fail (deployer is no longer admin)
        vm.prank(deployer);
        vm.expectRevert("Not admin");
        bank.withDraw(100 gwei, deployer);
    }

    /// @notice Test threshold can be updated
    function test_SetWithdrawThreshold() public {
        // Deposit 50 gwei
        vm.prank(user1);
        (bool sent,) = address(bank).call{value: 50 gwei}("");
        assertTrue(sent);
        
        // With 100 gwei threshold, upkeep should not be needed
        (bool upkeepNeeded1,) = automation.checkUpkeep("");
        assertFalse(upkeepNeeded1);
        
        // Lower threshold to 40 gwei
        automation.setWithdrawThreshold(40 gwei);
        
        // Now upkeep should be needed
        (bool upkeepNeeded2,) = automation.checkUpkeep("");
        assertTrue(upkeepNeeded2, "Upkeep should be needed after threshold lowered");
    }
}
