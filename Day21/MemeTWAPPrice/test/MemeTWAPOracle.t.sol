// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/MemeTWAPOracle.sol";
import "./mocks/MockUniswapV2Pair.sol";

contract MemeTWAPOracleTest is Test {
    MemeTWAPOracle oracle;
    MockUniswapV2Pair pair;
    address token0;
    address token1;

    // Use 18 decimals for simplicity
    uint256 constant DECIMALS = 1e18;

    function setUp() public {
        oracle = new MemeTWAPOracle();
        
        // Setup mock tokens (just addresses)
        token0 = makeAddr("token0");
        token1 = makeAddr("token1");
        
        // deploy mock pair
        pair = new MockUniswapV2Pair(token0, token1);
        
        // Init reserves: 10 ETH, 10000 Tokens (Price: 1 ETH = 1000 Tokens)
        // Reserve0 = 10 * 1e18
        // Reserve1 = 10000 * 1e18
        pair.setReserves(uint112(10 * DECIMALS), uint112(10000 * DECIMALS));
    }

    function test_FirstUpdate() public {
        // Initial update
        oracle.update(address(pair));
        
        (uint256 timestamp, uint256 price0Cum, uint256 price1Cum) = 
            oracle.getObservation(address(pair));
            
        assertEq(timestamp, block.timestamp);
        assertEq(price0Cum, 0); // Started at 0
        assertEq(price1Cum, 0);
    }

    function test_Consult_SteadyPrice() public {
        // 1. First update to establish baseline
        oracle.update(address(pair));

        // 2. Advance time by 1 hour
        vm.warp(block.timestamp + 1 hours);

        // 3. Consult price
        // Price should be 1000 Tokens for 1 ETH
        // token0 = ETH (10 reserve), token1 = Token (10000 reserve)
        // Price0 = 10000 / 10 = 1000
        
        // Consult amountOut for 1 ETH of token0
        uint256 amountOut = oracle.consult(address(pair), token0, 1 ether);
        
        // Expect close to 1000 * 1e18
        // Allow small rounding error
        assertApproxEqAbs(amountOut, 1000 * DECIMALS, 1000); 
    }

    function test_Consult_PriceChange() public {
        oracle.update(address(pair));
        uint256 startTime = block.timestamp;

        // Period 1: Price 1000 for 1 hour
        vm.warp(startTime + 1 hours);
        
        // Change price to 2000 (10 ETH, 20000 Tokens)
        // Note: calling setReserves updates cumulative price for the PASSED time using OLD reserves (1000 price)
        pair.setReserves(uint112(10 * DECIMALS), uint112(20000 * DECIMALS));

        // Period 2: Price 2000 for 1 hour
        vm.warp(startTime + 2 hours);

        // Now consult. Total time 2 hours.
        // Hour 1: Price 1000
        // Hour 2: Price 2000
        // Avg = 1500
        
        uint256 amountOut = oracle.consult(address(pair), token0, 1 ether);
        
        assertApproxEqAbs(amountOut, 1500 * DECIMALS, 1000);
    }

    function test_Update_WindowUpdate() public {
        oracle.update(address(pair));
        uint256 startTime = block.timestamp;
        
        // Advance 1 hour
        vm.warp(startTime + 1 hours);
        
        // Update oracle again. This should update the stored observation.
        oracle.update(address(pair));
        
        (uint256 ts, , ) = oracle.getObservation(address(pair));
        assertEq(ts, startTime + 1 hours);
        
        // Advance another hour with NEW price
        // Change price to 2000
        pair.setReserves(uint112(10 * DECIMALS), uint112(20000 * DECIMALS));
        
        vm.warp(startTime + 2 hours);
        
        // Consult now uses the stored observation at t=1h as baseline
        // So window is only the last hour (Price 2000)
        
        uint256 amountOut = oracle.consult(address(pair), token0, 1 ether);
        assertApproxEqAbs(amountOut, 2000 * DECIMALS, 1000);
    }
}
