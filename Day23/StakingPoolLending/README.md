# StakingPool with Lending Integration

质押 ETH 赚取 KK Token 奖励 + 借贷市场利息收益。

## 核心机制

### 双重收益

1. **KK Token 奖励**: 每区块产出 10 KK Token，按质押比例分配
2. **借贷利息**: 质押的 ETH 存入借贷市场赚取利息

### 工作流程

```
用户 stake(ETH)
    ↓
更新 KK Token 奖励累加器
    ↓
将 ETH 存入借贷市场 (lendingPool.depositETH)
    ↓
用户 unstake()
    ↓
从借贷市场取出 ETH (lendingPool.withdrawETH)
    ↓
返还 ETH 给用户
```

---

## 合约接口

### StakingPool

| 函数 | 描述 |
|------|------|
| `stake()` | 质押 ETH，自动存入借贷市场 |
| `unstake(amount)` | 赎回 ETH，自动从借贷市场取出 |
| `claim()` | 领取 KK Token 奖励 |
| `earned(account)` | 查询待领取 KK Token |
| `balanceOf(account)` | 查询质押数量 |
| `getLendingBalance()` | 查询借贷市场余额（含利息） |

### ILendingPool

```solidity
interface ILendingPool {
    function depositETH() external payable;
    function withdrawETH(uint256 amount) external;
    function getBalance(address account) external view returns (uint256);
}
```

---

## 项目结构

```
src/
├── interfaces/
│   ├── IToken.sol          # ERC20 + mint
│   ├── IStaking.sol        # 质押接口
│   └── ILendingPool.sol    # 借贷池接口
├── KKToken.sol             # 奖励代币
├── StakingPool.sol         # 质押池（含借贷集成）
└── MockLendingPool.sol     # 模拟借贷池

test/
└── StakingPool.t.sol       # 测试文件
```

---

## 测试用例

### 基础功能

| 测试 | 描述 |
|------|------|
| `test_Stake` | 质押 ETH |
| `test_StakeMultipleTimes` | 多次质押累加 |
| `test_Unstake` | 部分赎回 |
| `test_UnstakeAll` | 全部赎回 |
| `test_RevertStakeZero` | 质押 0 失败 |
| `test_RevertUnstakeZero` | 赎回 0 失败 |
| `test_RevertUnstakeInsufficientBalance` | 超额赎回失败 |

### KK Token 奖励

| 测试 | 预期结果 |
|------|----------|
| `test_SingleUserEarnsAllRewards` | 1人质押10区块 → 100 KK |
| `test_TwoUsersEqualStakesSplitRewards` | 2人平分 → 各50 KK |
| `test_TwoUsersUnequalStakes` | 3:1比例 → 75:25 KK |
| `test_DelayedStaking` | 后加入者获得更少 |

### 借贷集成

| 测试 | 预期结果 |
|------|----------|
| `test_StakeDepositsToLending` | 质押后借贷池余额增加 |
| `test_UnstakeWithdrawsFromLending` | 赎回后借贷池余额减少 |
| `test_LendingBalanceIncreases` | 100区块后利息增加 (10ETH→11ETH) |
| `test_MultipleUsersLendingBalance` | 多用户余额正确累加 |

---

## 运行测试

```bash
forge test -vvv
```

### 测试日志

```
[⠒] Compiling...
[⠢] Compiling 4 files with Solc 0.8.30
[⠆] Solc 0.8.30 finished in 1.02s
Compiler run successful!

Ran 21 tests for test/StakingPool.t.sol:StakingPoolTest
[PASS] test_Claim() (gas: 263915)
[PASS] test_ClaimMultipleTimes() (gas: 270370)
[PASS] test_ClaimWithZeroReward() (gas: 161116)
[PASS] test_DelayedStaking() (gas: 278977)
[PASS] test_LendingBalanceIncreases() (gas: 163277)
[PASS] test_MultipleUsersLendingBalance() (gas: 205241)
[PASS] test_NoStakersNoRewards() (gas: 11148)
[PASS] test_RevertStakeZero() (gas: 11495)
[PASS] test_RevertUnstakeInsufficientBalance() (gas: 152770)
[PASS] test_RevertUnstakeZero() (gas: 152637)
[PASS] test_SingleUserEarnsAllRewards() (gas: 155169)
[PASS] test_Stake() (gas: 153230)
[PASS] test_StakeAfterIdlePeriod() (gas: 158843)
[PASS] test_StakeDepositsToLending() (gas: 157003)
[PASS] test_StakeMultipleTimes() (gas: 184287)
[PASS] test_TwoUsersEqualStakesSplitRewards() (gas: 210937)
[PASS] test_TwoUsersUnequalStakes() (gas: 210959)
[PASS] test_Unstake() (gas: 182852)
[PASS] test_UnstakeAll() (gas: 142052)
[PASS] test_UnstakeAutoClaimsRewards() (gas: 230506)
[PASS] test_UnstakeWithdrawsFromLending() (gas: 187034)

Suite result: ok. 21 passed; 0 failed; 0 skipped; finished in 10.35ms (12.62ms CPU time)

Ran 1 test suite in 246.04ms (10.35ms CPU time): 21 tests passed, 0 failed, 0 skipped (21 total tests)
```

---

## 参考

- [SushiSwap MasterChef](https://github.com/sushiswap/masterchef/blob/master/contracts/MasterChef.sol)
- [Aave V3 Pool](https://github.com/aave/aave-v3-core)
