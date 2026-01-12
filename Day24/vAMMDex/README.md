# vAMM 杠杆 DEX

基于虚拟自动做市商 (vAMM) 机制的简单杠杆交易协议。

## vAMM 机制

使用恒定乘积公式 (`x * y = k`) 实现价格发现，但不需要实际的代币储备：

- **vQuoteReserve**: 虚拟报价资产储备 (如 vUSD)
- **vBaseReserve**: 虚拟基础资产储备 (如 vETH)
- **价格** = vQuote / vBase

```
┌─────────────────────────────────────────────────────────┐
│                    vAMM Price Curve                     │
│                                                         │
│  vQuote │    *                                          │
│         │      *                                        │
│         │        *     x * y = k                        │
│         │          *                                    │
│         │            *                                  │
│         │              * * * *                          │
│         └─────────────────────────────── vBase          │
└─────────────────────────────────────────────────────────┘
```

## 核心功能

### `openPosition(uint256 _margin, uint level, bool long)`

开启杠杆头寸。

| 参数 | 说明 |
|------|------|
| `_margin` | 存入的保证金数量 |
| `level` | 杠杆倍数 (1-10x) |
| `long` | `true` = 做多, `false` = 做空 |

**做多流程:**
1. 用户存入保证金
2. 计算名义价值 = margin × leverage
3. 将 quote 添加到池中，获得 base: `size = vBase - k/(vQuote + notional)`
4. 记录 `openNotional` 用于平仓 PnL 计算

**做空流程:**
1. 用户存入保证金
2. 从池中移除 quote，添加 base: `size = k/(vQuote - notional) - vBase`

### `closePosition()`

关闭调用者的头寸并结算盈亏。

**PnL 计算** (基于实际 swap 输出，而非即时价格):
- **Long**: `closeNotional = vQuote - k/(vBase + size)` → PnL = closeNotional - openNotional
- **Short**: `closeNotional = k/(vBase - size) - vQuote` → PnL = openNotional - closeNotional

### `liquidatePosition(address _user)`

清算亏损超过阈值的头寸。

- **清算条件**: 亏损 ≥ 保证金的 80%
- **清算奖励**: 剩余保证金归清算人

## 测试

```bash
# 运行所有测试
forge test -vvv

# 测试覆盖
15/15 tests passed ✅
```

### 测试用例

| 测试 | 说明 |
|------|------|
| `test_OpenLongPosition` | 开启多头头寸 |
| `test_OpenShortPosition` | 开启空头头寸 |
| `test_ClosePositionWithProfit` | 盈利平仓 |
| `test_ClosePositionWithLoss` | 亏损平仓 |
| `test_ShortPositionProfit` | 做空获利 |
| `test_LiquidateUnderwaterPosition` | 清算水下头寸 |
| `test_PnLMatchesActualSwapOutput` | 验证 PnL 与 swap 输出一致 |

## 合约地址

开发环境部署命令:

```bash
make deploy local
```

## 项目结构

```
vAMMDex/
├── src/
│   └── VammDex.sol         # 主合约
├── test/
│   └── VammDex.t.sol       # 测试文件
├── script/
│   └── Deploy.s.sol        # 部署脚本
└── foundry.toml            # Foundry 配置
```

## 许可证

MIT
