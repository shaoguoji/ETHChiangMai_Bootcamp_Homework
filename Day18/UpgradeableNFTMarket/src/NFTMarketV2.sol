// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./NFTMarketV1.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title NFTMarketV2
 * @dev Extended NFT Marketplace with EIP-712 signature-based listing
 * Users can sign off-chain to list NFTs without on-chain transactions
 */
contract NFTMarketV2 is NFTMarketV1 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // EIP-712 domain separator
    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    
    bytes32 public constant LISTING_TYPEHASH = keccak256(
        "Listing(uint256 tokenId,uint256 price,uint256 nonce)"
    );

    // Track used nonces per seller to prevent replay attacks
    mapping(address => uint256) public nonces;

    // Events
    event NFTListedWithSignature(address indexed seller, uint256 indexed tokenId, uint256 price, uint256 nonce);

    /**
     * @dev List an NFT using off-chain signature
     * @param tokenId The NFT token ID to list
     * @param price The listing price in ERC20 tokens
     * @param nonce The seller's nonce (must match current nonce)
     * @param signature The EIP-712 signature from the NFT owner
     */
    function listWithSignature(
        uint256 tokenId,
        uint256 price,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(price > 0, "Price must be greater than zero");
        
        // Get the NFT owner
        address seller = erc721Token.ownerOf(tokenId);
        
        // Verify nonce
        require(nonce == nonces[seller], "Invalid nonce");
        
        // Verify market approval
        require(erc721Token.isApprovedForAll(seller, address(this)), "Market not approved");
        
        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(LISTING_TYPEHASH, tokenId, price, nonce)
        );
        
        bytes32 domainSeparator = _domainSeparator();
        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        
        address signer = digest.recover(signature);
        require(signer == seller, "Invalid signature");
        
        // Increment nonce to prevent replay
        nonces[seller]++;
        
        // List the NFT
        priceOfNft[tokenId] = price;
        emit NFTListedWithSignature(seller, tokenId, price, nonce);
    }

    /**
     * @dev Get the EIP-712 domain separator
     */
    function _domainSeparator() internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("NFTMarket")),
                keccak256(bytes("2")),
                block.chainid,
                address(this)
            )
        );
    }

    /**
     * @dev Get the current nonce for a seller
     */
    function getNonce(address seller) external view returns (uint256) {
        return nonces[seller];
    }

    /**
     * @dev Get the digest for signing (helper for frontend)
     */
    function getListingDigest(
        uint256 tokenId,
        uint256 price,
        uint256 nonce
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(LISTING_TYPEHASH, tokenId, price, nonce)
        );
        
        return keccak256(
            abi.encodePacked("\x19\x01", _domainSeparator(), structHash)
        );
    }

    /**
     * @dev Get contract version
     */
    function version() public pure override returns (string memory) {
        return "2.0.0";
    }
}
