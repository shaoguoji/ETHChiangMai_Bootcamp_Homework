// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {GovToken} from "../src/GovToken.sol";
import {Bank} from "../src/Bank.sol";
import {BankGovernor} from "../src/BankGovernor.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

contract DaoBankTest is Test {
    GovToken public token;
    Bank public bank;
    BankGovernor public governor;

    address public deployer = makeAddr("deployer");
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public recipient = makeAddr("recipient");

    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether;
    uint256 public constant BANK_DEPOSIT = 10 ether;

    function setUp() public {
        vm.startPrank(deployer);

        // Deploy GovToken with initial supply
        token = new GovToken("Governance Token", "GOV", INITIAL_SUPPLY);

        // Deploy Governor
        governor = new BankGovernor(token);

        // Deploy Bank with Governor as admin
        bank = new Bank(address(governor));

        // Distribute tokens
        token.transfer(alice, 400_000 ether); // 40%
        token.transfer(bob, 100_000 ether);   // 10%
        // deployer keeps 500_000 ether (50%)

        vm.stopPrank();

        // Delegate voting power (users must delegate to themselves to vote)
        vm.prank(deployer);
        token.delegate(deployer);
        vm.prank(alice);
        token.delegate(alice);
        vm.prank(bob);
        token.delegate(bob);

        // Fund the bank
        vm.deal(address(bank), BANK_DEPOSIT);
    }

    // ==================== Bank Tests ====================

    function test_BankDeposit() public {
        uint256 depositAmount = 1 ether;
        uint256 balanceBefore = address(bank).balance;

        vm.deal(alice, depositAmount);
        vm.prank(alice);
        bank.deposit{value: depositAmount}();

        assertEq(address(bank).balance, balanceBefore + depositAmount);
    }

    function test_BankReceiveETH() public {
        uint256 depositAmount = 1 ether;
        uint256 balanceBefore = address(bank).balance;

        vm.deal(alice, depositAmount);
        vm.prank(alice);
        (bool success,) = address(bank).call{value: depositAmount}("");
        assertTrue(success);

        assertEq(address(bank).balance, balanceBefore + depositAmount);
    }

    function test_BankWithdrawOnlyAdmin() public {
        // Non-admin should not be able to withdraw
        vm.prank(alice);
        vm.expectRevert(Bank.OnlyAdmin.selector);
        bank.withdraw(alice, 1 ether);
    }

    function test_BankWithdrawByGovernor() public {
        // Governor (admin) can withdraw
        uint256 withdrawAmount = 1 ether;
        uint256 recipientBalanceBefore = recipient.balance;

        vm.prank(address(governor));
        bank.withdraw(recipient, withdrawAmount);

        assertEq(recipient.balance, recipientBalanceBefore + withdrawAmount);
    }

    // ==================== Governor Tests ====================

    function test_GovernorSettings() public view {
        assertEq(governor.votingDelay(), 1);
        assertEq(governor.votingPeriod(), 50400);
        assertEq(governor.proposalThreshold(), 0);
    }

    // ==================== Full Proposal Lifecycle ====================

    function test_ProposalLifecycle() public {
        console.log("=== DAO Bank Proposal Lifecycle Test ===");
        console.log("");

        // Step 1: Create a proposal to withdraw 5 ETH to recipient
        uint256 withdrawAmount = 5 ether;
        
        address[] memory targets = new address[](1);
        targets[0] = address(bank);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(Bank.withdraw.selector, recipient, withdrawAmount);
        
        string memory description = "Proposal #1: Withdraw 5 ETH to recipient";

        console.log("Step 1: Creating proposal...");
        console.log("  - Withdraw amount:", withdrawAmount);
        console.log("  - Recipient:", recipient);
        
        vm.prank(alice);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        console.log("  - Proposal ID:", proposalId);
        
        // Check proposal state is Pending
        IGovernor.ProposalState state = governor.state(proposalId);
        assertEq(uint8(state), uint8(IGovernor.ProposalState.Pending));
        console.log("  - State: Pending");
        console.log("");

        // Step 2: Wait for voting delay to pass
        console.log("Step 2: Advancing past voting delay...");
        vm.roll(block.number + governor.votingDelay() + 1);
        
        state = governor.state(proposalId);
        assertEq(uint8(state), uint8(IGovernor.ProposalState.Active));
        console.log("  - State: Active");
        console.log("");

        // Step 3: Cast votes
        console.log("Step 3: Casting votes...");
        
        // Alice votes For (40% of supply)
        vm.prank(alice);
        governor.castVote(proposalId, 1); // 1 = For
        console.log("  - Alice voted: For (400,000 GOV)");
        
        // Bob votes Against (10% of supply)
        vm.prank(bob);
        governor.castVote(proposalId, 0); // 0 = Against
        console.log("  - Bob voted: Against (100,000 GOV)");
        
        // Deployer votes For (50% of supply)
        vm.prank(deployer);
        governor.castVote(proposalId, 1); // 1 = For
        console.log("  - Deployer voted: For (500,000 GOV)");
        
        (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) = governor.proposalVotes(proposalId);
        console.log("");
        console.log("  Vote Tally:");
        console.log("    For:", forVotes);
        console.log("    Against:", againstVotes);
        console.log("    Abstain:", abstainVotes);
        console.log("");

        // Step 4: Wait for voting period to end
        console.log("Step 4: Advancing past voting period...");
        vm.roll(block.number + governor.votingPeriod() + 1);
        
        state = governor.state(proposalId);
        assertEq(uint8(state), uint8(IGovernor.ProposalState.Succeeded));
        console.log("  - State: Succeeded");
        console.log("");

        // Step 5: Execute proposal
        console.log("Step 5: Executing proposal...");
        uint256 bankBalanceBefore = address(bank).balance;
        uint256 recipientBalanceBefore = recipient.balance;
        console.log("  - Bank balance before:", bankBalanceBefore);
        console.log("  - Recipient balance before:", recipientBalanceBefore);
        
        bytes32 descriptionHash = keccak256(bytes(description));
        governor.execute(targets, values, calldatas, descriptionHash);
        
        uint256 bankBalanceAfter = address(bank).balance;
        uint256 recipientBalanceAfter = recipient.balance;
        console.log("  - Bank balance after:", bankBalanceAfter);
        console.log("  - Recipient balance after:", recipientBalanceAfter);
        
        state = governor.state(proposalId);
        assertEq(uint8(state), uint8(IGovernor.ProposalState.Executed));
        console.log("  - State: Executed");
        console.log("");

        // Verify the withdrawal happened
        assertEq(bankBalanceAfter, bankBalanceBefore - withdrawAmount);
        assertEq(recipientBalanceAfter, recipientBalanceBefore + withdrawAmount);
        
        console.log("=== Proposal Lifecycle Complete ===");
        console.log("Successfully withdrew", withdrawAmount, "wei via DAO vote!");
    }

    function test_ProposalDefeated() public {
        // Create a proposal
        address[] memory targets = new address[](1);
        targets[0] = address(bank);
        
        uint256[] memory values = new uint256[](1);
        values[0] = 0;
        
        bytes[] memory calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSelector(Bank.withdraw.selector, recipient, 1 ether);
        
        string memory description = "Proposal #2: Defeated proposal";

        vm.prank(alice);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Wait for voting delay
        vm.roll(block.number + governor.votingDelay() + 1);

        // Only Bob votes For (10%), which is below quorum (4% but need majority)
        // Alice and Deployer vote Against
        vm.prank(alice);
        governor.castVote(proposalId, 0); // Against
        
        vm.prank(deployer);
        governor.castVote(proposalId, 0); // Against
        
        vm.prank(bob);
        governor.castVote(proposalId, 1); // For

        // Wait for voting period to end
        vm.roll(block.number + governor.votingPeriod() + 1);

        // Proposal should be Defeated
        IGovernor.ProposalState state = governor.state(proposalId);
        assertEq(uint8(state), uint8(IGovernor.ProposalState.Defeated));
    }
}
