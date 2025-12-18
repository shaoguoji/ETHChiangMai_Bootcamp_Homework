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
➜  Day8 git:(main) ✗ forge test -vv                                    
[⠊] Compiling...
[⠃] Compiling 1 files with Solc 0.8.30
[⠊] Solc 0.8.30 finished in 903.67ms
Compiler run successful with warnings:
Warning (2018): Function state mutability can be restricted to view
   --> test/NFTMarket.t.sol:158:5:
    |
158 |     function invariant_MarketHoldsNothing() public {
    |     ^ (Relevant source part starts here and spans across multiple lines).


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

Suite result: ok. 3 passed; 0 failed; 0 skipped; finished in 6.21ms (7.63ms CPU time)

Ran 4 tests for test/NFTMarket.t.sol:NFTMarketTest
[PASS] invariant_MarketHoldsNothing() (runs: 256, calls: 128000, reverts: 98745)

╭------------+----------------------+-------+---------+----------╮
| Contract   | Selector             | Calls | Reverts | Discards |
+================================================================+
| BaseERC721 | approve              | 9720  | 9720    | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | mint                 | 9955  | 404     | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | safeTransferFrom     | 19857 | 19857   | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | setApprovalForAll    | 9790  | 0       | 0        |
|------------+----------------------+-------+---------+----------|
| BaseERC721 | transferFrom         | 9815  | 9815    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | approve              | 9785  | 10      | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transfer             | 9885  | 9885    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transferFrom         | 9742  | 9603    | 0        |
|------------+----------------------+-------+---------+----------|
| HookERC20  | transferWithCallback | 9853  | 9853    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | buyNFT               | 9758  | 9758    | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | list                 | 10048 | 10048   | 0        |
|------------+----------------------+-------+---------+----------|
| NFTMarket  | tokensReceived       | 9792  | 9792    | 0        |
╰------------+----------------------+-------+---------+----------╯

[PASS] testFuzz_ListAndBuy(address,address,uint256,uint256) (runs: 256, μ: 403491, ~: 403898)
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

Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 4.72s (5.14s CPU time)

Ran 2 test suites in 4.73s (4.73s CPU time): 7 tests passed, 0 failed, 0 skipped (7 total tests)
```