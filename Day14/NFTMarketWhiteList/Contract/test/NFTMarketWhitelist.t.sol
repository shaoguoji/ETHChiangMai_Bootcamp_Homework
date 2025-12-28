// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {NFTMarket} from "../src/NFTMarket.sol";
import {HookERC20} from "../src/HookERC20.sol";
import {BaseERC721} from "../src/BaseERC721.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {
    MessageHashUtils
} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract NFTMarketWhitelistTest is Test {
    using MessageHashUtils for bytes32;

    NFTMarket public nftMarket;
    HookERC20 public hookERC20;
    BaseERC721 public baseERC721;

    uint256 ownerPrivateKey = 0xA11CE;
    address owner;

    uint256 buyerPrivateKey = 0xB0B;
    address buyer;

    address saler = makeAddr("saler");

    function setUp() public {
        owner = vm.addr(ownerPrivateKey);
        buyer = vm.addr(buyerPrivateKey);

        // Deploy tokens
        hookERC20 = new HookERC20();
        baseERC721 = new BaseERC721("TestNFT", "TNFT", "http://example.com/");

        // Mint NFT to saler
        baseERC721.mint(saler, 1);

        // Give tokens to buyer
        deal(address(hookERC20), buyer, 1000 ether);

        // Deploy market as owner
        vm.startPrank(owner);
        nftMarket = new NFTMarket(address(hookERC20), address(baseERC721));
        vm.stopPrank();

        // Setup approval
        vm.startPrank(saler);
        baseERC721.setApprovalForAll(address(nftMarket), true);
        nftMarket.list(1, 100);
        vm.stopPrank();

        vm.startPrank(buyer);
        hookERC20.approve(address(nftMarket), 1000 ether);
        vm.stopPrank();
    }

    function test_permitBuy_Success() public {
        // Create signature
        bytes32 hash = keccak256(abi.encodePacked(buyer));
        bytes32 ethSignedHash = hash.toEthSignedMessageHash();

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            ownerPrivateKey,
            ethSignedHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.startPrank(buyer);
        nftMarket.permitBuy(1, 100, signature);
        vm.stopPrank();

        assertEq(baseERC721.ownerOf(1), buyer);
    }

    function test_permitBuy_Fail_InvalidSignature() public {
        // Create signature with wrong signer
        uint256 wrongKey = 0xBAD;
        bytes32 hash = keccak256(abi.encodePacked(buyer));
        bytes32 ethSignedHash = hash.toEthSignedMessageHash();

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.startPrank(buyer);
        vm.expectRevert("Invalid signature or not whitelisted");
        nftMarket.permitBuy(1, 100, signature);
        vm.stopPrank();
    }

    function test_permitBuy_Fail_WrongMessage() public {
        // Sign wrong buyer address
        address wrongBuyer = makeAddr("wrong");
        bytes32 hash = keccak256(abi.encodePacked(wrongBuyer));
        bytes32 ethSignedHash = hash.toEthSignedMessageHash();

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            ownerPrivateKey,
            ethSignedHash
        );
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.startPrank(buyer);
        vm.expectRevert("Invalid signature or not whitelisted");
        nftMarket.permitBuy(1, 100, signature);
        vm.stopPrank();
    }
}
