// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../src/interfaces/IUniswapV2Pair.sol";

contract MockUniswapV2Pair {
    address public token0;
    address public token1;
    
    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;
    
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    
    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }
    
    function getReserves() external view returns (uint112, uint112, uint32) {
        return (reserve0, reserve1, blockTimestampLast);
    }
    
    // Simulate a sync/update that happens in Uniswap V2
    // Must be called before changing reserves to update cumulative prices
    function _update(uint112 balance0, uint112 balance1) internal {
        uint32 blockTimestamp = uint32(block.timestamp);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        
        if (timeElapsed > 0 && reserve0 != 0 && reserve1 != 0) {
            // * never overflows, and + overflow is desired
            price0CumulativeLast += uint256(reserve1) * (2**112) / reserve0 * timeElapsed;
            price1CumulativeLast += uint256(reserve0) * (2**112) / reserve1 * timeElapsed;
        }
        
        reserve0 = balance0;
        reserve1 = balance1;
        blockTimestampLast = blockTimestamp;
    }
    
    function setReserves(uint112 _reserve0, uint112 _reserve1) external {
        _update(_reserve0, _reserve1);
    }
    
    // Helper to simulate cumulative price update without changing reserves (e.g. just time passing)
    function sync() external {
        _update(reserve0, reserve1);
    }
}
