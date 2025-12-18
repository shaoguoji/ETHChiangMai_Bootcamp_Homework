# 题目#1

为 Bank 合约 编写测试。

测试Case 包含：

断言检查存款前后用户在 Bank 合约中的存款额更新是否正确。
检查存款金额的前 3 名用户是否正确，分别检查有1个、2个、3个、4 个用户， 以及同一个用户多次存款的情况。
检查只有管理员可取款，其他人不可以取款。
请提交 github 仓库，仓库中需包含运行 case 通过的日志。

## Log

```sh
➜  Day8 git:(main) ✗ forge test -vv     
[⠊] Compiling...
No files changed, compilation skipped

Ran 3 tests for test/Bank.t.sol:BankTest
[PASS] test_Deposit() (gas: 93861)
Logs:
  account send 10 to bank

[PASS] test_balanceTop3() (gas: 290662)
Logs:
  test 1 account...
  account1 send 30 to bank
  ✅ 1 account test success!
  test 2 account...
  account2 send 10 to bank
  ✅ 2 account test success!
  test 3 account...
  account3 send 50 to bank
  ✅ 3 account test success!
  test 4 account...
  account3 send 40 to bank
  ✅ 4 account test success!
  test repeat deposit...
  account2 send 30 to bank

[PASS] test_withdraw() (gas: 28955)
Logs:
  ✅ withdraw test success!

Suite result: ok. 3 passed; 0 failed; 0 skipped; finished in 6.05ms (5.95ms CPU time)

Ran 1 test suite in 145.76ms (6.05ms CPU time): 3 tests passed, 0 failed, 0 skipped (3 total tests)
```
# 题目#1

编写 NFTMarket 合约：

支持设定任意ERC20价格来上架NFT
支持支付ERC20购买指定的NFT
要求测试内容：

上架NFT：测试上架成功和失败情况，要求断言错误信息和上架事件。
购买NFT：测试购买成功、自己购买自己的NFT、NFT被重复购买、支付Token过多或者过少情况，要求断言错误信息和购买事件。
模糊测试：测试随机使用 0.01-10000 Token价格上架NFT，并随机使用任意Address购买NFT
「可选」不可变测试：测试无论如何买卖，NFTMarket合约中都不可能有 Token 持仓
提交内容要求

使用 foundry 测试和管理合约；
提交 Github 仓库链接到挑战中；
提交 foge test 测试执行结果txt到挑战中；

## Log

```sh
➜  Day8 git:(main) ✗ forge test --mc NFTMarketTest -vvv
[⠊] Compiling...
[⠃] Compiling 1 files with Solc 0.8.30
[⠊] Solc 0.8.30 finished in 822.49ms
Compiler run successful!

Ran 4 tests for test/NFTMarket.t.sol:NFTMarketTest
[PASS] invariant_MarketHoldsNothing() (runs: 256, calls: 128000, reverts: 98728)

╭------------+----------------------+-------+---------+----------╮
| Contract   | Selector             | Calls | Reverts | Discards |
+================================================================+
| BaseERC721 | approve              | 9732  | 9732    | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | mint                 | 9931  | 422     | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | safeTransferFrom     | 19709 | 19709   | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | setApprovalForAll    | 9856  | 0       | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | transferFrom         | 9870  | 9870    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | approve              | 9814  | 12      | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transfer             | 9937  | 9937    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transferFrom         | 9888  | 9784    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transferWithCallback | 9810  | 9809    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | buyNFT               | 9926  | 9926    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | list                 | 9819  | 9819    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | tokensReceived       | 9708  | 9708    | 0        |
╰------------+----------------------+-------+---------+----------╯

[PASS] testFuzz_ListAndBuy(address,address,uint256,uint256) (runs: 256, μ: 404891, ~: 404985)
[PASS] test_NFTMarketBuy() (gas: 275714)
Logs:
  success buy test...
  repeat buy test...
  selft buy test...
  more token buy test...
  less token buy test...

[PASS] test_NFTMarketList() (gas: 115416)
Logs:
  test failed zero price...
  test failed list not approved for all
  test failed list not owner
  test success list

Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 4.79s (5.10s CPU time)

Ran 1 test suite in 4.80s (4.79s CPU time): 4 tests passed, 0 failed, 0 skipped (4 total tests)
```
# Summary

forge test --fuzz-runs 2000 -vv --gas-report   

## Log

```sh
➜  Day8 git:(main) forge test --fuzz-runs 2000 -vv --gas-report     
[⠊] Compiling...
No files changed, compilation skipped

Ran 3 tests for test/Bank.t.sol:BankTest
[PASS] test_Deposit() (gas: 114432)
Logs:
  account send 10 to bank

[PASS] test_balanceTop3() (gas: 599692)
Logs:
  test 1 account...
  account1 send 30 to bank
  ✅ 1 account test success!
  test 2 account...
  account2 send 10 to bank
  ✅ 2 account test success!
  test 3 account...
  account3 send 50 to bank
  ✅ 3 account test success!
  test 4 account...
  account3 send 40 to bank
  ✅ 4 account test success!
  test repeat deposit...
  account2 send 30 to bank

[PASS] test_withdraw() (gas: 73363)
Logs:
  ✅ withdraw test success!

Suite result: ok. 3 passed; 0 failed; 0 skipped; finished in 6.79ms (6.67ms CPU time)

Ran 4 tests for test/NFTMarket.t.sol:NFTMarketTest
[PASS] invariant_MarketHoldsNothing() (runs: 256, calls: 128000, reverts: 98692)

╭------------+----------------------+-------+---------+----------╮
| Contract   | Selector             | Calls | Reverts | Discards |
+================================================================+
| BaseERC721 | approve              | 9774  | 9774    | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | mint                 | 9888  | 401     | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | safeTransferFrom     | 19738 | 19738   | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | setApprovalForAll    | 9773  | 0       | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | transferFrom         | 9785  | 9785    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | approve              | 9929  | 16      | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transfer             | 9772  | 9772    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transferFrom         | 9872  | 9737    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transferWithCallback | 9846  | 9846    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | buyNFT               | 9978  | 9978    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | list                 | 9723  | 9723    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | tokensReceived       | 9922  | 9922    | 0        |
╰------------+----------------------+-------+---------+----------╯

[PASS] testFuzz_ListAndBuy(address,address,uint256,uint256) (runs: 2000, μ: 685670, ~: 686733)
[PASS] test_NFTMarketBuy() (gas: 711082)
Logs:
  success buy test...
  repeat buy test...
  selft buy test...
  more token buy test...
  less token buy test...

[PASS] test_NFTMarketList() (gas: 259852)
Logs:
  test failed zero price...
  test failed list not approved for all
  test failed list not owner
  test success list

Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 4.73s (7.22s CPU time)

╭----------------------------+-----------------+-------+--------+-------+---------╮
| src/Bank.sol:Bank Contract |                 |       |        |       |         |
+=================================================================================+
| Deployment Cost            | Deployment Size |       |        |       |         |
|----------------------------+-----------------+-------+--------+-------+---------|
| 537769                     | 2321            |       |        |       |         |
|----------------------------+-----------------+-------+--------+-------+---------|
|                            |                 |       |        |       |         |
|----------------------------+-----------------+-------+--------+-------+---------|
| Function Name              | Min             | Avg   | Median | Max   | # Calls |
|----------------------------+-----------------+-------+--------+-------+---------|
| blanceTop3User             | 2795            | 2795  | 2795   | 2795  | 15      |
|----------------------------+-----------------+-------+--------+-------+---------|
| receive                    | 53500           | 79165 | 83261  | 94320 | 6       |
|----------------------------+-----------------+-------+--------+-------+---------|
| userBlance                 | 2823            | 2823  | 2823   | 2823  | 2       |
|----------------------------+-----------------+-------+--------+-------+---------|
| withDraw                   | 23775           | 27234 | 27234  | 30693 | 2       |
╰----------------------------+-----------------+-------+--------+-------+---------╯

╭----------------------------------------+-----------------+-------+--------+-------+---------╮
| src/BaseERC721.sol:BaseERC721 Contract |                 |       |        |       |         |
+=============================================================================================+
| Deployment Cost                        | Deployment Size |       |        |       |         |
|----------------------------------------+-----------------+-------+--------+-------+---------|
| 2394330                                | 12090           |       |        |       |         |
|----------------------------------------+-----------------+-------+--------+-------+---------|
|                                        |                 |       |        |       |         |
|----------------------------------------+-----------------+-------+--------+-------+---------|
| Function Name                          | Min             | Avg   | Median | Max   | # Calls |
|----------------------------------------+-----------------+-------+--------+-------+---------|
| balanceOf                              | 2908            | 2908  | 2908   | 2908  | 1       |
|----------------------------------------+-----------------+-------+--------+-------+---------|
| isApprovedForAll                       | 3367            | 3367  | 3367   | 3367  | 262     |
|----------------------------------------+-----------------+-------+--------+-------+---------|
| mint                                   | 30371           | 47998 | 47471  | 69055 | 9787    |
|----------------------------------------+-----------------+-------+--------+-------+---------|
| ownerOf                                | 875             | 2375  | 2875   | 2875  | 1038    |
|----------------------------------------+-----------------+-------+--------+-------+---------|
| setApprovalForAll                      | 5097            | 15784 | 24997  | 46569 | 10073   |
╰----------------------------------------+-----------------+-------+--------+-------+---------╯

╭--------------------------------------+-----------------+-------+--------+-------+---------╮
| src/HookERC20.sol:HookERC20 Contract |                 |       |        |       |         |
+===========================================================================================+
| Deployment Cost                      | Deployment Size |       |        |       |         |
|--------------------------------------+-----------------+-------+--------+-------+---------|
| 1391076                              | 6847            |       |        |       |         |
|--------------------------------------+-----------------+-------+--------+-------+---------|
|                                      |                 |       |        |       |         |
|--------------------------------------+-----------------+-------+--------+-------+---------|
| Function Name                        | Min             | Avg   | Median | Max   | # Calls |
|--------------------------------------+-----------------+-------+--------+-------+---------|
| approve                              | 5212            | 25424 | 25112  | 46708 | 10207   |
|--------------------------------------+-----------------+-------+--------+-------+---------|
| balanceOf                            | 2863            | 2863  | 2863   | 2863  | 2608    |
|--------------------------------------+-----------------+-------+--------+-------+---------|
| transferFrom                         | 11216           | 11216 | 11216  | 11216 | 136     |
╰--------------------------------------+-----------------+-------+--------+-------+---------╯

╭--------------------------------------+-----------------+--------+--------+--------+---------╮
| src/NFTMarket.sol:NFTMarket Contract |                 |        |        |        |         |
+=============================================================================================+
| Deployment Cost                      | Deployment Size |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| 1289413                              | 5925            |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
|                                      |                 |        |        |        |         |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| Function Name                        | Min             | Avg    | Median | Max    | # Calls |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| buyNFT                               | 24370           | 113184 | 114333 | 114333 | 261     |
|--------------------------------------+-----------------+--------+--------+--------+---------|
| list                                 | 22223           | 58356  | 58701  | 58701  | 264     |
╰--------------------------------------+-----------------+--------+--------+--------+---------╯


Ran 2 test suites in 4.86s (4.74s CPU time): 7 tests passed, 0 failed, 0 skipped (7 total tests)
```