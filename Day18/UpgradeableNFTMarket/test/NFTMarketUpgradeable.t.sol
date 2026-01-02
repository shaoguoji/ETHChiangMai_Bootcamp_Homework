// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "forge-std/console.sol";

import "../src/UpgradeableNFT.sol";
import "../src/NFTMarketV1.sol";
import "../src/NFTMarketV2.sol";
import "../src/HookERC20.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract NFTMarketUpgradeableTest is Test {
    HookERC20 public erc20;
    UpgradeableNFT public nftImplementation;
    UpgradeableNFT public nft;
    NFTMarketV1 public marketV1Implementation;
    NFTMarketV1 public marketV1;
    ERC1967Proxy public nftProxy;
    ERC1967Proxy public marketProxy;

    address public owner;
    address public seller;
    address public buyer;
    uint256 public sellerPrivateKey;
    uint256 public buyerPrivateKey;

    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTSold(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event NFTListedWithSignature(address indexed seller, uint256 indexed tokenId, uint256 price, uint256 nonce);

    function setUp() public {
        owner = address(this);
        sellerPrivateKey = 0xA11CE;
        buyerPrivateKey = 0xB0B;
        seller = vm.addr(sellerPrivateKey);
        buyer = vm.addr(buyerPrivateKey);

        // Deploy ERC20
        erc20 = new HookERC20();

        // Deploy UpgradeableNFT with proxy
        nftImplementation = new UpgradeableNFT();
        bytes memory nftInitData = abi.encodeWithSelector(
            UpgradeableNFT.initialize.selector,
            "Test NFT",
            "TNFT",
            "https://example.com/"
        );
        nftProxy = new ERC1967Proxy(address(nftImplementation), nftInitData);
        nft = UpgradeableNFT(address(nftProxy));

        // Deploy NFTMarketV1 with proxy
        marketV1Implementation = new NFTMarketV1();
        bytes memory marketInitData = abi.encodeWithSelector(
            NFTMarketV1.initialize.selector,
            address(erc20),
            address(nft)
        );
        marketProxy = new ERC1967Proxy(address(marketV1Implementation), marketInitData);
        marketV1 = NFTMarketV1(address(marketProxy));

        // Setup: mint NFTs and distribute tokens
        nft.mint(seller, 1);
        nft.mint(seller, 2);
        nft.mint(seller, 3);

        deal(address(erc20), buyer, 10000 ether);
        deal(address(erc20), seller, 1000 ether);

        vm.prank(buyer);
        erc20.approve(address(marketProxy), type(uint256).max);
    }

    // ============ V1 Tests ============

    function test_V1_Version() public view {
        assertEq(marketV1.version(), "1.0.0");
    }

    function test_V1_List() public {
        vm.startPrank(seller);
        nft.setApprovalForAll(address(marketProxy), true);
        
        vm.expectEmit(true, true, true, true);
        emit NFTListed(seller, 1, 100 ether);
        marketV1.list(1, 100 ether);
        
        assertEq(marketV1.priceOfNft(1), 100 ether);
        vm.stopPrank();
    }

    function test_V1_List_RevertNotOwner() public {
        vm.prank(seller);
        nft.setApprovalForAll(address(marketProxy), true);

        vm.prank(buyer);
        vm.expectRevert("Not owner of NFT");
        marketV1.list(1, 100 ether);
    }

    function test_V1_List_RevertNotApproved() public {
        vm.prank(seller);
        vm.expectRevert("Market not approved");
        marketV1.list(1, 100 ether);
    }

    function test_V1_BuyNFT() public {
        vm.startPrank(seller);
        nft.setApprovalForAll(address(marketProxy), true);
        marketV1.list(1, 100 ether);
        vm.stopPrank();

        uint256 buyerBalanceBefore = erc20.balanceOf(buyer);
        uint256 sellerBalanceBefore = erc20.balanceOf(seller);

        vm.prank(buyer);
        vm.expectEmit(true, true, true, true);
        emit NFTSold(buyer, 1, 100 ether);
        marketV1.buyNFT(1, 100 ether);

        assertEq(nft.ownerOf(1), buyer);
        assertEq(erc20.balanceOf(buyer), buyerBalanceBefore - 100 ether);
        assertEq(erc20.balanceOf(seller), sellerBalanceBefore + 100 ether);
        assertEq(marketV1.priceOfNft(1), 0);
    }

    function test_V1_BuyNFT_RevertNotListed() public {
        vm.prank(buyer);
        vm.expectRevert("NFT not listed");
        marketV1.buyNFT(999, 100 ether);
    }

    // ============ Upgrade Tests ============

    function test_Upgrade_StateConsistency() public {
        // === Setup state before upgrade ===
        vm.startPrank(seller);
        nft.setApprovalForAll(address(marketProxy), true);
        marketV1.list(1, 100 ether);
        marketV1.list(2, 200 ether);
        vm.stopPrank();

        // Record all state BEFORE upgrade
        string memory versionBefore = marketV1.version();
        address ownerBefore = marketV1.owner();
        address erc20Before = address(marketV1.hookErc20());
        address nftBefore = address(marketV1.erc721Token());
        uint256 price1Before = marketV1.priceOfNft(1);
        uint256 price2Before = marketV1.priceOfNft(2);
        uint256 price3Before = marketV1.priceOfNft(3); // not listed
        uint256 buyerBalanceBefore = erc20.balanceOf(buyer);
        uint256 sellerBalanceBefore = erc20.balanceOf(seller);
        address nft1OwnerBefore = nft.ownerOf(1);
        address nft2OwnerBefore = nft.ownerOf(2);

        // Log state before upgrade
        console.log("=== State BEFORE Upgrade ===");
        console.log("Version:", versionBefore);
        console.log("Owner:", ownerBefore);
        console.log("Price of NFT 1:", price1Before);
        console.log("Price of NFT 2:", price2Before);

        // === Perform upgrade ===
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
        NFTMarketV2 marketV2 = NFTMarketV2(address(marketProxy));

        // === Verify state AFTER upgrade ===
        console.log("\n=== State AFTER Upgrade ===");
        console.log("Version:", marketV2.version());
        console.log("Owner:", marketV2.owner());
        console.log("Price of NFT 1:", marketV2.priceOfNft(1));
        console.log("Price of NFT 2:", marketV2.priceOfNft(2));

        // Version should change
        assertEq(marketV2.version(), "2.0.0", "Version should be 2.0.0");
        assertTrue(
            keccak256(bytes(versionBefore)) != keccak256(bytes(marketV2.version())),
            "Version should change after upgrade"
        );

        // Owner should remain the same
        assertEq(marketV2.owner(), ownerBefore, "Owner should not change");

        // Token addresses should remain the same
        assertEq(address(marketV2.hookErc20()), erc20Before, "ERC20 address should not change");
        assertEq(address(marketV2.erc721Token()), nftBefore, "NFT address should not change");

        // All listing prices should be preserved
        assertEq(marketV2.priceOfNft(1), price1Before, "Price of NFT 1 should be preserved");
        assertEq(marketV2.priceOfNft(2), price2Before, "Price of NFT 2 should be preserved");
        assertEq(marketV2.priceOfNft(3), price3Before, "Price of NFT 3 should be preserved");

        // Token balances should not change
        assertEq(erc20.balanceOf(buyer), buyerBalanceBefore, "Buyer balance should not change");
        assertEq(erc20.balanceOf(seller), sellerBalanceBefore, "Seller balance should not change");

        // NFT ownership should not change
        assertEq(nft.ownerOf(1), nft1OwnerBefore, "NFT 1 owner should not change");
        assertEq(nft.ownerOf(2), nft2OwnerBefore, "NFT 2 owner should not change");

        // === Verify V1 functions still work after upgrade ===
        vm.prank(buyer);
        marketV2.buyNFT(1, 100 ether);
        assertEq(nft.ownerOf(1), buyer, "Buy should work after upgrade");
        assertEq(marketV2.priceOfNft(1), 0, "Price should be cleared after buy");

        // === Verify V2 new functions work ===
        uint256 nonce = marketV2.getNonce(seller);
        assertEq(nonce, 0, "Nonce should start at 0");
    }

    function test_Upgrade_ToV2() public {
        // List NFT on V1
        vm.startPrank(seller);
        nft.setApprovalForAll(address(marketProxy), true);
        marketV1.list(1, 100 ether);
        vm.stopPrank();

        // Deploy V2 and upgrade
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");

        // Cast to V2
        NFTMarketV2 marketV2 = NFTMarketV2(address(marketProxy));

        // Verify version changed
        assertEq(marketV2.version(), "2.0.0");

        // Verify state preserved (listing still exists)
        assertEq(marketV2.priceOfNft(1), 100 ether);

        // Verify V1 functions still work
        vm.prank(buyer);
        marketV2.buyNFT(1, 100 ether);
        assertEq(nft.ownerOf(1), buyer);
    }

    function test_Upgrade_OnlyOwner() public {
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        
        vm.prank(buyer);
        vm.expectRevert("Ownable: caller is not the owner");
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
    }

    // ============ V2 Signature Listing Tests ============

    function test_V2_ListWithSignature() public {
        // Upgrade to V2
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
        NFTMarketV2 marketV2 = NFTMarketV2(address(marketProxy));

        // Seller approves market
        vm.prank(seller);
        nft.setApprovalForAll(address(marketProxy), true);

        // Get nonce
        uint256 nonce = marketV2.getNonce(seller);
        assertEq(nonce, 0);

        // Create signature
        uint256 tokenId = 2;
        uint256 price = 200 ether;
        bytes32 digest = marketV2.getListingDigest(tokenId, price, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sellerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // List with signature (anyone can call)
        vm.expectEmit(true, true, true, true);
        emit NFTListedWithSignature(seller, tokenId, price, nonce);
        marketV2.listWithSignature(tokenId, price, nonce, signature);

        // Verify listing
        assertEq(marketV2.priceOfNft(tokenId), price);
        assertEq(marketV2.getNonce(seller), 1);

        // Buyer can purchase
        vm.prank(buyer);
        marketV2.buyNFT(tokenId, price);
        assertEq(nft.ownerOf(tokenId), buyer);
    }

    function test_V2_ListWithSignature_RevertInvalidNonce() public {
        // Upgrade to V2
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
        NFTMarketV2 marketV2 = NFTMarketV2(address(marketProxy));

        vm.prank(seller);
        nft.setApprovalForAll(address(marketProxy), true);

        // Create signature with wrong nonce
        uint256 tokenId = 2;
        uint256 price = 200 ether;
        uint256 wrongNonce = 999;
        bytes32 digest = marketV2.getListingDigest(tokenId, price, wrongNonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sellerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid nonce");
        marketV2.listWithSignature(tokenId, price, wrongNonce, signature);
    }

    function test_V2_ListWithSignature_RevertInvalidSignature() public {
        // Upgrade to V2
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
        NFTMarketV2 marketV2 = NFTMarketV2(address(marketProxy));

        vm.prank(seller);
        nft.setApprovalForAll(address(marketProxy), true);

        // Create signature with buyer's key (wrong signer)
        uint256 tokenId = 2;
        uint256 price = 200 ether;
        uint256 nonce = 0;
        bytes32 digest = marketV2.getListingDigest(tokenId, price, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(buyerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert("Invalid signature");
        marketV2.listWithSignature(tokenId, price, nonce, signature);
    }

    function test_V2_ListWithSignature_RevertReplay() public {
        // Upgrade to V2
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
        NFTMarketV2 marketV2 = NFTMarketV2(address(marketProxy));

        vm.prank(seller);
        nft.setApprovalForAll(address(marketProxy), true);

        // First listing
        uint256 tokenId = 2;
        uint256 price = 200 ether;
        uint256 nonce = 0;
        bytes32 digest = marketV2.getListingDigest(tokenId, price, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sellerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        marketV2.listWithSignature(tokenId, price, nonce, signature);

        // Try to replay the same signature
        vm.expectRevert("Invalid nonce");
        marketV2.listWithSignature(tokenId, price, nonce, signature);
    }

    // ============ Fuzz Tests ============

    function testFuzz_V2_ListWithSignature(uint256 tokenId, uint256 price) public {
        tokenId = bound(tokenId, 100, 10000);
        price = bound(price, 1 ether, 1000 ether);

        // Upgrade to V2
        NFTMarketV2 marketV2Implementation = new NFTMarketV2();
        marketV1.upgradeToAndCall(address(marketV2Implementation), "");
        NFTMarketV2 marketV2 = NFTMarketV2(address(marketProxy));

        // Mint new NFT
        nft.mint(seller, tokenId);

        vm.prank(seller);
        nft.setApprovalForAll(address(marketProxy), true);

        // Create and use signature
        uint256 nonce = marketV2.getNonce(seller);
        bytes32 digest = marketV2.getListingDigest(tokenId, price, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sellerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        marketV2.listWithSignature(tokenId, price, nonce, signature);

        assertEq(marketV2.priceOfNft(tokenId), price);
    }
}
