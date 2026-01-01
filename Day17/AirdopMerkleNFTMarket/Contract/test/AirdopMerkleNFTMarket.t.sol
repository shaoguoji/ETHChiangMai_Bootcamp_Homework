// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AirdopMerkleNFTMarket} from "../src/AirdopMerkleNFTMarket.sol";
import {MyPermitToken} from "../src/MyPermitToken.sol";
import {BaseERC721} from "../src/BaseERC721.sol";
import {
    MerkleProof
} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract AirdopMerkleNFTMarketTest is Test {
    AirdopMerkleNFTMarket public market;
    MyPermitToken public token;
    BaseERC721 public nft;

    uint256 internal ownerPrivateKey;
    uint256 internal buyerPrivateKey;
    address internal owner;
    address internal buyer;
    address internal seller;

    bytes32[] public leaves;
    bytes32 public root;

    function setUp() public {
        ownerPrivateKey = 0xA11CE;
        buyerPrivateKey = 0xB0B;
        owner = vm.addr(ownerPrivateKey);
        buyer = vm.addr(buyerPrivateKey);
        seller = address(100);

        // Deploy contracts
        token = new MyPermitToken();
        nft = new BaseERC721("TestNFT", "TNFT", "https://example.com/");

        // Setup Merkle Tree
        // Leaf = keccak256(abi.encodePacked(address))
        leaves.push(keccak256(abi.encodePacked(buyer)));
        leaves.push(keccak256(abi.encodePacked(address(0xDEAD)))); // Dummy

        // Sort leaves to compute root (simplified for 2 leaves)
        bytes32 a = leaves[0];
        bytes32 b = leaves[1];
        if (a > b) (a, b) = (b, a);
        root = keccak256(abi.encodePacked(a, b));

        market = new AirdopMerkleNFTMarket(address(token), address(nft), root);

        // Setup Balances
        token.mint(buyer, 1000 ether);
        nft.mint(seller, 1); // TokenId 1

        // Approve Market for Seller's NFT
        vm.prank(seller);
        nft.setApprovalForAll(address(market), true);
    }

    function testMulticallBuy() public {
        // 1. Seller Lists NFT
        uint256 tokenId = 1;
        uint256 price = 100 ether; // Original price

        vm.prank(seller);
        market.list(tokenId, price);

        // 2. Prepare Permit Signature
        // Spender = Market
        // Value = Discounted Price (50 ether)
        uint256 nonce = token.nonces(buyer);
        uint256 deadline = block.timestamp + 1 days;
        uint256 value = price / 2; // 50 ether

        // Domain Separator and Struct Hash for Permit
        // We use vm.sign with buyerPrivateKey

        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        bytes32 permitTypeHash = keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );
        bytes32 structHash = keccak256(
            abi.encode(
                permitTypeHash,
                buyer,
                address(market),
                value,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(buyerPrivateKey, digest);

        // 3. Prepare Calldata for Multicall
        // Call 1: permitPrePay
        bytes memory data1 = abi.encodeWithSelector(
            AirdopMerkleNFTMarket.permitPrePay.selector,
            buyer,
            address(market),
            value,
            deadline,
            v,
            r,
            s
        );

        // Call 2: claimNFT
        // Prepare Merkle Proof for buyer
        // Since we only have 2 leaves, the proof is just the other leaf
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaves[1]; // The dummy address hash

        bytes memory data2 = abi.encodeWithSelector(
            AirdopMerkleNFTMarket.claimNFT.selector,
            tokenId,
            proof
        );

        bytes[] memory results = new bytes[](2);
        results[0] = data1;
        results[1] = data2;

        // 4. Exec Multicall
        vm.prank(buyer);
        market.multicall(results);

        // 5. Verify
        assertEq(nft.ownerOf(tokenId), buyer);
        assertEq(token.balanceOf(seller), 50 ether);
        assertEq(token.balanceOf(buyer), 1000 ether - 50 ether);
    }

    function testNotInWhitelistReverts() public {
        // 1. Seller Lists NFT
        uint256 tokenId = 1;
        uint256 price = 100 ether;
        vm.prank(seller);
        market.list(tokenId, price);

        // 2. Random User tries to claim
        address randomUser = address(0x999);
        token.mint(randomUser, 1000 ether);

        vm.startPrank(randomUser);

        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leaves[0];

        vm.expectRevert("Not whitelisted");
        market.claimNFT(tokenId, proof); // Should fail
        vm.stopPrank();
    }

    function testBuyNFT() public {
        // 1. Seller Lists NFT
        uint256 tokenId = 1;
        uint256 price = 100 ether;
        vm.prank(seller);
        market.list(tokenId, price);

        // 2. Random User buys (Full Price)
        address randomUser = address(0x999);
        token.mint(randomUser, 1000 ether);
        
        vm.startPrank(randomUser);
        token.approve(address(market), price); // Standard approve
        market.buyNFT(tokenId);
        vm.stopPrank();

        // 3. Verify
        assertEq(nft.ownerOf(tokenId), randomUser);
        assertEq(token.balanceOf(seller), 100 ether); // Full price
        assertEq(token.balanceOf(randomUser), 1000 ether - 100 ether);
    }
}
