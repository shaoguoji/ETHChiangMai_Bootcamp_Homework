# Deflationary Rebase Token

通缩型 Rebase Token (ERC20)，每年供应量在上一年的基础上下降 1%。

## 设计原理

Rebase Token 的核心思想是**分离内部份额 (shares) 与外部余额 (balance)**：

```
balance = shares × rebaseRatio / 1e18
```

| 概念 | 说明 |
|-----|------|
| **Shares** | 用户实际持有的内部份额，转账时转移 shares |
| **Balance** | 用户看到的余额，通过 shares × ratio 计算 |
| **Rebase** | 调整 rebaseRatio，使所有用户余额同时变化 |

### 通缩机制

每年调用 `rebase()` 时，`rebaseRatio` 下降 1%：

```
Year 0: ratio = 1.0    → balance = 1,000,000
Year 1: ratio = 0.99   → balance = 990,000 (-1%)
Year 2: ratio = 0.9801 → balance = 980,100 (-1.99%)
...
Year 10: ratio ≈ 0.904 → balance ≈ 904,382 (-9.56%)
```

## 核心 API

```solidity
// 查询通缩后余额
function balanceOf(address account) returns (uint256)

// 查询原始份额
function sharesOf(address account) returns (uint256)

// 执行通缩 rebase（每年只能调用一次）
function rebase() external

// 检查是否可以 rebase
function canRebase() returns (bool)

// 获取当前年份（从部署开始计算）
function getCurrentYear() returns (uint256)
```

## 使用示例

```solidity
// 部署时 mint 100万代币
DeflationaryToken token = new DeflationaryToken("DFT", "DFT", 1_000_000 ether);

// 初始余额
token.balanceOf(user); // 1,000,000

// 1年后调用 rebase
vm.warp(block.timestamp + 365 days);
token.rebase();

// 余额自动下降 1%
token.balanceOf(user); // 990,000
```

## 运行测试

```bash
forge test -vvv
```

### 测试用例

| 测试 | 描述 |
|-----|------|
| `testInitialBalance` | 初始 mint 余额正确 |
| `testRebaseAfterOneYear` | 1 年后余额下降 1% |
| `testRebaseAfterMultipleYears` | 多年复合通缩 |
| `testCannotRebaseSameYear` | 同年不能重复 rebase |
| `testTransferAfterRebase` | rebase 后转账正确 |
| `testAllowanceAfterRebase` | rebase 后授权额度调整 |
| `testLongTermDeflation` | 10 年长期通缩验证 |

## 项目结构

```
rebaseToken/
├── src/
│   └── DeflationaryToken.sol   # 主合约
├── test/
│   └── DeflationaryToken.t.sol # Foundry 测试
├── foundry.toml
└── README.md
```

## License

MIT
