# Meme TWAP Price Oracle 📈

A secure Time-Weighted Average Price (TWAP) Oracle for Meme tokens deployed on LaunchPadUniswap.

## Test Log

```sh
➜  MemeTWAPPrice git:(main) forge test -vvv
[⠊] Compiling...
No files changed, compilation skipped

Ran 4 tests for test/MemeTWAPOracle.t.sol:MemeTWAPOracleTest
[PASS] test_Consult_PriceChange() (gas: 118567)
[PASS] test_Consult_SteadyPrice() (gas: 68867)
[PASS] test_FirstUpdate() (gas: 52620)
[PASS] test_Update_WindowUpdate() (gas: 172093)
Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 5.94ms (2.35ms CPU time)

Ran 2 tests for test/Counter.t.sol:CounterTest
[PASS] testFuzz_SetNumber(uint256) (runs: 256, μ: 28589, ~: 29289)
[PASS] test_Increment() (gas: 28783)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 12.56ms (9.63ms CPU time)

Ran 2 test suites in 2.04s (18.51ms CPU time): 6 tests passed, 0 failed, 0 skipped (6 total tests)
➜  MemeTWAPPrice git:(main) ✗ 
```

## 🌟 Overview

This project implements an on-chain Oracle that provides manipulation-resistant price feeds for Meme tokens by calculating the Time-Weighted Average Price (TWAP) from Uniswap V2 pairs.

It is designed to work seamlessly with the [LaunchPadUniswap](../LaunchPadUniswap) project, allowing external contracts to query the average price of meme tokens over specific time windows.

## 🛠 Features

- **🛡️ Manipulation Resistant**: Uses historical cumulative prices to prevent flash loan attacks.
- **⏱️ Flexible Time Windows**: Calculates average price over any observed time period.
- **🔄 Sliding Window Updates**: Supports continuous price tracking with `update()` mechanism.
- **⚡ EIP-1167 Compatible**: Designed to work with the minimal proxy meme tokens from the Launchpad.

## 🏗 Architecture

### Contracts

- **`MemeTWAPOracle.sol`**: The core oracle contract.
  - `update(pair)`: Snapshots the current `priceCumulativeLast` from Uniswap.
  - `consult(pair, tokenIn, amountIn)`: Calculates the average output amount for `tokenIn` based on the TWAP between the last two snapshots.
  - `getObservation(pair)`: Returns the timestamp and cumulative prices of the last update.

### Interfaces

- **`IUniswapV2Pair.sol`**: Interface for interacting with Uniswap V2 pairs (getReserves, priceCumulativeLast).

## 🧪 Testing

The project includes a comprehensive test suite using Foundry.

### Running Tests

```bash
forge test -vvv
```

### Test Scenarios

We simulate time travel and price changes to verify the Oracle's accuracy:

1.  **`test_FirstUpdate`**: Verifies that the first `update()` correctly initializes the observation.
2.  **`test_Consult_SteadyPrice`**: Confirms that if the spot price remains constant (e.g., 1000), the TWAP matches the spot price.
3.  **`test_Consult_PriceChange`**: **Key Scenario**.
    - T=0h: Price 1000
    - T=1h: Price changes to 2000
    - T=2h: Oracle acts
    - **Result**: The TWAP correctly calculates the average as **1500** ((1000*1h + 2000*1h) / 2h).
4.  **`test_Update_WindowUpdate`**: Verifies that calling `update()` repeatedly correctly moves the observation window forward.

## 🚀 Usage

### 1. Deploy

```bash
make deploy sepolia
```

### 2. Integration

```solidity
interface IMemeTWAPOracle {
    function update(address pair) external;
    function consult(address pair, address tokenIn, uint256 amountIn) external view returns (uint256 amountOut);
}

contract MyDeFiProtocol {
    IMemeTWAPOracle public oracle;

    function safeGetPrice(address pair, address token, uint256 amount) external returns (uint256) {
        // Ensure the oracle has fresh data (optional, depends on use case)
        oracle.update(pair);
        
        // Consult the TWAP
        return oracle.consult(pair, token, amount);
    }
}
```

## 📜 License

MIT
