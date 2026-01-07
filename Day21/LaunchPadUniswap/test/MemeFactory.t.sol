// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MemeFactory.sol";
import "../src/MemeToken.sol";
import "./mocks/MockUniswapV2Router.sol";

contract MemeFactoryTest is Test {
    MemeFactory public factory;
    address public issuer = address(0x111);
    address public user = address(0x222);

    MockUniswapV2Router public router;

    function setUp() public {
        router = new MockUniswapV2Router();
        factory = new MemeFactory(address(router));
        vm.deal(user, 100 ether);
    }

    function testDeployMeme() public {
        vm.prank(issuer);
        address memeAddr = factory.deployMeme("MEME", 1000, 10, 0.1 ether);

        MemeToken meme = MemeToken(memeAddr);
        assertEq(meme.symbol(), "MEME");
        assertEq(meme.name(), "MemeToken");
        assertEq(meme.totalSupply(), 0);

        (
            uint256 totalSupply,
            uint256 currentSupply,
            uint256 perMint,
            uint256 price,
            address _issuer
        ) = factory.memeInfos(memeAddr);
        assertEq(totalSupply, 1000);
        assertEq(currentSupply, 0);
        assertEq(perMint, 10);
        assertEq(price, 0.1 ether);
        assertEq(_issuer, issuer);
    }

    function testMintMeme() public {
        vm.prank(issuer);
        address memeAddr = factory.deployMeme("MEME", 1000, 100, 1 ether);

        vm.prank(user);
        factory.mintMeme{value: 1 ether}(memeAddr);

        MemeToken meme = MemeToken(memeAddr);
        assertEq(meme.balanceOf(user), 100);
        // 5% fee = 0.05 ETH. Price = 1 ETH/100 tokens = 0.01 ETH/token.
        // Liquidity tokens = 0.05 / 0.01 = 5 tokens.
        // Total supply = 100 + 5 = 105.
        assertEq(meme.totalSupply(), 105);

        (, uint256 currentSupply, , , ) = factory.memeInfos(memeAddr);
        assertEq(currentSupply, 105);
    }

    function testFeeDistribution() public {
        vm.prank(issuer);
        address memeAddr = factory.deployMeme("MEME", 1000, 100, 1 ether);

        uint256 issuerBalanceBefore = issuer.balance;
        uint256 factoryBalanceBefore = address(factory).balance;

        vm.prank(user);
        factory.mintMeme{value: 1 ether}(memeAddr);

        uint256 issuerBalanceAfter = issuer.balance;
        uint256 factoryBalanceAfter = address(factory).balance;

        // 1 ether total
        // 5% = 0.05 ether used for liquidity (sent to Router)
        // 95% = 0.95 ether to issuer

        // Factory balance shouldn't change (fee passed to router)
        assertEq(
            factoryBalanceAfter - factoryBalanceBefore,
            0,
            "Factory balance should not change"
        );
        assertEq(
            issuerBalanceAfter - issuerBalanceBefore,
            0.95 ether,
            "Issuer income incorrect"
        );
    }

    function testRefund() public {
        vm.prank(issuer);
        address memeAddr = factory.deployMeme("MEME", 1000, 100, 1 ether);

        uint256 userBalanceBefore = user.balance;

        // User sends 2 ether, price is 1 ether
        vm.prank(user);
        factory.mintMeme{value: 2 ether}(memeAddr);

        uint256 userBalanceAfter = user.balance;

        // User spent 1 ether effectively. 2 sent, 1 refunded.
        assertEq(
            userBalanceBefore - userBalanceAfter,
            1 ether,
            "Refund incorrect"
        );
    }

    function testSupplyCap() public {
        vm.prank(issuer);
        // Total supply 20, per mint 10. Can only mint twice.
        address memeAddr = factory.deployMeme("MEME", 20, 10, 0.1 ether);

        vm.prank(user);
        factory.mintMeme{value: 0.1 ether}(memeAddr);

        vm.prank(user);
        factory.mintMeme{value: 0.1 ether}(memeAddr);

        // Third time should fail
        vm.expectRevert("Exceeds total supply (including liquidity tokens)");
        vm.prank(user);
        factory.mintMeme{value: 0.1 ether}(memeAddr);
    }
}
