# StakingPool - ETH 质押挖矿合约

质押 ETH 赚取 KK Token 奖励，采用 **MasterChef 模式**实现公平分配。

## 核心机制

### 奖励分配

- **产出速率**: 每区块产出 10 KK Token
- **分配规则**: 按质押比例 × 质押时长公平分配

### MasterChef 算法

```
┌─────────────────────────────────────────────────────────────┐
│  accTokenPerStake: 累计每单位质押的奖励（放大 1e12 倍）       │
│  rewardDebt: 用户已结算的奖励快照                            │
└─────────────────────────────────────────────────────────────┘

更新池子：
  accTokenPerStake += (区块奖励 × 1e12) ÷ 总质押量

计算待领奖励：
  pending = (质押量 × accTokenPerStake ÷ 1e12) - rewardDebt

重置债务（每次操作后）：
  rewardDebt = 质押量 × accTokenPerStake ÷ 1e12
```

### 精度放大 (1e12)

Solidity 整数除法会丢失小数，通过先乘后除保留精度：

```solidity
// 错误：10 / 3 = 3（丢失 0.333...）
// 正确：(10 × 1e12) / 3 = 3,333,333,333,333 → 最后再 / 1e12 还原
```

---

## 合约接口

### `stake()`

```solidity
function stake() external payable;
```

质押 ETH。如有历史奖励会自动领取。

### `unstake(uint256 amount)`

```solidity
function unstake(uint256 amount) external;
```

赎回指定数量 ETH，自动领取待发奖励。

### `claim()`

```solidity
function claim() external;
```

仅领取奖励，不改变质押量。

### `earned(address account)`

```solidity
function earned(address account) external view returns (uint256);
```

查询待领取奖励数量。

### `balanceOf(address account)`

```solidity
function balanceOf(address account) external view returns (uint256);
```

查询用户质押的 ETH 数量。

---

## 测试用例

### 基础功能

| 测试 | 描述 |
|------|------|
| `test_Stake` | 质押 1 ETH，验证余额更新 |
| `test_StakeMultipleTimes` | 多次质押累加 |
| `test_Unstake` | 部分赎回 |
| `test_UnstakeAll` | 全部赎回 |
| `test_RevertStakeZero` | 质押 0 应失败 |
| `test_RevertUnstakeZero` | 赎回 0 应失败 |
| `test_RevertUnstakeInsufficientBalance` | 超额赎回应失败 |

### 奖励计算

| 测试 | 场景 | 预期结果 |
|------|------|----------|
| `test_SingleUserEarnsAllRewards` | 1 人质押，过 10 区块 | 获得 100 KK |
| `test_TwoUsersEqualStakesSplitRewards` | 2 人各质押 1 ETH，过 10 区块 | 各获得 50 KK |
| `test_TwoUsersUnequalStakes` | A 质押 3 ETH，B 质押 1 ETH | A 获 75 KK，B 获 25 KK |
| `test_DelayedStaking` | A 先质押 5 区块，B 加入再过 5 区块 | A 获 75 KK，B 获 25 KK |

### 领取奖励

| 测试 | 描述 |
|------|------|
| `test_Claim` | 领取后余额正确，earned 归零 |
| `test_ClaimMultipleTimes` | 分多次领取累计正确 |
| `test_ClaimWithZeroReward` | 无奖励时领取不报错 |
| `test_UnstakeAutoClaimsRewards` | 赎回时自动领取奖励 |

### 边界情况

| 测试 | 描述 |
|------|------|
| `test_NoStakersNoRewards` | 无人质押时 accTokenPerStake 不增长 |
| `test_StakeAfterIdlePeriod` | 空闲期后质押，只从质押时刻开始计奖 |

---

## 运行测试

```bash
forge test -vvv
```

### 测试结果

```
Ran 17 tests for test/StakingPool.t.sol:StakingPoolTest
[PASS] test_Claim()
[PASS] test_ClaimMultipleTimes()
[PASS] test_ClaimWithZeroReward()
[PASS] test_DelayedStaking()
[PASS] test_NoStakersNoRewards()
[PASS] test_RevertStakeZero()
[PASS] test_RevertUnstakeInsufficientBalance()
[PASS] test_RevertUnstakeZero()
[PASS] test_SingleUserEarnsAllRewards()
[PASS] test_Stake()
[PASS] test_StakeAfterIdlePeriod()
[PASS] test_StakeMultipleTimes()
[PASS] test_TwoUsersEqualStakesSplitRewards()
[PASS] test_TwoUsersUnequalStakes()
[PASS] test_Unstake()
[PASS] test_UnstakeAll()
[PASS] test_UnstakeAutoClaimsRewards()

Suite result: ok. 17 passed; 0 failed
```

---

## 项目结构

```
src/
├── interfaces/
│   ├── IToken.sol      # ERC20 + mint 接口
│   └── IStaking.sol    # 质押接口
├── KKToken.sol         # 奖励代币
└── StakingPool.sol     # 质押池合约

test/
└── StakingPool.t.sol   # Foundry 测试
```

---

## 参考

- [SushiSwap MasterChef](https://github.com/sushiswap/masterchef/blob/master/contracts/MasterChef.sol)
