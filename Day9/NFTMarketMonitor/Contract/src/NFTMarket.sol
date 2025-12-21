/**
题目#2
编写一个简单的 NFTMarket 合约，使用自己发行的ERC20 扩展 Token 来买卖 NFT， NFTMarket 的函数有：

list() : 实现上架功能，NFT 持有者可以设定一个价格（需要多少个 Token 购买该 NFT）并上架 NFT 到 NFTMarket，上架之后，其他人才可以购买。

buyNFT() : 普通的购买 NFT 功能，用户转入所定价的 token 数量，获得对应的 NFT。

实现ERC20 扩展 Token 所要求的接收者方法 tokensReceived  ，在 tokensReceived 中实现NFT 购买功能(注意扩展的转账需要添加一个额外数据参数)。

贴出你代码库链接。
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { HookERC20 } from "./HookERC20.sol";
import { BaseERC721 } from "./BaseERC721.sol";

contract NFTMarket {
    mapping (uint256 => uint256) priceOfNft; // selling price, nftTokenId => price

    HookERC20 private hookErc20;
    BaseERC721 private erc721Token;

    event logList(address saler, uint256 tokenId, uint256 price);
    event logBuy(address buyer, uint256 tokenId, uint256 price);

    constructor(address erc20Addr, address erc721Addr) {
        hookErc20 = HookERC20(erc20Addr);
        erc721Token = BaseERC721(erc721Addr);
    }

    function list(uint256 _tokenId, uint256 _price) public {
        require(_price > 0, "sale price must greater than zero");
        require(msg.sender == erc721Token.ownerOf(_tokenId), "not owner of nft");
        require(erc721Token.isApprovedForAll(msg.sender, address(this)), "owner must ApprovedForAll to market first");

        priceOfNft[_tokenId] = _price;
        emit logList(msg.sender, _tokenId, _price);
    }

    function buyNFT(uint256 _tokenId, uint256 _price) public {
        require(priceOfNft[_tokenId] > 0, "NFT not in sale");
        require(_price >= priceOfNft[_tokenId], "buy price less than list price");
        require(hookErc20.balanceOf(msg.sender) >= _price, "Insufficient funds");
        require(hookErc20.transferFrom(msg.sender, erc721Token.ownerOf(_tokenId), _price), "erc20 transferFrom failed");
        
        erc721Token.transferFrom(erc721Token.ownerOf(_tokenId), msg.sender, _tokenId);
        priceOfNft[_tokenId] = 0; // clear selling price
        emit logBuy(msg.sender, _tokenId, _price);
    }

    function tokensReceived(address from, uint256 value, bytes memory data) public {
        require(msg.sender == address(hookErc20), "only be called by token contract");

        if (data.length > 0) {
            uint256 tokenId = abi.decode(data, (uint256));
            
            require((priceOfNft[tokenId] != 0) && (value >= priceOfNft[tokenId]), "NFT not in sale or not enough token received");
            require(hookErc20.transfer(erc721Token.ownerOf(tokenId), priceOfNft[tokenId]), "erc20 transferFrom failed"); // pay to owner
            erc721Token.transferFrom(erc721Token.ownerOf(tokenId), from, tokenId); // transfer nft
            
            uint256 refund = value - priceOfNft[tokenId];
            if (refund > 0) {
                hookErc20.transfer(from, refund); // refund to buyer
            }
            priceOfNft[tokenId] = 0; // clear selling price
            emit logBuy(from, tokenId, value);
        }
    }
}
