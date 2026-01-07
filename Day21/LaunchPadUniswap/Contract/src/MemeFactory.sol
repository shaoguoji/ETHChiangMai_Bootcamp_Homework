// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./MemeToken.sol";
import "./interfaces/IUniswapV2Router02.sol";

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
    IUniswapV2Router02 public immutable uniswapRouter;
    mapping(address => MemeInfo) public memeInfos;
    address[] public deployedMemes;

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
    event LiquidityAdded(
        address indexed tokenAddress,
        uint256 amountToken,
        uint256 amountETH,
        uint256 liquidity
    );

    constructor(address _uniswapRouter) {
        implementation = address(new MemeToken());
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
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

        deployedMemes.push(clone);
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

        // 5% Fee calculation
        uint256 cost = info.price;
        uint256 fee = (cost * 5) / 100; // 5% fee for liquidity
        uint256 issuerIncome = cost - fee;
        
        // Calculate tokens for liquidity based on mint price
        // Mint Price = price / perMint (Wei per Token)
        // Tokens for Liquidity = Fee / Mint Price = Fee * perMint / price
        uint256 tokensForLiquidity = (fee * info.perMint) / info.price;

        require(
            info.currentSupply + info.perMint + tokensForLiquidity <= info.totalSupply,
            "Exceeds total supply (including liquidity tokens)"
        );

        // Update supply
        info.currentSupply += (info.perMint + tokensForLiquidity);

        uint256 refund = msg.value - cost;

        // Refund excess payment
        if (refund > 0) {
            (bool success, ) = msg.sender.call{value: refund}("");
            require(success, "Refund failed");
        }

        // Transfer revenue to issuer (95%)
        if (issuerIncome > 0) {
            (bool success, ) = info.issuer.call{value: issuerIncome}("");
            require(success, "Transfer to issuer failed");
        }

        // Mint tokens to user
        MemeToken(tokenAddr).mint(msg.sender, info.perMint);
        emit MemeMinted(tokenAddr, msg.sender, info.perMint);

        // Add Liquidity
        if (fee > 0 && tokensForLiquidity > 0) {
            // Mint tokens for liquidity to this contract
            MemeToken(tokenAddr).mint(address(this), tokensForLiquidity);
            
            // Approve router
            MemeToken(tokenAddr).approve(address(uniswapRouter), tokensForLiquidity);

            // Add Liquidity ETH - this MUST succeed, revert if it fails
            (uint amountToken, uint amountETH, uint liquidity) = uniswapRouter.addLiquidityETH{value: fee}(
                tokenAddr,
                tokensForLiquidity,
                0, // min token amount (accept any)
                0, // min ETH amount (accept any)
                address(this),
                block.timestamp
            );
            emit LiquidityAdded(tokenAddr, amountToken, amountETH, liquidity);
        }
    }

    /**
     * @notice Buy Meme tokens from Uniswap
     * @param tokenAddr Address of the meme token to buy
     */
    function buyMeme(address tokenAddr) external payable {
        require(msg.value > 0, "No ETH sent");
        
        address[] memory path = new address[](2);
        path[0] = uniswapRouter.WETH();
        path[1] = tokenAddr;

        // Perform swap
        // amountOutMin = 0 (accept any amount, user should be careful)
        uniswapRouter.swapExactETHForTokens{value: msg.value}(
            0,
            path,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Get all deployed meme token addresses
     */
    function getDeployedMemes() external view returns (address[] memory) {
        return deployedMemes;
    }

    /**
     * @notice Get the number of deployed meme tokens
     */
    function getDeployedMemesCount() external view returns (uint256) {
        return deployedMemes.length;
    }

    // Allow factory to receive ETH (needed for removeLiquidity or refunds if any)
    receive() external payable {}
}
