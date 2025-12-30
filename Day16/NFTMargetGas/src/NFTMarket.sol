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

import {HookERC20} from "./HookERC20.sol";
import {BaseERC721} from "./BaseERC721.sol";

contract NFTMarket {
    mapping(uint256 => uint256) public priceOfNft; // selling price, nftTokenId => price

    HookERC20 private immutable hookErc20;
    BaseERC721 private immutable erc721Token;

    event logList(address saler, uint256 tokenId, uint256 price);
    event logBuy(address buyer, uint256 tokenId, uint256 price);
    event logTokensReceived(address from, uint256 value, bytes data);

    error ZeroValue();
    error NotOwnerOfNft();
    error OwnerNotApprove();
    error NftNotOnSale();
    error PriceNotEnough();
    error InsufficientFunds();
    error Erc20TransferFailed();
    error OnlyTokenContract();
    error TokenTransferFailed();

    constructor(address erc20Addr, address erc721Addr) {
        hookErc20 = HookERC20(erc20Addr);
        erc721Token = BaseERC721(erc721Addr);
    }

    function list(uint256 _tokenId, uint256 _price) public {
        if (_price == 0) revert ZeroValue();
        if (erc721Token.ownerOf(_tokenId) != msg.sender) revert NotOwnerOfNft();
        if (!erc721Token.isApprovedForAll(msg.sender, address(this)))
            revert OwnerNotApprove();

        priceOfNft[_tokenId] = _price;
        emit logList(msg.sender, _tokenId, _price);
    }

    function buyNFT(uint256 _tokenId, uint256 _price) public {
        if (priceOfNft[_tokenId] == 0) revert NftNotOnSale();
        if (_price < priceOfNft[_tokenId]) revert PriceNotEnough();
        if (hookErc20.balanceOf(msg.sender) < _price)
            revert InsufficientFunds();

        bool success = hookErc20.transferFrom(
            msg.sender,
            erc721Token.ownerOf(_tokenId),
            _price
        );
        if (!success) revert Erc20TransferFailed();

        erc721Token.transferFrom(
            erc721Token.ownerOf(_tokenId),
            msg.sender,
            _tokenId
        );
        priceOfNft[_tokenId] = 0; // clear selling price
        emit logBuy(msg.sender, _tokenId, _price);
    }

    function tokensReceived(
        address from,
        uint256 value,
        bytes calldata data
    ) public {
        if (msg.sender != address(hookErc20)) revert OnlyTokenContract();

        if (data.length > 0) {
            uint256 tokenId = abi.decode(data, (uint256));

            if (priceOfNft[tokenId] == 0 || value < priceOfNft[tokenId])
                revert NftNotOnSale();

            bool success = hookErc20.transfer(
                erc721Token.ownerOf(tokenId),
                priceOfNft[tokenId]
            );
            if (!success) revert TokenTransferFailed(); // pay to owner

            erc721Token.transferFrom(
                erc721Token.ownerOf(tokenId),
                from,
                tokenId
            ); // transfer nft

            uint256 refund = value - priceOfNft[tokenId];
            if (refund > 0) {
                hookErc20.transfer(from, refund); // refund to buyer
            }
            priceOfNft[tokenId] = 0; // clear selling price
            emit logTokensReceived(from, value, data);
            emit logBuy(from, tokenId, value);
        }
    }
}
