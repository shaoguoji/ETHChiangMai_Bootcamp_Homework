// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./MemeToken.sol";

contract MemeFactory {
    using Clones for address;

    struct MemeInfo {
        uint256 totalSupply; // Max total supply
        uint256 currentSupply; // Currently minted supply
        uint256 perMint; // Amount per mint
        uint256 price; // Price per mint in wei
        address issuer; // Creator of the meme token
    }

    address public immutable implementation;
    mapping(address => MemeInfo) public memeInfos;

    event MemeDeployed(
        address indexed tokenAddress,
        string symbol,
        address indexed issuer
    );
    event MemeMinted(
        address indexed tokenAddress,
        address indexed minter,
        uint256 amount
    );

    constructor() {
        implementation = address(new MemeToken());
    }

    /**
     * @notice Deploy a new Meme Token clone
     * @param symbol Symbol of the token (Name will be "MemeToken")
     * @param totalSupply Max supply cap
     * @param perMint Amount of tokens minted per mintMeme call
     * @param price Price in wei per mint
     */
    function deployMeme(
        string memory symbol,
        uint256 totalSupply,
        uint256 perMint,
        uint256 price
    ) external returns (address) {
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(totalSupply > 0, "Total supply must be > 0");
        require(perMint > 0 && perMint <= totalSupply, "Invalid perMint");

        address clone = implementation.clone();
        MemeToken(clone).initialize("MemeToken", symbol, address(this));

        memeInfos[clone] = MemeInfo({
            totalSupply: totalSupply,
            currentSupply: 0,
            perMint: perMint,
            price: price,
            issuer: msg.sender
        });

        emit MemeDeployed(clone, symbol, msg.sender);
        return clone;
    }

    /**
     * @notice Buy/Mint meme tokens
     * @param tokenAddr Address of the meme token to mint
     */
    function mintMeme(address tokenAddr) external payable {
        MemeInfo storage info = memeInfos[tokenAddr];
        require(info.totalSupply > 0, "Token not valid");
        require(msg.value >= info.price, "Insufficient payment");
        require(
            info.currentSupply + info.perMint <= info.totalSupply,
            "Exceeds total supply"
        );

        // Update supply
        info.currentSupply += info.perMint;

        uint256 cost = info.price;
        uint256 refund = msg.value - cost;
        uint256 fee = cost / 100; // 1%
        uint256 issuerIncome = cost - fee;

        // Refund excess payment
        if (refund > 0) {
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }

        // Transfer revenue to issuer (99%)
        if (issuerIncome > 0) {
            (bool success, ) = info.issuer.call{value: issuerIncome}("");
            require(success, "Transfer to issuer failed");
        }

        // Fee (1%) stays in contract (project party revenue)

        // Mint tokens
        MemeToken(tokenAddr).mint(msg.sender, info.perMint);

        emit MemeMinted(tokenAddr, msg.sender, info.perMint);
    }

    // Allow factory to receive ETH?
    receive() external payable {}
}
