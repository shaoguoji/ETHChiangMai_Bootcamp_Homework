// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IUpgradeableNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface IHookERC20 is IERC20 {
    function transferWithCallback(address to, uint256 value, bytes memory data) external returns (bool);
}

/**
 * @title NFTMarketV1
 * @dev Upgradeable NFT Marketplace using UUPS proxy pattern
 * Features: list NFT, buy NFT, tokensReceived callback
 */
contract NFTMarketV1 is Initializable, UUPSUpgradeable {
    // Storage
    mapping(uint256 => uint256) public priceOfNft;
    
    IHookERC20 public hookErc20;
    IUpgradeableNFT public erc721Token;
    address private _owner;

    // Events
    event NFTListed(address indexed seller, uint256 indexed tokenId, uint256 price);
    event NFTSold(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event TokensReceived(address indexed from, uint256 value, bytes data);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address erc20Addr, address erc721Addr) public initializer {
        hookErc20 = IHookERC20(erc20Addr);
        erc721Token = IUpgradeableNFT(erc721Addr);
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // Access control
    modifier onlyOwner() {
        require(_owner == msg.sender, "Ownable: caller is not the owner");
        _;
    }

    function owner() public view returns (address) {
        return _owner;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }

    // UUPS upgrade authorization
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyOwner {}

    /**
     * @dev List an NFT for sale
     * @param _tokenId The NFT token ID to list
     * @param _price The price in ERC20 tokens
     */
    function list(uint256 _tokenId, uint256 _price) public virtual {
        require(_price > 0, "Price must be greater than zero");
        require(msg.sender == erc721Token.ownerOf(_tokenId), "Not owner of NFT");
        require(erc721Token.isApprovedForAll(msg.sender, address(this)), "Market not approved");

        priceOfNft[_tokenId] = _price;
        emit NFTListed(msg.sender, _tokenId, _price);
    }

    /**
     * @dev Buy a listed NFT
     * @param _tokenId The NFT token ID to buy
     * @param _price The price to pay (must match or exceed listed price)
     */
    function buyNFT(uint256 _tokenId, uint256 _price) public virtual {
        uint256 listedPrice = priceOfNft[_tokenId];
        require(listedPrice > 0, "NFT not listed");
        require(_price >= listedPrice, "Price too low");
        require(hookErc20.balanceOf(msg.sender) >= _price, "Insufficient funds");

        address seller = erc721Token.ownerOf(_tokenId);
        
        require(hookErc20.transferFrom(msg.sender, seller, _price), "Payment failed");
        erc721Token.transferFrom(seller, msg.sender, _tokenId);
        
        priceOfNft[_tokenId] = 0;
        emit NFTSold(msg.sender, _tokenId, _price);
    }

    /**
     * @dev Handle tokens received via transferWithCallback
     * @param from The sender of tokens
     * @param value The amount of tokens received
     * @param data Encoded tokenId for purchase
     */
    function tokensReceived(address from, uint256 value, bytes memory data) public virtual {
        require(msg.sender == address(hookErc20), "Only token contract");

        if (data.length > 0) {
            uint256 tokenId = abi.decode(data, (uint256));
            uint256 listedPrice = priceOfNft[tokenId];
            
            require(listedPrice > 0 && value >= listedPrice, "NFT not listed or insufficient tokens");
            
            address seller = erc721Token.ownerOf(tokenId);
            
            require(hookErc20.transfer(seller, listedPrice), "Payment failed");
            erc721Token.transferFrom(seller, from, tokenId);
            
            uint256 refund = value - listedPrice;
            if (refund > 0) {
                hookErc20.transfer(from, refund);
            }
            
            priceOfNft[tokenId] = 0;
            emit TokensReceived(from, value, data);
            emit NFTSold(from, tokenId, value);
        }
    }

    /**
     * @dev Get contract version
     */
    function version() public pure virtual returns (string memory) {
        return "1.0.0";
    }
}
