# Meme Launchpad (Minimal Proxy)

A gas-efficient Meme Token Launchpad built on Ethereum using the EIP-1167 Minimal Proxy pattern. This project allows users to deploy their own ERC20 Meme tokens at a fraction of the cost of a standard deployment.

## Test Logs

```sh
➜  MemeLaunchPadMinimalProxy git:(main) ✗ forge test -vvv

[⠊] Compiling...
[⠑] Compiling 34 files with Solc 0.8.30
[⠘] Solc 0.8.30 finished in 643.95ms
Compiler run successful!

Ran 5 tests for test/MemeFactory.t.sol:MemeFactoryTest
[PASS] testDeployMeme() (gas: 260726)
[PASS] testFeeDistribution() (gas: 363173)
[PASS] testMintMeme() (gas: 368044)
[PASS] testRefund() (gas: 371941)
[PASS] testSupplyCap() (gas: 396282)
Suite result: ok. 5 passed; 0 failed; 0 skipped; finished in 1.89ms (2.15ms CPU time)

Ran 2 tests for test/Counter.t.sol:CounterTest
[PASS] testFuzz_SetNumber(uint256) (runs: 256, μ: 28744, ~: 29289)
[PASS] test_Increment() (gas: 28783)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 5.29ms (5.07ms CPU time)

Ran 2 test suites in 174.82ms (7.18ms CPU time): 7 tests passed, 0 failed, 0 skipped (7 total tests)
```

## Key Features

- **Gas Efficient Deployment**: Uses OpenZeppelin's `Clones` library to deploy minimal proxies representing each Meme Token.
- **Fair Launch Mechanics**:
  - **Per Mint Limit**: Limits the amount of tokens that can be minted in a single transaction to ensure fair distribution.
  - **Supply Cap**: strict enforcement of total supply.
- **Revenue Model**:
  - **1% Protocol Fee**: Collected by the factory/platform.
  - **99% Issuer Revenue**: Directly forwarded to the token creator.
- **Automatic Refunds**: Excess ETH sent during minting is automatically refunded to the user.

## Contracts

### `MemeFactory.sol`
The main entry point.
- **`deployMeme(symbol, totalSupply, perMint, price)`**: Deploys a new Meme Token proxy.
- **`mintMeme(tokenAddr)`**: Handles the minting logic, payment processing, fee splitting, and supply checks.

### `MemeToken.sol`
The implementation contract.
- Standard OpenZeppelin `ERC20`.
- Uses `initialize` instead of `constructor` to support proxy pattern.
- Only the `MemeFactory` is authorized to mint new tokens.

## Development

### Prerequisites
- [Foundry](https://getfoundry.sh/)

### Build
```bash
forge build
```

### Test
```bash
forge test -vvv
```
