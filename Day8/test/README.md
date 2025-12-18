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