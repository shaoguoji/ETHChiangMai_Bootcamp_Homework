// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {CallOptionToken} from "../src/CallOptionToken.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

contract CallOptionTokenTest is Test {
    CallOptionToken public option;
    MockUSDT public usdt;

    address public issuer = makeAddr("issuer");
    address public user = makeAddr("user");
    address public buyer = makeAddr("buyer");

    // 行权价格：2000 USDT per ETH
    uint256 public constant STRIKE_PRICE = 2000 * 1e18;
    // 行权日期：7 天后
    uint256 public expirationDate;

    function setUp() public {
        // 设置行权日期为 7 天后
        expirationDate = block.timestamp + 7 days;

        // 部署 MockUSDT
        usdt = new MockUSDT();

        // 项目方部署期权合约
        vm.prank(issuer);
        option = new CallOptionToken(
            "ETH Call Option 2000",
            "ETH-CALL-2000",
            STRIKE_PRICE,
            expirationDate,
            address(usdt)
        );

        // 给项目方一些 ETH
        vm.deal(issuer, 100 ether);
        // 给用户一些 USDT 和 ETH（用于测试权限）
        usdt.mint(user, 100000 * 1e18);
        vm.deal(user, 10 ether);
        // 给买家一些 ETH 用于模拟购买期权
        vm.deal(buyer, 10 ether);
    }

    // ========== 发行测试 ==========

    function test_Issue() public {
        console.log("=== Test: Issue Option Tokens ===");

        vm.prank(issuer);
        option.issue{value: 10 ether}();

        // 验证期权 Token 余额
        assertEq(option.balanceOf(issuer), 10 ether, "Issuer should have 10 option tokens");
        // 验证合约 ETH 余额
        assertEq(option.totalEthDeposited(), 10 ether, "Contract should have 10 ETH deposited");

        console.log("Issuer option balance:", option.balanceOf(issuer) / 1e18, "tokens");
        console.log("Total ETH deposited:", option.totalEthDeposited() / 1e18, "ETH");
    }

    function test_Issue_OnlyIssuer() public {
        console.log("=== Test: Only Issuer Can Issue ===");

        vm.prank(user);
        vm.expectRevert(CallOptionToken.OnlyIssuer.selector);
        option.issue{value: 1 ether}();
    }

    function test_Issue_AfterExpiration() public {
        console.log("=== Test: Cannot Issue After Expiration ===");

        // 快进到过期后
        vm.warp(expirationDate + 1);

        vm.prank(issuer);
        vm.expectRevert(CallOptionToken.AlreadyExpired.selector);
        option.issue{value: 1 ether}();
    }

    // ========== 行权测试 ==========

    function test_Exercise() public {
        console.log("=== Test: User Exercise ===");

        // 1. 项目方发行期权
        vm.prank(issuer);
        option.issue{value: 10 ether}();

        // 2. 项目方转让期权 Token 给用户（模拟用户购买）
        vm.prank(issuer);
        option.transfer(user, 5 ether);

        console.log("User option balance before exercise:", option.balanceOf(user) / 1e18, "tokens");
        console.log("User ETH balance before exercise:", user.balance / 1e18, "ETH");

        // 3. 快进到行权日
        vm.warp(expirationDate);

        // 4. 用户授权 USDT
        vm.prank(user);
        usdt.approve(address(option), type(uint256).max);

        // 5. 用户行权 2 个期权 Token
        uint256 exerciseAmount = 2 ether;
        uint256 expectedUsdtCost = (exerciseAmount * STRIKE_PRICE) / 1e18;

        uint256 userEthBefore = user.balance;
        uint256 userUsdtBefore = usdt.balanceOf(user);

        vm.prank(user);
        option.exercise(exerciseAmount);

        // 验证结果
        assertEq(option.balanceOf(user), 3 ether, "User should have 3 option tokens left");
        assertEq(user.balance, userEthBefore + exerciseAmount, "User should receive 2 ETH");
        assertEq(usdt.balanceOf(user), userUsdtBefore - expectedUsdtCost, "User should pay USDT");

        console.log("User option balance after exercise:", option.balanceOf(user) / 1e18, "tokens");
        console.log("User ETH balance after exercise:", user.balance / 1e18, "ETH");
        console.log("USDT paid:", expectedUsdtCost / 1e18, "USDT");
    }

    function test_Exercise_BeforeExpiration() public {
        console.log("=== Test: Cannot Exercise Before Expiration Day ===");

        // 发行期权
        vm.prank(issuer);
        option.issue{value: 10 ether}();

        // 转让给用户
        vm.prank(issuer);
        option.transfer(user, 5 ether);

        // 授权 USDT
        vm.prank(user);
        usdt.approve(address(option), type(uint256).max);

        // 尝试在行权日前行权（应该失败）
        vm.prank(user);
        vm.expectRevert(CallOptionToken.NotExpirationDay.selector);
        option.exercise(1 ether);
    }

    function test_Exercise_AfterExpiration() public {
        console.log("=== Test: Cannot Exercise After Expiration Day ===");

        // 发行期权
        vm.prank(issuer);
        option.issue{value: 10 ether}();

        // 转让给用户
        vm.prank(issuer);
        option.transfer(user, 5 ether);

        // 授权 USDT
        vm.prank(user);
        usdt.approve(address(option), type(uint256).max);

        // 快进到行权日后一天
        vm.warp(expirationDate + 1 days);

        // 尝试行权（应该失败）
        vm.prank(user);
        vm.expectRevert(CallOptionToken.NotExpirationDay.selector);
        option.exercise(1 ether);
    }

    // ========== 过期销毁测试 ==========

    function test_ExpireRedeem() public {
        console.log("=== Test: Issuer Expire Redeem ===");

        // 1. 发行期权
        vm.prank(issuer);
        option.issue{value: 10 ether}();

        // 2. 转让部分给用户
        vm.prank(issuer);
        option.transfer(user, 5 ether);

        // 3. 用户在行权日行权一部分
        vm.warp(expirationDate);
        vm.startPrank(user);
        usdt.approve(address(option), type(uint256).max);
        option.exercise(2 ether);
        vm.stopPrank();

        console.log("After user exercise:");
        console.log("  Total ETH deposited:", option.totalEthDeposited() / 1e18, "ETH");
        console.log("  Total USDT received:", option.totalUsdtReceived() / 1e18, "USDT");
        console.log("  Issuer option balance:", option.balanceOf(issuer) / 1e18, "tokens");

        // 4. 快进到过期后
        vm.warp(expirationDate + 1 days);

        uint256 issuerEthBefore = issuer.balance;
        uint256 issuerUsdtBefore = usdt.balanceOf(issuer);

        // 5. 项目方赎回
        vm.prank(issuer);
        option.expireRedeem();

        // 验证结果
        // 项目方应该收到：8 ETH（10 - 2 用户行权）+ 4000 USDT（2 ETH * 2000）
        assertEq(issuer.balance, issuerEthBefore + 8 ether, "Issuer should receive remaining ETH");
        assertEq(usdt.balanceOf(issuer), issuerUsdtBefore + 4000 * 1e18, "Issuer should receive USDT");

        console.log("After expire redeem:");
        console.log("  Issuer ETH received:", (issuer.balance - issuerEthBefore + 10 ether) / 1e18, "ETH");
        console.log("  Issuer USDT received:", usdt.balanceOf(issuer) / 1e18, "USDT");
    }

    function test_ExpireRedeem_BeforeExpiration() public {
        console.log("=== Test: Cannot Expire Redeem Before Expiration ===");

        vm.prank(issuer);
        option.issue{value: 10 ether}();

        // 尝试在过期前赎回
        vm.prank(issuer);
        vm.expectRevert(CallOptionToken.NotExpiredYet.selector);
        option.expireRedeem();
    }

    // ========== 完整流程测试：模拟发行、购买、行权 ==========

    /**
     * @notice 完整场景模拟测试
     * 
     * 场景说明：
     * 1. 项目方创建期权：行权价 2000 USDT/ETH，7天后到期
     * 2. 项目方发行期权：存入 50 ETH，获得 50 期权 Token
     * 3. 用户购买期权：以较低价格（如 100 USDT/Token）从项目方购买
     * 4. 行权日到期：ETH 价格涨到 2500 USDT，用户行权获利
     * 5. 项目方过期赎回剩余资产
     */
    function test_FullFlow() public {
        console.log("=== Test: Full Option Lifecycle ===");
        console.log("Strike Price: 2000 USDT/ETH");
        console.log("Expiration: 7 days from now");

        // ================================================
        // Step 1: 项目方发行 50 ETH 的期权
        // ================================================
        console.log("\n[Step 1] Issuer issues 50 ETH worth of options");
        console.log("------------------------------------------------");
        
        uint256 issueAmount = 50 ether;
        vm.prank(issuer);
        option.issue{value: issueAmount}();
        
        console.log("  Issuer deposited:", issueAmount / 1e18, "ETH");
        console.log("  Issuer received:", option.balanceOf(issuer) / 1e18, "option tokens");
        console.log("  Contract ETH balance:", option.totalEthDeposited() / 1e18, "ETH");
        
        assertEq(option.balanceOf(issuer), issueAmount, "Issuer should have 50 option tokens");
        assertEq(option.totalEthDeposited(), issueAmount, "Contract should have 50 ETH");

        // ================================================
        // Step 2: 用户以较低价格购买期权（模拟 DEX/OTC 交易）
        // ================================================
        console.log("\n[Step 2] User buys 20 option tokens (simulating DEX trade)");
        console.log("------------------------------------------------------------");
        console.log("  Scenario: User pays ~100 USDT per option token");
        console.log("  (Much cheaper than strike price of 2000 USDT/ETH)");
        
        uint256 buyAmount = 20 ether; // 20 option tokens
        
        // 模拟用户支付 2000 USDT 购买 20 个期权（每个 100 USDT）
        uint256 optionPremium = 2000 * 1e18; // 期权费总计 2000 USDT
        
        // 用户支付 USDT 给项目方
        vm.prank(user);
        usdt.transfer(issuer, optionPremium);
        
        // 项目方转让期权 Token 给用户
        vm.prank(issuer);
        option.transfer(user, buyAmount);
        
        console.log("  User paid:", optionPremium / 1e18, "USDT (premium)");
        console.log("  User received:", option.balanceOf(user) / 1e18, "option tokens");
        console.log("  Issuer option balance:", option.balanceOf(issuer) / 1e18, "tokens");
        console.log("  Issuer USDT received:", usdt.balanceOf(issuer) / 1e18, "USDT");
        
        assertEq(option.balanceOf(user), buyAmount, "User should have 20 option tokens");

        // ================================================
        // Step 3: 快进到行权日
        // ================================================
        console.log("\n[Step 3] Time passes... Expiration day arrives");
        console.log("-----------------------------------------------");
        console.log("  Scenario: ETH price has risen to 2500 USDT!");
        console.log("  User's options are now 'in the money'");
        
        vm.warp(expirationDate);
        
        console.log("  Is expiration day:", option.isExpirationDay());
        assertTrue(option.isExpirationDay(), "Should be expiration day");

        // ================================================
        // Step 4: 用户行权 15 个期权
        // ================================================
        console.log("\n[Step 4] User exercises 15 option tokens");
        console.log("-----------------------------------------");
        
        uint256 exerciseAmount = 15 ether;
        uint256 usdtCost = (exerciseAmount * STRIKE_PRICE) / 1e18; // 15 * 2000 = 30000 USDT
        
        uint256 userEthBefore = user.balance;
        uint256 userUsdtBefore = usdt.balanceOf(user);
        
        console.log("  User ETH before:", userEthBefore / 1e18, "ETH");
        console.log("  User USDT before:", userUsdtBefore / 1e18, "USDT");
        console.log("  Exercising:", exerciseAmount / 1e18, "options");
        console.log("  USDT to pay:", usdtCost / 1e18, "USDT");
        
        vm.startPrank(user);
        usdt.approve(address(option), type(uint256).max);
        option.exercise(exerciseAmount);
        vm.stopPrank();
        
        console.log("\n  After exercise:");
        console.log("  User ETH balance:", user.balance / 1e18, "ETH");
        console.log("  User USDT balance:", usdt.balanceOf(user) / 1e18, "USDT");
        console.log("  User option tokens left:", option.balanceOf(user) / 1e18);
        
        // 计算用户收益
        // 用户支付：2000 USDT（期权费）+ 30000 USDT（行权费）= 32000 USDT
        // 用户获得：15 ETH（市价 2500 USDT/ETH = 37500 USDT）
        // 净收益：37500 - 32000 = 5500 USDT
        console.log("\n  === Profit Calculation ===");
        console.log("  If current ETH price is 2500 USDT:");
        console.log("    ETH value received: 15 * 2500 = 37500 USDT");
        console.log("    Total cost: 2000 (premium) + 30000 (strike) = 32000 USDT");
        console.log("    Net profit: 5500 USDT!");
        
        assertEq(user.balance, userEthBefore + exerciseAmount, "User should receive 15 ETH");
        assertEq(usdt.balanceOf(user), userUsdtBefore - usdtCost, "User should pay 30000 USDT");
        assertEq(option.balanceOf(user), 5 ether, "User should have 5 option tokens left");

        // ================================================
        // Step 5: 过期后项目方赎回
        // ================================================
        console.log("\n[Step 5] After expiration - Issuer redeems remaining assets");
        console.log("-------------------------------------------------------------");
        
        vm.warp(expirationDate + 1 days);
        
        console.log("  Is expired:", option.isExpired());
        console.log("  Remaining ETH in contract:", option.totalEthDeposited() / 1e18, "ETH");
        console.log("  USDT received from exercises:", option.totalUsdtReceived() / 1e18, "USDT");
        
        uint256 issuerEthBefore = issuer.balance;
        uint256 issuerUsdtBefore = usdt.balanceOf(issuer);
        
        vm.prank(issuer);
        option.expireRedeem();
        
        console.log("\n  After redeem:");
        console.log("  Issuer ETH balance:", issuer.balance / 1e18, "ETH");
        console.log("  Issuer USDT balance:", usdt.balanceOf(issuer) / 1e18, "USDT");
        console.log("  Remaining option supply:", option.totalSupply() / 1e18, "tokens");
        
        // 验证最终状态
        // 用户还持有 5 个未行权的期权 Token（现在已无价值）
        assertEq(option.balanceOf(user), 5 ether, "User should still hold 5 worthless tokens");
        
        // 项目方收入：
        // - 2000 USDT（期权费）
        // - 35 ETH（50 - 15 用户行权）
        // - 30000 USDT（用户行权支付）
        assertEq(issuer.balance, 100 ether - 50 ether + 35 ether, "Issuer ETH balance");
        assertEq(usdt.balanceOf(issuer), 2000 * 1e18 + 30000 * 1e18, "Issuer USDT balance");
        
        console.log("\n=== Summary ===");
        console.log("Issuer total received: 35 ETH + 32000 USDT");
        console.log("User exercised 15 options, got 15 ETH, holds 5 expired tokens");
    }

    // ========== 视图函数测试 ==========

    function test_GetOptionInfo() public {
        vm.prank(issuer);
        option.issue{value: 10 ether}();

        (
            address _issuer,
            uint256 _strikePrice,
            uint256 _expirationDate,
            address _usdt,
            uint256 _totalEthDeposited,
            uint256 _totalUsdtReceived,
            uint256 _totalSupply
        ) = option.getOptionInfo();

        assertEq(_issuer, issuer);
        assertEq(_strikePrice, STRIKE_PRICE);
        assertEq(_expirationDate, expirationDate);
        assertEq(_usdt, address(usdt));
        assertEq(_totalEthDeposited, 10 ether);
        assertEq(_totalUsdtReceived, 0);
        assertEq(_totalSupply, 10 ether);
    }
}
