// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MemeFactory.sol";
import "../src/MemeToken.sol";

contract MemeFactoryTest is Test {
    MemeFactory public factory;
    address public issuer = address(0x111);
    address public user = address(0x222);

    function setUp() public {
        factory = new MemeFactory();
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
        assertEq(meme.totalSupply(), 100);

        (, uint256 currentSupply, , , ) = factory.memeInfos(memeAddr);
        assertEq(currentSupply, 100);
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
        // 1% = 0.01 ether to factory
        // 99% = 0.99 ether to issuer

        assertEq(
            factoryBalanceAfter - factoryBalanceBefore,
            0.01 ether,
            "Factory fee incorrect"
        );
        assertEq(
            issuerBalanceAfter - issuerBalanceBefore,
            0.99 ether,
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
        vm.expectRevert("Exceeds total supply");
        vm.prank(user);
        factory.mintMeme{value: 0.1 ether}(memeAddr);
    }
}
