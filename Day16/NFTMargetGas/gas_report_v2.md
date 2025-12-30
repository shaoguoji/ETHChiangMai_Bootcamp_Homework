# gas cost report after optimize

```sh
➜  NFTMargetGas git:(main) ✗ forge test  --gas-report
[⠊] Compiling...
[⠊] Compiling 2 files with Solc 0.8.30
[⠒] Solc 0.8.30 finished in 939.05ms
Compiler run successful!

Ran 2 tests for test/Counter.t.sol:CounterTest
[PASS] testFuzz_SetNumber(uint256) (runs: 256, μ: 52222, ~: 52565)
[PASS] test_Increment() (gas: 51847)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 13.18ms (10.67ms CPU time)

Ran 3 tests for test/NFTMarket.t.sol:NFTMarketTest
[PASS] testFuzz_ListAndBuy(address,address,uint256,uint256) (runs: 256, μ: 678713, ~: 679678)
[PASS] test_NFTMarketBuy() (gas: 687266)
[PASS] test_NFTMarketList() (gas: 252152)
Suite result: ok. 3 passed; 0 failed; 0 skipped; finished in 343.21ms (341.39ms CPU time)

╭--------------------------------------+-----------------+--------+--------+--------+---------╮
| src/NFTMarket.sol:NFTMarket Contract |                 |        |        |        |         |
+=============================================================================================+
| Deployment Cost                      | Deployment Size |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| 1016226                              | 4947            |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
|                                      |                 |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| Function Name                        | Min             | Avg    | Median | Max    | # Calls |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| buyNFT                               | 24121           | 108517 | 109658 | 109670 | 261     |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| list                                 | 21956           | 56082  | 56419  | 56431  | 264     |
╰--------------------------------------+-----------------+--------+--------+--------+---------╯


Ran 2 test suites in 380.88ms (356.39ms CPU time): 5 tests passed, 0 failed, 0 skipped (5 total tests)
```

