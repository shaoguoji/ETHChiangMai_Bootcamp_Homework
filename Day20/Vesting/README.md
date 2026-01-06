# Vesting Contract

一个带有 Cliff 和线性释放机制的代币归属合约。

## 功能特性

- **Cliff 期**: 12 个月锁定期，期间无法释放任何代币
- **线性释放**: 从第 13 个月开始，每月释放 1/24 的代币
- **总归属期**: 36 个月后 100% 完全解锁
- **受益人**: 部署时指定的代币接收地址

## 测试日志

```sh
➜  Vesting git:(main) ✗ forge test -vvv
[⠊] Compiling...
No files changed, compilation skipped

Ran 15 tests for test/Vesting.t.sol:VestingTest
[PASS] test_AfterFullVesting() (gas: 10580)
[PASS] test_ConstructorValidations() (gas: 112559)
[PASS] test_EventEmission() (gas: 73973)
[PASS] test_FirstMonthAfterCliff() (gas: 88786)
[PASS] test_FullVesting() (gas: 77386)
[PASS] test_GetCliffEndTime() (gas: 6758)
[PASS] test_GetVestingEndTime() (gas: 7268)
[PASS] test_HalfwayThroughVesting() (gas: 12628)
[PASS] test_InitialState() (gas: 22192)
[PASS] test_MonthlyVestingSchedule() (gas: 174330)
[PASS] test_MultipleReleases() (gas: 97033)
[PASS] test_NoReleaseBeforeCliff() (gas: 21261)
[PASS] test_ReleaseAfterAlreadyReleased() (gas: 73987)
[PASS] test_ReleaseFailsBeforeCliff() (gas: 12555)
[PASS] test_SecondMonthAfterCliff() (gas: 12606)
Suite result: ok. 15 passed; 0 failed; 0 skipped; finished in 7.66ms (8.66ms CPU time)

Ran 1 test suite in 2.13s (7.66ms CPU time): 15 tests passed, 0 failed, 0 skipped (15 total tests)
```

## 合约说明

### Vesting.sol

核心归属合约，包含以下功能：

| 函数 | 描述 |
|------|------|
| `release()` | 释放当前可领取的代币给受益人 |
| `vestedAmount()` | 查询到当前时间已解锁的代币总量 |
| `releasable()` | 查询当前可释放的代币数量 |
| `getCliffEndTime()` | 获取 Cliff 结束时间 |
| `getVestingEndTime()` | 获取完全解锁时间 |

### MockERC20.sol

测试用 ERC20 代币合约。

## 使用方法

### 安装依赖

```bash
forge install
```

### 运行测试

```bash
forge test -vvv
```

### 部署

```bash
forge script script/Deploy.s.sol --broadcast --rpc-url <RPC_URL>
```

## 测试覆盖

使用 Foundry 的 `vm.warp` 进行时间模拟测试：

- ✅ Cliff 期间无法释放代币
- ✅ 第 13 个月释放 1/24 代币
- ✅ 每月递增释放验证
- ✅ 第 36 个月完全解锁
- ✅ 多次释放累计正确
- ✅ 重复释放防护

## 归属时间线

```
月份 1-12:  ████████████ Cliff (锁定)
月份 13:    █ 释放 1/24
月份 14:    ██ 释放 2/24
...
月份 36:    ████████████████████████ 释放 24/24 (100%)
```

## License

MIT
