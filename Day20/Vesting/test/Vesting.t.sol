// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/MockERC20.sol";
import "../src/Vesting.sol";

contract VestingTest is Test {
    MockERC20 public token;
    Vesting public vesting;
    
    address public beneficiary = makeAddr("beneficiary");
    address public deployer = makeAddr("deployer");
    
    uint256 public constant TOTAL_AMOUNT = 1_000_000 * 1e18; // 1 million tokens
    uint256 public constant MONTH = 30 days;
    uint256 public constant CLIFF_MONTHS = 12;
    uint256 public constant VESTING_MONTHS = 24;

    function setUp() public {
        vm.startPrank(deployer);
        
        // Deploy token and mint to deployer
        token = new MockERC20("Test Token", "TEST");
        
        // Deploy vesting contract
        vesting = new Vesting(beneficiary, address(token), TOTAL_AMOUNT);
        
        // Transfer tokens to vesting contract
        token.transfer(address(vesting), TOTAL_AMOUNT);
        
        vm.stopPrank();
    }

    function test_InitialState() public view {
        assertEq(vesting.beneficiary(), beneficiary);
        assertEq(address(vesting.token()), address(token));
        assertEq(vesting.totalAmount(), TOTAL_AMOUNT);
        assertEq(vesting.released(), 0);
        assertEq(token.balanceOf(address(vesting)), TOTAL_AMOUNT);
    }

    function test_NoReleaseBeforeCliff() public {
        // At start
        assertEq(vesting.vestedAmount(), 0);
        assertEq(vesting.releasable(), 0);
        
        // 6 months in (still in cliff)
        vm.warp(block.timestamp + 6 * MONTH);
        assertEq(vesting.vestedAmount(), 0);
        assertEq(vesting.releasable(), 0);
        
        // 11 months in (still in cliff)
        vm.warp(block.timestamp + 5 * MONTH);
        assertEq(vesting.vestedAmount(), 0);
        assertEq(vesting.releasable(), 0);
    }

    function test_ReleaseFailsBeforeCliff() public {
        // Try to release during cliff
        vm.warp(block.timestamp + 6 * MONTH);
        
        vm.expectRevert("Vesting: no tokens to release");
        vesting.release();
    }

    function test_FirstMonthAfterCliff() public {
        // Warp to start of month 13 (just after cliff ends)
        vm.warp(block.timestamp + CLIFF_MONTHS * MONTH);
        
        // Should have 1/24 vested
        uint256 expectedVested = TOTAL_AMOUNT / VESTING_MONTHS; // 1/24
        assertEq(vesting.vestedAmount(), expectedVested);
        assertEq(vesting.releasable(), expectedVested);
        
        // Release tokens
        vesting.release();
        
        assertEq(vesting.released(), expectedVested);
        assertEq(token.balanceOf(beneficiary), expectedVested);
        assertEq(vesting.releasable(), 0);
    }

    function test_SecondMonthAfterCliff() public {
        // Warp to month 14 (2 months after cliff)
        vm.warp(block.timestamp + (CLIFF_MONTHS + 1) * MONTH);
        
        // Should have 2/24 vested
        uint256 expectedVested = (TOTAL_AMOUNT * 2) / VESTING_MONTHS;
        assertEq(vesting.vestedAmount(), expectedVested);
    }

    function test_HalfwayThroughVesting() public {
        // Warp to month 24 (12 months after cliff = halfway through vesting)
        vm.warp(block.timestamp + (CLIFF_MONTHS + 11) * MONTH);
        
        // Should have 12/24 = 50% vested
        uint256 expectedVested = (TOTAL_AMOUNT * 12) / VESTING_MONTHS;
        assertEq(vesting.vestedAmount(), expectedVested);
    }

    function test_FullVesting() public {
        // Warp to month 36 (end of vesting)
        vm.warp(block.timestamp + (CLIFF_MONTHS + VESTING_MONTHS) * MONTH);
        
        // Should have 100% vested
        assertEq(vesting.vestedAmount(), TOTAL_AMOUNT);
        assertEq(vesting.releasable(), TOTAL_AMOUNT);
        
        // Release all tokens
        vesting.release();
        
        assertEq(vesting.released(), TOTAL_AMOUNT);
        assertEq(token.balanceOf(beneficiary), TOTAL_AMOUNT);
        assertEq(token.balanceOf(address(vesting)), 0);
    }

    function test_AfterFullVesting() public {
        // Warp to month 48 (well past vesting end)
        vm.warp(block.timestamp + 48 * MONTH);
        
        // Should still be 100% vested (capped)
        assertEq(vesting.vestedAmount(), TOTAL_AMOUNT);
    }

    function test_MultipleReleases() public {
        // Release at month 13 (1/24)
        vm.warp(block.timestamp + CLIFF_MONTHS * MONTH);
        uint256 firstRelease = TOTAL_AMOUNT / VESTING_MONTHS;
        vesting.release();
        assertEq(token.balanceOf(beneficiary), firstRelease);
        
        // Release at month 15 (3/24 total, but 2/24 more)
        vm.warp(block.timestamp + 2 * MONTH);
        uint256 secondRelease = (TOTAL_AMOUNT * 3) / VESTING_MONTHS - firstRelease;
        vesting.release();
        assertEq(token.balanceOf(beneficiary), firstRelease + secondRelease);
        
        // Release at month 36 (all remaining)
        vm.warp(block.timestamp + 21 * MONTH);
        vesting.release();
        assertEq(token.balanceOf(beneficiary), TOTAL_AMOUNT);
    }

    function test_ReleaseAfterAlreadyReleased() public {
        // Release at month 13
        vm.warp(block.timestamp + CLIFF_MONTHS * MONTH);
        vesting.release();
        
        // Immediately try to release again (should fail)
        vm.expectRevert("Vesting: no tokens to release");
        vesting.release();
    }

    function test_MonthlyVestingSchedule() public {
        // First, warp to the cliff end (month 12)
        vm.warp(block.timestamp + CLIFF_MONTHS * MONTH);
        
        // Check vesting at each month after cliff
        for (uint256 i = 1; i <= VESTING_MONTHS; i++) {
            // Use the same formula as the contract to avoid rounding differences
            uint256 expectedVested = (TOTAL_AMOUNT * i) / VESTING_MONTHS;
            
            assertEq(vesting.vestedAmount(), expectedVested, string.concat("Month ", vm.toString(CLIFF_MONTHS + i)));
            
            // Move to next month (except after last iteration)
            if (i < VESTING_MONTHS) {
                vm.warp(block.timestamp + MONTH);
            }
        }
    }

    function test_GetCliffEndTime() public view {
        uint256 expected = block.timestamp + CLIFF_MONTHS * MONTH;
        assertEq(vesting.getCliffEndTime(), expected);
    }

    function test_GetVestingEndTime() public view {
        uint256 expected = block.timestamp + (CLIFF_MONTHS + VESTING_MONTHS) * MONTH;
        assertEq(vesting.getVestingEndTime(), expected);
    }

    function test_ConstructorValidations() public {
        vm.expectRevert("Vesting: beneficiary is zero address");
        new Vesting(address(0), address(token), TOTAL_AMOUNT);
        
        vm.expectRevert("Vesting: token is zero address");
        new Vesting(beneficiary, address(0), TOTAL_AMOUNT);
        
        vm.expectRevert("Vesting: total amount is zero");
        new Vesting(beneficiary, address(token), 0);
    }

    function test_EventEmission() public {
        vm.warp(block.timestamp + CLIFF_MONTHS * MONTH);
        
        uint256 expectedAmount = TOTAL_AMOUNT / VESTING_MONTHS;
        
        vm.expectEmit(true, false, false, true);
        emit Vesting.TokensReleased(beneficiary, expectedAmount);
        
        vesting.release();
    }
}
