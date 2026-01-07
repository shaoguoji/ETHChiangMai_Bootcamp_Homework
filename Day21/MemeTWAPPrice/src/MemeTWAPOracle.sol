// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IUniswapV2Pair.sol";
import "./interfaces/IUniswapV2Factory.sol";

/**
 * @title MemeTWAPOracle
 * @notice TWAP (Time-Weighted Average Price) oracle for meme tokens on Uniswap V2
 * @dev Stores cumulative price observations and calculates average prices over time
 */
contract MemeTWAPOracle {
    struct Observation {
        uint256 timestamp;
        uint256 price0Cumulative;
        uint256 price1Cumulative;
    }

    // pair address => observations
    mapping(address => Observation) public observations;

    // Minimum period between updates
    uint256 public constant MIN_PERIOD = 1 minutes;

    event Updated(
        address indexed pair,
        uint256 price0Cumulative,
        uint256 price1Cumulative,
        uint256 timestamp
    );

    /**
     * @notice Update the cumulative price observation for a pair
     * @param pair The Uniswap V2 pair address
     */
    function update(address pair) external {
        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = 
            _currentCumulativePrices(pair);

        Observation storage obs = observations[pair];
        
        // First observation
        if (obs.timestamp == 0) {
            obs.timestamp = blockTimestamp;
            obs.price0Cumulative = price0Cumulative;
            obs.price1Cumulative = price1Cumulative;
            emit Updated(pair, price0Cumulative, price1Cumulative, blockTimestamp);
            return;
        }

        uint256 timeElapsed = blockTimestamp - obs.timestamp;
        require(timeElapsed >= MIN_PERIOD, "Period not elapsed");

        obs.timestamp = blockTimestamp;
        obs.price0Cumulative = price0Cumulative;
        obs.price1Cumulative = price1Cumulative;
        
        emit Updated(pair, price0Cumulative, price1Cumulative, blockTimestamp);
    }

    /**
     * @notice Get the TWAP price for a token
     * @param pair The Uniswap V2 pair address
     * @param tokenIn The input token address
     * @param amountIn The amount of input tokens
     * @return amountOut The equivalent amount of output tokens based on TWAP
     */
    function consult(address pair, address tokenIn, uint256 amountIn) 
        external 
        view 
        returns (uint256 amountOut) 
    {
        Observation memory obs = observations[pair];
        require(obs.timestamp > 0, "No observation");

        (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) = 
            _currentCumulativePrices(pair);

        uint256 timeElapsed = blockTimestamp - obs.timestamp;
        require(timeElapsed > 0, "No time elapsed");

        address token0 = IUniswapV2Pair(pair).token0();

        if (tokenIn == token0) {
            // price0 = token1 / token0, so amountOut = amountIn * price0
            uint256 price0Average = (price0Cumulative - obs.price0Cumulative) / timeElapsed;
            amountOut = (amountIn * price0Average) >> 112; // UQ112x112
        } else {
            // price1 = token0 / token1, so amountOut = amountIn * price1
            uint256 price1Average = (price1Cumulative - obs.price1Cumulative) / timeElapsed;
            amountOut = (amountIn * price1Average) >> 112; // UQ112x112
        }
    }

    /**
     * @notice Get current cumulative prices from the pair
     * @dev Handles overflow by adding accumulated price since last block
     */
    function _currentCumulativePrices(address pair) 
        internal 
        view 
        returns (uint256 price0Cumulative, uint256 price1Cumulative, uint32 blockTimestamp) 
    {
        blockTimestamp = uint32(block.timestamp);
        price0Cumulative = IUniswapV2Pair(pair).price0CumulativeLast();
        price1Cumulative = IUniswapV2Pair(pair).price1CumulativeLast();

        // Get reserves
        (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast) = 
            IUniswapV2Pair(pair).getReserves();

        // If time has passed since last update, add the accumulated price
        if (blockTimestampLast != blockTimestamp && reserve0 > 0 && reserve1 > 0) {
            uint32 timeElapsed = blockTimestamp - blockTimestampLast;
            // UQ112x112 encoding
            price0Cumulative += uint256(reserve1) * (2**112) / reserve0 * timeElapsed;
            price1Cumulative += uint256(reserve0) * (2**112) / reserve1 * timeElapsed;
        }
    }

    /**
     * @notice Get the last observation for a pair
     */
    function getObservation(address pair) external view returns (
        uint256 timestamp,
        uint256 price0Cumulative,
        uint256 price1Cumulative
    ) {
        Observation memory obs = observations[pair];
        return (obs.timestamp, obs.price0Cumulative, obs.price1Cumulative);
    }
}
