// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Strings.sol";

/// @title Simple ERC721 NFT contract for IPFS-hosted images + metadata
contract KGirlsNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;

    constructor(string memory baseURI_) ERC721("K-Girls", "KGIRL") Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
    }

    /// @notice Update base metadata URI (e.g., ipfs://<METADATA_CID>/)
    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        _baseTokenURI = newBaseURI;
    }

    /// @notice Mint a new token to `to` with a full tokenURI (e.g., ipfs://.../1.json)
    /// @dev Token IDs are sequential starting from 1 to align with the provided metadata files.
    function safeMint(address to, string calldata tokenURI_) external onlyOwner returns (uint256 tokenId) {
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
    }

    /// @notice Convenience mint that builds tokenURI from the stored base URI and token ID (adds "<id>.json").
    function safeMintWithBase(address to) external onlyOwner returns (uint256 tokenId) {
        require(bytes(_baseTokenURI).length != 0, "Base URI not set");
        _tokenIdCounter++;
        tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, string(abi.encodePacked(Strings.toString(tokenId), ".json")));
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    // ERC721URIStorage hooks
    
}
