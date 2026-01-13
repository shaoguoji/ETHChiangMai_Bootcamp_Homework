# 看涨期权 Token (Call Option Token)

基于 ETH 的看涨期权 ERC20 代币系统，支持项目方发行期权、用户行权、过期销毁等功能。

## ✨ 功能特性

| 功能 | 角色 | 描述 |
|------|------|------|
| **发行期权** | 项目方 | 存入 ETH，按 1:1 铸造期权 Token |
| **购买期权** | 用户 | 通过 DEX 交易对（期权/USDT）以较低价格购买 |
| **行权** | 用户 | 到期日当天，用 USDT 按行权价格兑换 ETH |
| **过期销毁** | 项目方 | 过期后销毁所有期权 Token，赎回 ETH 和 USDT |

## 📁 合约说明

### CallOptionToken.sol
核心期权代币合约，继承 OpenZeppelin ERC20。

**关键参数:**
- `strikePrice`: 行权价格（USDT per ETH，18 decimals）
- `expirationDate`: 行权日期（Unix 时间戳）
- `usdt`: USDT 合约地址

**核心函数:**
```solidity
// 项目方：发行期权（存入 ETH）
function issue() external payable onlyIssuer;

// 用户：行权（到期日当天）
function exercise(uint256 amount) external;

// 项目方：过期销毁
function expireRedeem() external onlyIssuer;
```

### MockUSDT.sol
测试用 USDT 模拟合约。

## 🚀 快速开始

### 编译
```bash
forge build
```

### 测试
```bash
forge test -vvv
```

### 部署
```bash
# 本地
make deploy local

# Sepolia
make deploy sepolia
```

## 📝 使用示例

### 1. 项目方发行期权
```solidity
// 存入 10 ETH，获得 10 期权 Token
option.issue{value: 10 ether}();
```

### 2. 用户购买期权
```solidity
// 在 DEX 上用 USDT 购买期权 Token
// 例如：在 Uniswap 上创建 OPTION/USDT 交易对
```

### 3. 用户行权（到期日当天）
```solidity
// 授权 USDT
usdt.approve(address(option), type(uint256).max);

// 行权 2 个期权 Token，获得 2 ETH
// 支付 2 * strikePrice USDT
option.exercise(2 ether);
```

### 4. 项目方过期销毁
```solidity
// 过期后赎回所有 ETH 和 USDT
option.expireRedeem();
```

## 🧪 测试覆盖

| 测试 | 描述 |
|------|------|
| `test_Issue` | 项目方发行期权 |
| `test_Issue_OnlyIssuer` | 只有项目方能发行 |
| `test_Issue_AfterExpiration` | 过期后不能发行 |
| `test_Exercise` | 用户行权 |
| `test_Exercise_BeforeExpiration` | 到期前不能行权 |
| `test_Exercise_AfterExpiration` | 到期后不能行权 |
| `test_ExpireRedeem` | 项目方过期赎回 |
| `test_ExpireRedeem_BeforeExpiration` | 过期前不能赎回 |
| `test_FullFlow` | 完整生命周期测试 |
| `test_GetOptionInfo` | 视图函数测试 |

### 测试日志

```
➜  OptionsToken git:(main) forge test -vvv
[⠊] Compiling...
No files changed, compilation skipped

Ran 10 tests for test/CallOptionToken.t.sol:CallOptionTokenTest
[PASS] test_Exercise() (gas: 255868)
Logs:
  === Test: User Exercise ===
  User option balance before exercise: 5 tokens
  User ETH balance before exercise: 10 ETH
  User option balance after exercise: 3 tokens
  User ETH balance after exercise: 12 ETH
  USDT paid: 4000 USDT

[PASS] test_Exercise_AfterExpiration() (gas: 163444)
Logs:
  === Test: Cannot Exercise After Expiration Day ===

[PASS] test_Exercise_BeforeExpiration() (gas: 160643)
Logs:
  === Test: Cannot Exercise Before Expiration Day ===

[PASS] test_ExpireRedeem() (gas: 233448)
Logs:
  === Test: Issuer Expire Redeem ===
  After user exercise:
    Total ETH deposited: 8 ETH
    Total USDT received: 4000 USDT
    Issuer option balance: 5 tokens
  After expire redeem:
    Issuer ETH received: 18 ETH
    Issuer USDT received: 4000 USDT

[PASS] test_ExpireRedeem_BeforeExpiration() (gas: 98374)
Logs:
  === Test: Cannot Expire Redeem Before Expiration ===

[PASS] test_FullFlow() (gas: 297459)
Logs:
  === Test: Full Option Lifecycle ===
  Strike Price: 2000 USDT/ETH
  Expiration: 7 days from now
  
[Step 1] Issuer issues 50 ETH worth of options
  ------------------------------------------------
    Issuer deposited: 50 ETH
    Issuer received: 50 option tokens
    Contract ETH balance: 50 ETH
  
[Step 2] User buys 20 option tokens (simulating DEX trade)
  ------------------------------------------------------------
    Scenario: User pays ~100 USDT per option token
    (Much cheaper than strike price of 2000 USDT/ETH)
    User paid: 2000 USDT (premium)
    User received: 20 option tokens
    Issuer option balance: 30 tokens
    Issuer USDT received: 2000 USDT
  
[Step 3] Time passes... Expiration day arrives
  -----------------------------------------------
    Scenario: ETH price has risen to 2500 USDT!
    User's options are now 'in the money'
    Is expiration day: true
  
[Step 4] User exercises 15 option tokens
  -----------------------------------------
    User ETH before: 10 ETH
    User USDT before: 98000 USDT
    Exercising: 15 options
    USDT to pay: 30000 USDT
  
  After exercise:
    User ETH balance: 25 ETH
    User USDT balance: 68000 USDT
    User option tokens left: 5
  
  === Profit Calculation ===
    If current ETH price is 2500 USDT:
      ETH value received: 15 * 2500 = 37500 USDT
      Total cost: 2000 (premium) + 30000 (strike) = 32000 USDT
      Net profit: 5500 USDT!
  
[Step 5] After expiration - Issuer redeems remaining assets
  -------------------------------------------------------------
    Is expired: true
    Remaining ETH in contract: 35 ETH
    USDT received from exercises: 30000 USDT
  
  After redeem:
    Issuer ETH balance: 85 ETH
    Issuer USDT balance: 32000 USDT
    Remaining option supply: 5 tokens
  
=== Summary ===
  Issuer total received: 35 ETH + 32000 USDT
  User exercised 15 options, got 15 ETH, holds 5 expired tokens

[PASS] test_GetOptionInfo() (gas: 107503)
[PASS] test_Issue() (gas: 105656)
Logs:
  === Test: Issue Option Tokens ===
  Issuer option balance: 10 tokens
  Total ETH deposited: 10 ETH

[PASS] test_Issue_AfterExpiration() (gas: 28294)
Logs:
  === Test: Cannot Issue After Expiration ===

[PASS] test_Issue_OnlyIssuer() (gas: 23382)
Logs:
  === Test: Only Issuer Can Issue ===

Suite result: ok. 10 passed; 0 failed; 0 skipped; finished in 13.96ms (14.07ms CPU time)

Ran 2 tests for test/Counter.t.sol:CounterTest
[PASS] testFuzz_SetNumber(uint256) (runs: 256, μ: 28667, ~: 29289)
[PASS] test_Increment() (gas: 28783)
Suite result: ok. 2 passed; 0 failed; 0 skipped; finished in 19.65ms (11.40ms CPU time)

Ran 2 test suites in 255.29ms (33.61ms CPU time): 12 tests passed, 0 failed, 0 skipped (12 total tests)
```

## 📄 License

MIT

