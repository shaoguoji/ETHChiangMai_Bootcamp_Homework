// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StakingPool.sol";
import "../src/MockLendingPool.sol";
import "../src/KKToken.sol";

contract StakingPoolTest is Test {
    StakingPool public pool;
    MockLendingPool public lendingPool;
    IToken public kkToken;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant REWARD_PER_BLOCK = 10 ether;
    uint256 public constant INTEREST_RATE = 10; // 0.1% per block

    function setUp() public {
        // Deploy mock lending pool with 0.1% interest per block
        lendingPool = new MockLendingPool(INTEREST_RATE);
        
        // Fund lending pool with extra ETH for interest payments
        vm.deal(address(lendingPool), 1000 ether);
        
        // Deploy staking pool with lending integration
        pool = new StakingPool(address(lendingPool));
        kkToken = pool.kkToken();

        // Fund test accounts with ETH
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
    }

    // ============ Basic Staking Tests ============

    function test_Stake() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        assertEq(pool.balanceOf(alice), 1 ether);
        assertEq(pool.totalStaked(), 1 ether);
    }

    function test_StakeDepositsToLending() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // Check lending pool received the deposit
        assertEq(lendingPool.getBalance(address(pool)), 1 ether);
    }

    function test_StakeMultipleTimes() public {
        vm.startPrank(alice);
        pool.stake{value: 1 ether}();
        pool.stake{value: 2 ether}();
        vm.stopPrank();

        assertEq(pool.balanceOf(alice), 3 ether);
        assertEq(pool.totalStaked(), 3 ether);
        assertGe(lendingPool.getBalance(address(pool)), 3 ether);
    }

    function test_RevertStakeZero() public {
        vm.prank(alice);
        vm.expectRevert("Cannot stake 0");
        pool.stake{value: 0}();
    }

    // ============ Unstaking Tests ============

    function test_Unstake() public {
        vm.startPrank(alice);
        pool.stake{value: 2 ether}();
        pool.unstake(1 ether);
        vm.stopPrank();

        assertEq(pool.balanceOf(alice), 1 ether);
        assertEq(pool.totalStaked(), 1 ether);
        assertEq(alice.balance, 99 ether);
    }

    function test_UnstakeWithdrawsFromLending() public {
        vm.startPrank(alice);
        pool.stake{value: 2 ether}();
        
        uint256 lendingBalanceBefore = lendingPool.getBalance(address(pool));
        pool.unstake(1 ether);
        uint256 lendingBalanceAfter = lendingPool.getBalance(address(pool));
        vm.stopPrank();

        // Lending balance should decrease by approximately 1 ETH
        assertLt(lendingBalanceAfter, lendingBalanceBefore);
    }

    function test_UnstakeAll() public {
        vm.startPrank(alice);
        pool.stake{value: 2 ether}();
        pool.unstake(2 ether);
        vm.stopPrank();

        assertEq(pool.balanceOf(alice), 0);
        assertEq(pool.totalStaked(), 0);
        assertEq(alice.balance, 100 ether);
    }

    function test_RevertUnstakeZero() public {
        vm.startPrank(alice);
        pool.stake{value: 1 ether}();
        vm.expectRevert("Cannot unstake 0");
        pool.unstake(0);
        vm.stopPrank();
    }

    function test_RevertUnstakeInsufficientBalance() public {
        vm.startPrank(alice);
        pool.stake{value: 1 ether}();
        vm.expectRevert("Insufficient balance");
        pool.unstake(2 ether);
        vm.stopPrank();
    }

    // ============ Reward Calculation Tests ============

    function test_SingleUserEarnsAllRewards() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 10);

        uint256 earnedTokens = pool.earned(alice);
        assertEq(earnedTokens, 100 ether);
    }

    function test_TwoUsersEqualStakesSplitRewards() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.prank(bob);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 10);

        assertEq(pool.earned(alice), 50 ether);
        assertEq(pool.earned(bob), 50 ether);
    }

    function test_TwoUsersUnequalStakes() public {
        vm.prank(alice);
        pool.stake{value: 3 ether}();

        vm.prank(bob);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 10);

        assertEq(pool.earned(alice), 75 ether);
        assertEq(pool.earned(bob), 25 ether);
    }

    function test_DelayedStaking() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 5);

        vm.prank(bob);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 5);

        assertEq(pool.earned(alice), 75 ether);
        assertEq(pool.earned(bob), 25 ether);
    }

    // ============ Claim Tests ============

    function test_Claim() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 10);

        uint256 expectedReward = 100 ether;
        assertEq(pool.earned(alice), expectedReward);

        vm.prank(alice);
        pool.claim();

        assertEq(kkToken.balanceOf(alice), expectedReward);
        assertEq(pool.earned(alice), 0);
    }

    function test_ClaimMultipleTimes() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 5);
        vm.prank(alice);
        pool.claim();
        assertEq(kkToken.balanceOf(alice), 50 ether);

        vm.roll(block.number + 5);
        vm.prank(alice);
        pool.claim();
        assertEq(kkToken.balanceOf(alice), 100 ether);
    }

    function test_ClaimWithZeroReward() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.prank(alice);
        pool.claim();

        assertEq(kkToken.balanceOf(alice), 0);
    }

    // ============ Lending Integration Tests ============

    function test_LendingBalanceIncreases() public {
        vm.prank(alice);
        pool.stake{value: 10 ether}();

        uint256 initialBalance = pool.getLendingBalance();
        assertEq(initialBalance, 10 ether);

        // Advance blocks to accrue interest
        vm.roll(block.number + 100);

        uint256 balanceWithInterest = pool.getLendingBalance();
        
        // Balance should be greater due to interest
        // Interest = 10 ETH * 0.1% * 100 blocks = 1 ETH
        assertGt(balanceWithInterest, initialBalance);
        assertEq(balanceWithInterest, 11 ether); // 10 ETH + 1 ETH interest
    }

    function test_MultipleUsersLendingBalance() public {
        vm.prank(alice);
        pool.stake{value: 5 ether}();

        vm.prank(bob);
        pool.stake{value: 5 ether}();

        // Total lending balance should be 10 ETH
        assertEq(pool.getLendingBalance(), 10 ether);
    }

    // ============ Edge Cases ============

    function test_NoStakersNoRewards() public {
        vm.roll(block.number + 100);
        assertEq(pool.accTokenPerStake(), 0);
    }

    function test_StakeAfterIdlePeriod() public {
        vm.roll(block.number + 50);

        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 10);

        assertEq(pool.earned(alice), 100 ether);
    }

    function test_UnstakeAutoClaimsRewards() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        vm.roll(block.number + 10);

        vm.prank(alice);
        pool.unstake(1 ether);

        assertEq(kkToken.balanceOf(alice), 100 ether);
        assertEq(pool.earned(alice), 0);
    }
}
