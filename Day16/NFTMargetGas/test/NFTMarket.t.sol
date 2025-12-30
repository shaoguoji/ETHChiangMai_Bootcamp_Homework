// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
// import { StdInvariant } from "forge-std/StdInvariant.sol";
import {console} from "forge-std/console.sol";

import {NFTMarket} from "../src/NFTMarket.sol";
import {HookERC20} from "../src/HookERC20.sol";
import {BaseERC721} from "../src/BaseERC721.sol";

contract NFTMarketTest is Test {
    NFTMarket public nftMarket;
    HookERC20 public hookERC20;
    BaseERC721 public baseERC721;

    address saler = makeAddr("saler");
    address buyer = makeAddr("buyer");

    event logList(address saler, uint256 tokenId, uint256 price);
    event logBuy(address buyer, uint256 tokenId, uint256 price);

    function setUp() public {
        hookERC20 = new HookERC20();
        baseERC721 = new BaseERC721("NTF", "NFT", "http://baseuri");
        nftMarket = new NFTMarket(address(hookERC20), address(baseERC721));

        // mint 4
        for (uint i = 1; i <= 4; i++) {
            baseERC721.mint(saler, i);
        }

        // deal(address(hookERC20), saler, 100);
        deal(address(hookERC20), buyer, 1000);
        deal(address(hookERC20), saler, 1000);

        vm.prank(saler);
        // baseERC721.setApprovalForAll(address(nftMarket), true);
        hookERC20.approve(address(nftMarket), 1000);
        vm.prank(buyer);
        hookERC20.approve(address(nftMarket), 1000);
    }

    function test_NFTMarketList() public {
        vm.startPrank(saler);
        console.log("test failed zero price...");
        vm.expectRevert(NFTMarket.ZeroValue.selector);
        nftMarket.list(1, 0);
        console.log("test failed list not approved for all");
        vm.expectRevert(NFTMarket.OwnerNotApprove.selector);
        nftMarket.list(1, 100);
        vm.stopPrank();

        console.log("test failed list not owner");
        vm.prank(buyer);
        vm.expectRevert(NFTMarket.NotOwnerOfNft.selector);
        nftMarket.list(1, 100);

        console.log("test success list");
        vm.startPrank(saler);
        baseERC721.setApprovalForAll(address(nftMarket), true);
        vm.expectEmit(true, true, true, false);
        emit logList(saler, 1, 100);
        nftMarket.list(1, 100);
        vm.stopPrank();
    }

    function test_NFTMarketBuy() public {
        uint256 buyerBalanceBefore;
        uint256 salerBalanceBefore;

        // list 4
        vm.startPrank(saler);
        baseERC721.setApprovalForAll(address(nftMarket), true);
        for (uint i = 1; i <= 4; i++) {
            nftMarket.list(i, 100);
        }
        vm.stopPrank();

        vm.startPrank(buyer);
        // buy success
        console.log("success buy test...");
        buyerBalanceBefore = hookERC20.balanceOf(buyer);
        salerBalanceBefore = hookERC20.balanceOf(saler);

        vm.expectEmit(true, true, true, false);
        emit logBuy(buyer, 1, 100);
        nftMarket.buyNFT(1, 100);

        assertEq(hookERC20.balanceOf(buyer), buyerBalanceBefore - 100);
        assertEq(hookERC20.balanceOf(saler), salerBalanceBefore + 100);
        assertEq(baseERC721.ownerOf(1), buyer);

        console.log("repeat buy test...");
        vm.expectRevert(NFTMarket.NftNotOnSale.selector);
        nftMarket.buyNFT(1, 100);

        vm.stopPrank();

        console.log("selft buy test...");
        vm.prank(saler);
        nftMarket.buyNFT(2, 100);

        vm.startPrank(buyer);

        console.log("more token buy test...");
        vm.expectEmit(true, true, true, false);
        emit logBuy(buyer, 3, 200);
        nftMarket.buyNFT(3, 200);

        console.log("less token buy test...");
        vm.expectRevert(NFTMarket.PriceNotEnough.selector);
        nftMarket.buyNFT(4, 50);

        vm.stopPrank();
    }

    function testFuzz_ListAndBuy(
        address fuzz_saler,
        address fuzz_buyer,
        uint256 fuzz_nftId,
        uint256 fuzz_price
    ) public {
        vm.assume(fuzz_saler != address(0));
        vm.assume(fuzz_saler != address(this));
        vm.assume(fuzz_saler != address(nftMarket));
        vm.assume(fuzz_buyer != address(0));
        vm.assume(fuzz_buyer != address(this));
        vm.assume(fuzz_buyer != address(nftMarket));

        fuzz_nftId = bound(fuzz_nftId, 5, 10000); // bound fuzz_nftId to 1-10000
        fuzz_price = bound(fuzz_price, 100, 1e6); // bound price to 0.01-10000

        vm.startPrank(fuzz_saler);

        baseERC721.mint(fuzz_saler, fuzz_nftId);
        baseERC721.setApprovalForAll(address(nftMarket), true);

        vm.expectEmit(true, true, true, false);
        emit logList(fuzz_saler, fuzz_nftId, fuzz_price);
        nftMarket.list(fuzz_nftId, fuzz_price);
        vm.stopPrank();

        deal(address(hookERC20), fuzz_buyer, 1e6);

        vm.startPrank(fuzz_buyer);
        hookERC20.approve(address(nftMarket), 1e6);

        uint256 buyerBalanceBefore = hookERC20.balanceOf(fuzz_buyer);
        uint256 salerBalanceBefore = hookERC20.balanceOf(fuzz_saler);

        vm.expectEmit(true, true, true, false);
        emit logBuy(fuzz_buyer, fuzz_nftId, fuzz_price);
        nftMarket.buyNFT(fuzz_nftId, fuzz_price);

        assertEq(
            hookERC20.balanceOf(fuzz_buyer),
            buyerBalanceBefore - fuzz_price
        );
        assertEq(
            hookERC20.balanceOf(fuzz_saler),
            salerBalanceBefore + fuzz_price
        );
        assertEq(baseERC721.ownerOf(fuzz_nftId), fuzz_buyer);

        vm.stopPrank();
    }
}
