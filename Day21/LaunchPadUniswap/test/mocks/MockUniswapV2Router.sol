// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../src/MemeToken.sol";

contract MockUniswapV2Router {
    address public WETH;
    address public factory;

    constructor() {
        WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); // Mainnet WETH
        factory = address(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f); // Mainnet Factory
    }

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        // Consume ETH and Tokens (transferFrom logic usually)
        // Since we are mocking, we assume transferFrom is handled by the caller or we just simulate sucess.
        // To be realistic, we should pull the tokens.
        MemeToken(token).transferFrom(msg.sender, address(this), amountTokenDesired);

        return (amountTokenDesired, msg.value, 1000); // Dummy liquidity
    }

    function swapExactETHForTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable returns (uint[] memory amounts) {
        amounts = new uint[](path.length);
        amounts[0] = msg.value;
        amounts[amounts.length - 1] = amountOutMin; 
        
        // In a real swap, we send tokens to 'to'.
        // Mocking: we can't easily send tokens unless we have them. 
        // We will assume the test checks the call, or we could mint if we had privileges (we don't).
        return amounts;
    }
}
