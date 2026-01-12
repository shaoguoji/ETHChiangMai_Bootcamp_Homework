// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {DeflationaryToken} from "../src/DeflationaryToken.sol";

contract DeflationaryTokenTest is Test {
    DeflationaryToken public token;
    
    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 ether; // 100万个代币
    uint256 public constant PRECISION = 1e18;
    
    function setUp() public {
        token = new DeflationaryToken("Deflationary Token", "DFT", INITIAL_SUPPLY);
    }
    
    // ============ Initial State Tests ============
    
    function testInitialBalance() public view {
        assertEq(token.balanceOf(address(this)), INITIAL_SUPPLY);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.sharesOf(address(this)), INITIAL_SUPPLY);
        assertEq(token.totalShares(), INITIAL_SUPPLY);
    }
    
    function testInitialRebaseRatio() public view {
        assertEq(token.rebaseRatio(), PRECISION);
        assertEq(token.lastRebaseYear(), 0);
        assertEq(token.getCurrentYear(), 0);
    }
    
    // ============ Rebase Tests ============
    
    function testCannotRebaseInFirstYear() public {
        assertFalse(token.canRebase());
        vm.expectRevert("Already rebased this year");
        token.rebase();
    }
    
    function testRebaseAfterOneYear() public {
        // 模拟时间推进 1 年
        vm.warp(block.timestamp + 365 days);
        
        assertTrue(token.canRebase());
        assertEq(token.getCurrentYear(), 1);
        
        uint256 balanceBefore = token.balanceOf(address(this));
        uint256 sharesBefore = token.sharesOf(address(this));
        
        token.rebase();
        
        uint256 balanceAfter = token.balanceOf(address(this));
        uint256 sharesAfter = token.sharesOf(address(this));
        
        // Shares 不变
        assertEq(sharesAfter, sharesBefore);
        
        // Balance 下降 1%
        uint256 expectedBalance = (balanceBefore * 99) / 100;
        assertEq(balanceAfter, expectedBalance);
        
        // TotalSupply 也下降 1%
        assertEq(token.totalSupply(), expectedBalance);
        
        // Ratio 更新正确
        assertEq(token.rebaseRatio(), (PRECISION * 99) / 100);
        assertEq(token.lastRebaseYear(), 1);
        
        console.log("Balance before rebase:", balanceBefore);
        console.log("Balance after rebase:", balanceAfter);
        console.log("Deflation amount:", balanceBefore - balanceAfter);
    }
    
    function testRebaseAfterMultipleYears() public {
        // 模拟时间推进 3 年
        vm.warp(block.timestamp + 3 * 365 days);
        
        assertEq(token.getCurrentYear(), 3);
        
        uint256 balanceBefore = token.balanceOf(address(this));
        
        token.rebase();
        
        uint256 balanceAfter = token.balanceOf(address(this));
        
        // 复合通缩 3 次: balance * 99/100 * 99/100 * 99/100
        uint256 expectedBalance = balanceBefore;
        for (uint256 i = 0; i < 3; i++) {
            expectedBalance = (expectedBalance * 99) / 100;
        }
        assertEq(balanceAfter, expectedBalance);
        
        // Ratio 也是复合计算
        uint256 expectedRatio = PRECISION;
        for (uint256 i = 0; i < 3; i++) {
            expectedRatio = (expectedRatio * 99) / 100;
        }
        assertEq(token.rebaseRatio(), expectedRatio);
        assertEq(token.lastRebaseYear(), 3);
        
        console.log("Balance before 3-year rebase:", balanceBefore);
        console.log("Balance after 3-year rebase:", balanceAfter);
        console.log("Total deflation:", balanceBefore - balanceAfter);
    }
    
    function testCannotRebaseSameYear() public {
        vm.warp(block.timestamp + 365 days);
        token.rebase();
        
        // 同年再次 rebase 应该失败
        vm.expectRevert("Already rebased this year");
        token.rebase();
        
        // 再过半年还是同一年
        vm.warp(block.timestamp + 180 days);
        vm.expectRevert("Already rebased this year");
        token.rebase();
    }
    
    function testRebaseInConsecutiveYears() public {
        // 第 1 年
        vm.warp(block.timestamp + 365 days);
        token.rebase();
        assertEq(token.lastRebaseYear(), 1);
        
        // 第 2 年
        vm.warp(block.timestamp + 365 days);
        token.rebase();
        assertEq(token.lastRebaseYear(), 2);
        
        // 验证 ratio 是两次 99/100
        uint256 expectedRatio = (PRECISION * 99 / 100) * 99 / 100;
        assertEq(token.rebaseRatio(), expectedRatio);
    }
    
    // ============ Transfer Tests ============
    
    function testTransferBeforeRebase() public {
        uint256 transferAmount = 1000 ether;
        
        token.transfer(alice, transferAmount);
        
        assertEq(token.balanceOf(alice), transferAmount);
        assertEq(token.balanceOf(address(this)), INITIAL_SUPPLY - transferAmount);
    }
    
    function testTransferAfterRebase() public {
        uint256 transferAmount = 1000 ether;
        token.transfer(alice, transferAmount);
        
        // 1 年后 rebase
        vm.warp(block.timestamp + 365 days);
        token.rebase();
        
        // 两个用户的余额都下降 1%
        uint256 expectedAliceBalance = (transferAmount * 99) / 100;
        uint256 expectedThisBalance = ((INITIAL_SUPPLY - transferAmount) * 99) / 100;
        
        assertEq(token.balanceOf(alice), expectedAliceBalance);
        assertEq(token.balanceOf(address(this)), expectedThisBalance);
        
        // Rebase 后再转账
        uint256 aliceBalanceBefore = token.balanceOf(alice);
        uint256 bobTransfer = 100 ether;
        
        vm.prank(alice);
        token.transfer(bob, bobTransfer);
        
        // 由于精度问题（shares 与 balance 转换），使用 assertApproxEqAbs
        assertApproxEqAbs(token.balanceOf(bob), bobTransfer, 2);
        assertApproxEqAbs(token.balanceOf(alice), aliceBalanceBefore - bobTransfer, 2);
    }
    
    // ============ Approval & TransferFrom Tests ============
    
    function testApproveAndTransferFrom() public {
        uint256 approveAmount = 500 ether;
        uint256 transferAmount = 200 ether;
        
        token.approve(alice, approveAmount);
        assertEq(token.allowance(address(this), alice), approveAmount);
        
        vm.prank(alice);
        token.transferFrom(address(this), bob, transferAmount);
        
        assertEq(token.balanceOf(bob), transferAmount);
    }
    
    function testAllowanceAfterRebase() public {
        uint256 approveAmount = 500 ether;
        token.approve(alice, approveAmount);
        
        // 1 年后 rebase
        vm.warp(block.timestamp + 365 days);
        token.rebase();
        
        // 授权额度也应该随 rebase 调整
        uint256 expectedAllowance = (approveAmount * 99) / 100;
        assertEq(token.allowance(address(this), alice), expectedAllowance);
    }
    
    // ============ Edge Cases ============
    
    function testRebaseWithZeroBalance() public {
        // 转走所有代币
        token.transfer(alice, INITIAL_SUPPLY);
        assertEq(token.balanceOf(address(this)), 0);
        
        // 1 年后 rebase
        vm.warp(block.timestamp + 365 days);
        token.rebase();
        
        // 0 的 99% 还是 0
        assertEq(token.balanceOf(address(this)), 0);
        
        // Alice 的余额下降 1%
        assertEq(token.balanceOf(alice), (INITIAL_SUPPLY * 99) / 100);
    }
    
    function testLongTermDeflation() public {
        // 模拟 10 年
        vm.warp(block.timestamp + 10 * 365 days);
        token.rebase();
        
        uint256 balance = token.balanceOf(address(this));
        
        // 验证通缩后余额在预期范围内（由于复合计算精度问题，允许微小误差）
        // 10 年后: 0.99^10 ≈ 0.9044 (约 90.4%)
        uint256 minExpected = (INITIAL_SUPPLY * 904) / 1000; // 90.4%
        uint256 maxExpected = (INITIAL_SUPPLY * 905) / 1000; // 90.5%
        
        assertTrue(balance >= minExpected && balance <= maxExpected, "Balance should be ~90.4% after 10 years");
        
        // 10 年后余额约为初始的 90.4%
        console.log("Initial supply:", INITIAL_SUPPLY);
        console.log("Balance after 10 years:", balance);
        console.log("Percentage remaining:", (balance * 100) / INITIAL_SUPPLY, "%");
    }
}
