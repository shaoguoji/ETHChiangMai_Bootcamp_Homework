// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {Multicall} from "@openzeppelin/contracts/utils/Multicall.sol";

contract AirdopMerkleNFTMarket is Ownable, Multicall {
    address public immutable token;
    address public immutable nft;
    bytes32 public merkleRoot;

    mapping(uint256 => uint256) public priceOfNft; // tokenId => price

    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTClaimed(address indexed buyer, uint256 indexed tokenId, uint256 price);

    constructor(address _token, address _nft, bytes32 _merkleRoot) Ownable(msg.sender) {
        token = _token;
        nft = _nft;
        merkleRoot = _merkleRoot;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    // Standard listing function
    function list(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");
        require(IERC721(nft).ownerOf(tokenId) == msg.sender, "Not owner");
        require(IERC721(nft).isApprovedForAll(msg.sender, address(this)) || IERC721(nft).getApproved(tokenId) == address(this), "Not approved");

        priceOfNft[tokenId] = price;
        emit NFTListed(msg.sender, tokenId, price);
    }

    // 1. permitPrePay: Call token.permit to approve this contract
    function permitPrePay(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public {
        require(spender == address(this), "Spender must be market");
        IERC20Permit(token).permit(owner, spender, value, deadline, v, r, s);
    }

    // 2. claimNFT: Verify whitelist and buy with 50% discount
    function claimNFT(uint256 tokenId, bytes32[] calldata merkleProof) public {
        // Verify Merkle Proof (Whitelist check)
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Not whitelisted");

        uint256 originalPrice = priceOfNft[tokenId];
        require(originalPrice > 0, "NFT not listed");

        // 50% discount
        uint256 discountedPrice = originalPrice / 2;

        // Execute purchase
        address seller = IERC721(nft).ownerOf(tokenId);

        // Transfer tokens from buyer to seller
        // This requires allowance, which should have been set via permitPrePay in the same multicall
        bool success = IERC20(token).transferFrom(msg.sender, seller, discountedPrice);
        require(success, "Token transfer failed");

        // Transfer NFT from seller to buyer
        IERC721(nft).transferFrom(seller, msg.sender, tokenId);

        // Clear listing
        priceOfNft[tokenId] = 0;

        emit NFTClaimed(msg.sender, tokenId, discountedPrice);
    }

    // 3. buyNFT: Normal purchase for non-whitelisted users (Original Price)
    function buyNFT(uint256 tokenId) external {
        uint256 price = priceOfNft[tokenId];
        require(price > 0, "NFT not listed");

        address seller = IERC721(nft).ownerOf(tokenId);

        // Transfer tokens from buyer to seller (Full Price)
        bool success = IERC20(token).transferFrom(msg.sender, seller, price);
        require(success, "Token transfer failed");

        // Transfer NFT from seller to buyer
        IERC721(nft).transferFrom(seller, msg.sender, tokenId);

        // Clear listing
        priceOfNft[tokenId] = 0;

        emit NFTClaimed(msg.sender, tokenId, price);
    }
}
