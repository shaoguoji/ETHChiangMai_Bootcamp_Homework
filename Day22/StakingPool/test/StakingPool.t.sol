// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/StakingPool.sol";
import "../src/KKToken.sol";

contract StakingPoolTest is Test {
    StakingPool public pool;
    IToken public kkToken;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");

    uint256 public constant REWARD_PER_BLOCK = 10 ether;

    function setUp() public {
        pool = new StakingPool();
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

    function test_StakeMultipleTimes() public {
        vm.startPrank(alice);
        pool.stake{value: 1 ether}();
        pool.stake{value: 2 ether}();
        vm.stopPrank();

        assertEq(pool.balanceOf(alice), 3 ether);
        assertEq(pool.totalStaked(), 3 ether);
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

        // Advance 10 blocks
        vm.roll(block.number + 10);

        // Alice should earn all 100 KK tokens (10 blocks * 10 tokens/block)
        uint256 earnedTokens = pool.earned(alice);
        assertEq(earnedTokens, 100 ether);
    }

    function test_TwoUsersEqualStakesSplitRewards() public {
        // Alice stakes 1 ETH
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // Bob stakes 1 ETH in the same block
        vm.prank(bob);
        pool.stake{value: 1 ether}();

        // Advance 10 blocks
        vm.roll(block.number + 10);

        // Each should earn 50 KK tokens (half of 100)
        assertEq(pool.earned(alice), 50 ether);
        assertEq(pool.earned(bob), 50 ether);
    }

    function test_TwoUsersUnequalStakes() public {
        // Alice stakes 3 ETH
        vm.prank(alice);
        pool.stake{value: 3 ether}();

        // Bob stakes 1 ETH
        vm.prank(bob);
        pool.stake{value: 1 ether}();

        // Advance 10 blocks -> 100 KK tokens total
        vm.roll(block.number + 10);

        // Alice: 3/4 of rewards = 75 KK
        // Bob: 1/4 of rewards = 25 KK
        assertEq(pool.earned(alice), 75 ether);
        assertEq(pool.earned(bob), 25 ether);
    }

    function test_DelayedStaking() public {
        // Alice stakes 1 ETH at block 0
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // Advance 5 blocks (Alice earns all 50 KK)
        vm.roll(block.number + 5);

        // Bob stakes 1 ETH at block 5
        vm.prank(bob);
        pool.stake{value: 1 ether}();

        // Advance another 5 blocks (split 50 KK equally)
        vm.roll(block.number + 5);

        // Alice: 50 + 25 = 75 KK
        // Bob: 25 KK
        assertEq(pool.earned(alice), 75 ether);
        assertEq(pool.earned(bob), 25 ether);
    }

    // ============ Claim Tests ============

    function test_Claim() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // Advance 10 blocks
        vm.roll(block.number + 10);

        uint256 expectedReward = 100 ether;
        assertEq(pool.earned(alice), expectedReward);

        vm.prank(alice);
        pool.claim();

        // Check KK token balance
        assertEq(kkToken.balanceOf(alice), expectedReward);
        // Earned should be 0 after claim
        assertEq(pool.earned(alice), 0);
    }

    function test_ClaimMultipleTimes() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // First claim after 5 blocks
        vm.roll(block.number + 5);
        vm.prank(alice);
        pool.claim();
        assertEq(kkToken.balanceOf(alice), 50 ether);

        // Second claim after another 5 blocks
        vm.roll(block.number + 5);
        vm.prank(alice);
        pool.claim();
        assertEq(kkToken.balanceOf(alice), 100 ether);
    }

    function test_ClaimWithZeroReward() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // Claim immediately (same block, 0 rewards)
        vm.prank(alice);
        pool.claim();

        assertEq(kkToken.balanceOf(alice), 0);
    }

    // ============ Edge Cases ============

    function test_NoStakersNoRewards() public {
        // Advance blocks without any stakers
        vm.roll(block.number + 100);

        // accTokenPerStake should not increase when totalStaked is 0
        assertEq(pool.accTokenPerStake(), 0);
    }

    function test_StakeAfterIdlePeriod() public {
        // Advance 50 blocks with no stakers
        vm.roll(block.number + 50);

        // Alice stakes
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // Advance 10 more blocks
        vm.roll(block.number + 10);

        // Alice should only earn rewards from when she staked
        assertEq(pool.earned(alice), 100 ether);
    }

    function test_UnstakeAutoClaimsRewards() public {
        vm.prank(alice);
        pool.stake{value: 1 ether}();

        // Advance 10 blocks
        vm.roll(block.number + 10);

        // Unstake all - MasterChef pattern auto-claims pending rewards
        vm.prank(alice);
        pool.unstake(1 ether);

        // Rewards are auto-claimed during unstake (MasterChef pattern)
        assertEq(kkToken.balanceOf(alice), 100 ether);
        // No pending rewards left
        assertEq(pool.earned(alice), 0);
    }
}
