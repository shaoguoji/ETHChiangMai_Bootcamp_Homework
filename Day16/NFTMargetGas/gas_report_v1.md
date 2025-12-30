# original gas cost report 

```sh
➜  NFTMargetGas git:(main) ✗ forge test  --gas-report
[⠊] Compiling...
No files changed, compilation skipped

Ran 2 tests for test/Counter.t.sol:CounterTest
[PASS] testFuzz_SetNumber(uint256) (runs: 256, μ: 52070, ~: 52559)
[PASS] test_Increment() (gas: 51847)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 16.84ms (12.55ms CPU time)

Ran 3 tests for test/NFTMarket.t.sol:NFTMarketTest
[PASS] testFuzz_ListAndBuy(address,address,uint256,uint256) (runs: 256, μ: 685888, ~: 686755)
[PASS] test_NFTMarketBuy() (gas: 710994)
[PASS] test_NFTMarketList() (gas: 259874)
Suite result: ok. 3 passed; 0 failed; 0 skipped; finished in 349.71ms (348.86ms CPU time)

╭--------------------------------------+-----------------+--------+--------+--------+---------╮
| src/NFTMarket.sol:NFTMarket Contract |                 |        |        |        |         |
+=============================================================================================+
| Deployment Cost                      | Deployment Size |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| 1362268                              | 6262            |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
|                                      |                 |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| Function Name                        | Min             | Avg    | Median | Max    | # Calls |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| buyNFT                               | 24370           | 113184 | 114333 | 114333 | 261     |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| list                                 | 22223           | 58356  | 58701  | 58701  | 264     |
╰--------------------------------------+-----------------+--------+--------+--------+---------╯


Ran 2 test suites in 387.60ms (366.56ms CPU time): 5 tests passed, 0 failed, 0 skipped (5 total tests)
```
