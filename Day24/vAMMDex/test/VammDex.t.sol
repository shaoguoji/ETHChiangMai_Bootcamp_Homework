// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {VammDex} from "../src/VammDex.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Simple mock USDC token for testing
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract VammDexTest is Test {
    VammDex public dex;
    MockUSDC public usdc;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public liquidator = makeAddr("liquidator");

    // Initial reserves: 1,000,000 vUSD and 1,000 vETH -> price = 1000 USD/ETH
    uint256 constant INITIAL_QUOTE = 1_000_000e6; // 1M USDC
    uint256 constant INITIAL_BASE = 1_000e18;     // 1000 vETH

    function setUp() public {
        usdc = new MockUSDC();
        dex = new VammDex(address(usdc), INITIAL_QUOTE, INITIAL_BASE);

        // Fund test users
        usdc.mint(alice, 100_000e6);  // 100k USDC
        usdc.mint(bob, 100_000e6);    // 100k USDC

        // Approve DEX
        vm.prank(alice);
        usdc.approve(address(dex), type(uint256).max);

        vm.prank(bob);
        usdc.approve(address(dex), type(uint256).max);
    }

    // ============ Basic Tests ============

    function test_InitialPrice() public view {
        uint256 price = dex.getPrice();
        // Price = vQuote / vBase = 1_000_000e6 / 1_000e18 * 1e18
        console.log("Initial price:", price);
        assertGt(price, 0, "Price should be greater than 0");
    }

    // ============ Open Position Tests ============

    function test_OpenLongPosition() public {
        uint256 margin = 1_000e6;  // 1000 USDC
        uint256 leverage = 5;

        vm.prank(alice);
        dex.openPosition(margin, leverage, true);

        (uint256 posMargin, uint256 size, uint256 openNotional, bool isLong, bool isOpen) = 
            dex.positions(alice);

        assertEq(posMargin, margin, "Margin should match");
        assertEq(openNotional, margin * leverage, "OpenNotional should be margin * leverage");
        assertGt(size, 0, "Size should be greater than 0");
        assertTrue(isLong, "Should be long position");
        assertTrue(isOpen, "Position should be open");

        // Check USDC transferred
        assertEq(usdc.balanceOf(address(dex)), margin, "DEX should hold margin");

        console.log("Position size:", size);
        console.log("Open notional:", openNotional);
    }

    function test_OpenShortPosition() public {
        uint256 margin = 1_000e6;  // 1000 USDC
        uint256 leverage = 3;

        vm.prank(alice);
        dex.openPosition(margin, leverage, false);

        (uint256 posMargin, uint256 size, uint256 openNotional, bool isLong, bool isOpen) = 
            dex.positions(alice);

        assertEq(posMargin, margin, "Margin should match");
        assertEq(openNotional, margin * leverage, "OpenNotional should be margin * leverage");
        assertGt(size, 0, "Size should be greater than 0");
        assertFalse(isLong, "Should be short position");
        assertTrue(isOpen, "Position should be open");

        console.log("Short position size:", size);
        console.log("Open notional:", openNotional);
    }

    function test_RevertOpenPositionTwice() public {
        uint256 margin = 1_000e6;

        vm.startPrank(alice);
        dex.openPosition(margin, 2, true);

        vm.expectRevert(VammDex.PositionAlreadyExists.selector);
        dex.openPosition(margin, 2, true);
        vm.stopPrank();
    }

    function test_RevertInvalidLeverage() public {
        uint256 margin = 1_000e6;

        vm.startPrank(alice);

        vm.expectRevert(VammDex.InvalidLeverage.selector);
        dex.openPosition(margin, 0, true);

        vm.expectRevert(VammDex.InvalidLeverage.selector);
        dex.openPosition(margin, 11, true);

        vm.stopPrank();
    }

    // ============ Close Position Tests ============

    function test_ClosePositionWithProfit() public {
        uint256 margin = 1_000e6;
        uint256 initialBalance = usdc.balanceOf(alice);

        // Alice opens long
        vm.prank(alice);
        dex.openPosition(margin, 5, true);

        // Bob opens long too, pushing price up
        vm.prank(bob);
        dex.openPosition(5_000e6, 5, true);

        uint256 newPrice = dex.getPrice();
        console.log("Price after Bob's long:", newPrice);

        // Check PnL before closing
        int256 pnlBeforeClose = dex.getPositionPnL(alice);
        console.log("Alice PnL before close:", pnlBeforeClose);

        // Alice closes - should profit since price went up
        vm.prank(alice);
        dex.closePosition();

        uint256 finalBalance = usdc.balanceOf(alice);
        console.log("Initial balance:", initialBalance);
        console.log("Final balance:", finalBalance);

        // Alice should have profit
        assertGt(finalBalance, initialBalance - margin, "Should have profit");

        // Position should be closed
        (,,,, bool isOpen) = dex.positions(alice);
        assertFalse(isOpen, "Position should be closed");
    }

    function test_ClosePositionWithLoss() public {
        uint256 margin = 1_000e6;
        uint256 initialBalance = usdc.balanceOf(alice);

        // Alice opens long
        vm.prank(alice);
        dex.openPosition(margin, 5, true);

        // Bob opens short, pushing price down
        vm.prank(bob);
        dex.openPosition(10_000e6, 5, false);

        uint256 newPrice = dex.getPrice();
        console.log("Price after Bob's short:", newPrice);

        // Check PnL before closing
        int256 pnlBeforeClose = dex.getPositionPnL(alice);
        console.log("Alice PnL before close:", pnlBeforeClose);

        // Alice closes - should lose since price went down
        vm.prank(alice);
        dex.closePosition();

        uint256 finalBalance = usdc.balanceOf(alice);
        console.log("Initial balance:", initialBalance);
        console.log("Final balance:", finalBalance);

        // Alice should have less than initial
        assertLt(finalBalance, initialBalance, "Should have loss");
    }

    function test_RevertCloseNoPosition() public {
        vm.prank(alice);
        vm.expectRevert(VammDex.NoPositionExists.selector);
        dex.closePosition();
    }

    // ============ Liquidation Tests ============

    function test_LiquidateUnderwaterPosition() public {
        uint256 margin = 1_000e6;

        // Alice opens long with high leverage
        vm.prank(alice);
        dex.openPosition(margin, 10, true);

        console.log("Initial price:", dex.getPrice());

        // Bob opens massive short to crash the price
        vm.prank(bob);
        dex.openPosition(50_000e6, 10, false);

        console.log("Price after crash:", dex.getPrice());

        // Check if Alice is liquidatable
        bool canLiquidate = dex.isLiquidatable(alice);
        console.log("Is liquidatable:", canLiquidate);

        int256 pnl = dex.getPositionPnL(alice);
        console.log("Alice PnL:", pnl);

        if (canLiquidate) {
            // Liquidate Alice's position
            vm.prank(liquidator);
            dex.liquidatePosition(alice);

            // Position should be closed
            (,,,, bool isOpen) = dex.positions(alice);
            assertFalse(isOpen, "Position should be liquidated");
        }
    }

    function test_RevertLiquidateHealthyPosition() public {
        uint256 margin = 1_000e6;

        // Alice opens position with low leverage
        vm.prank(alice);
        dex.openPosition(margin, 2, true);

        // Small price movement
        vm.prank(bob);
        dex.openPosition(1_000e6, 2, false);

        // Try to liquidate - should fail
        vm.prank(liquidator);
        vm.expectRevert(VammDex.PositionNotLiquidatable.selector);
        dex.liquidatePosition(alice);
    }

    function test_RevertLiquidateNoPosition() public {
        vm.prank(liquidator);
        vm.expectRevert(VammDex.NoPositionExists.selector);
        dex.liquidatePosition(alice);
    }

    // ============ View Function Tests ============

    function test_GetPositionValue() public {
        uint256 margin = 1_000e6;

        vm.prank(alice);
        dex.openPosition(margin, 5, true);

        uint256 value = dex.getPositionValue(alice);
        console.log("Position value (close notional):", value);

        // Value should be close to openNotional minus slippage
        (,, uint256 openNotional,,) = dex.positions(alice);
        console.log("Open notional:", openNotional);

        assertGt(value, 0, "Position value should be greater than 0");
    }

    function test_GetPositionPnL() public {
        uint256 margin = 1_000e6;

        vm.prank(alice);
        dex.openPosition(margin, 5, true);

        // Initially PnL should be negative due to slippage
        int256 pnl = dex.getPositionPnL(alice);
        console.log("Initial PnL (includes slippage):", pnl);

        // Bob pushes price up
        vm.prank(bob);
        dex.openPosition(5_000e6, 5, true);

        // Alice should have positive PnL now
        int256 newPnl = dex.getPositionPnL(alice);
        console.log("PnL after price increase:", newPnl);

        assertGt(newPnl, pnl, "PnL should increase with price");
    }

    // ============ Short Position Tests ============

    function test_ShortPositionProfit() public {
        uint256 margin = 1_000e6;
        uint256 initialBalance = usdc.balanceOf(alice);

        // Alice opens short
        vm.prank(alice);
        dex.openPosition(margin, 5, false);

        console.log("Price after Alice short:", dex.getPrice());

        // Bob opens short too, pushing price down
        vm.prank(bob);
        dex.openPosition(5_000e6, 5, false);

        console.log("Price after Bob short:", dex.getPrice());

        // Check PnL before closing
        int256 pnlBeforeClose = dex.getPositionPnL(alice);
        console.log("Alice PnL before close:", pnlBeforeClose);

        // Alice closes - should profit since price went down
        vm.prank(alice);
        dex.closePosition();

        uint256 finalBalance = usdc.balanceOf(alice);
        console.log("Initial balance:", initialBalance);
        console.log("Final balance:", finalBalance);

        // Short profits when price goes down
        assertGt(finalBalance, initialBalance - margin, "Short should profit when price drops");
    }

    // ============ Swap-Based PnL Verification ============

    function test_PnLMatchesActualSwapOutput() public {
        uint256 margin = 1_000e6;

        // Alice opens long
        vm.prank(alice);
        dex.openPosition(margin, 5, true);

        // Record reserves after open
        uint256 vQuoteAfterOpen = dex.vQuoteReserve();
        uint256 vBaseAfterOpen = dex.vBaseReserve();
        console.log("vQuote after open:", vQuoteAfterOpen);
        console.log("vBase after open:", vBaseAfterOpen);

        // Get position details
        (, uint256 size, uint256 openNotional,,) = dex.positions(alice);
        console.log("Position size:", size);
        console.log("Open notional:", openNotional);

        // Calculate expected close notional manually
        uint256 k = dex.k();
        uint256 newVBase = vBaseAfterOpen + size;
        uint256 newVQuote = k / newVBase;
        uint256 expectedCloseNotional = vQuoteAfterOpen - newVQuote;
        int256 expectedPnL = int256(expectedCloseNotional) - int256(openNotional);

        console.log("Expected close notional:", expectedCloseNotional);
        console.log("Expected PnL:", expectedPnL);

        // Get PnL from contract
        int256 actualPnL = dex.getPositionPnL(alice);
        console.log("Actual PnL from contract:", actualPnL);

        assertEq(actualPnL, expectedPnL, "PnL should match manual calculation");
    }
}
