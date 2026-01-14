# DAO Bank

基于 OpenZeppelin Governor 的 DAO 管理银行系统。代币持有者可以通过投票提案来管理银行资金的提取。

## 📁 项目结构

```
src/
├── GovToken.sol      # ERC20Votes 治理代币
├── Bank.sol          # 银行合约 (仅管理员可提款)
└── BankGovernor.sol  # Governor 合约 (提案/投票/执行)
```

## ⚙️ Governor 配置

| 参数 | 值 | 说明 |
|------|---|------|
| Voting Delay | 1 block | 提案创建后等待时间 |
| Voting Period | 50,400 blocks | 投票持续时间 (~1 周) |
| Quorum | 4% | 最低参与率 |
| Proposal Threshold | 0 | 任何人都可提案 |

### 配置方式

通过 `GovernorSettings` 扩展在构造函数中设置：

```solidity
GovernorSettings(
    1,      // votingDelay: 投票延迟 1 block
    50400,  // votingPeriod: 投票期限 50,400 blocks (~1 周)
    0       // proposalThreshold: 提案门槛 0 代币
)
```

### 时间计算

以 12 秒/block 为例：

| 目标时间 | 计算公式 | blocks |
|----------|----------|--------|
| 10 分钟 | 600s ÷ 12s | 50 |
| 1 小时 | 3600s ÷ 12s | 300 |
| 1 天 | 86400s ÷ 12s | 7,200 |
| 1 周 | 604800s ÷ 12s | 50,400 |

### 时间线示意

```
创建提案          投票开始              投票结束
   |                |                    |
   |-- 1 block ---->|--- 50,400 blocks ->|
   |   (votingDelay)|   (votingPeriod)   |
   |                |                    |
 Pending          Active             Succeeded/Defeated
```

## 🔄 提案生命周期

```
1. propose()  →  Pending
2. [等待 1 block]  →  Active
3. castVote()  →  投票中
4. [等待 50,400 blocks]  →  Succeeded/Defeated
5. execute()  →  Executed
```

## 🧪 测试日志

```bash
➜  DaoBank git:(main) forge test -vvv
[⠊] Compiling...
No files changed, compilation skipped

Ran 7 tests for test/DaoBank.t.sol:DaoBankTest
[PASS] test_BankDeposit() (gas: 23961)
[PASS] test_BankReceiveETH() (gas: 23498)
[PASS] test_BankWithdrawByGovernor() (gas: 55801)
[PASS] test_BankWithdrawOnlyAdmin() (gas: 16751)
[PASS] test_GovernorSettings() (gas: 16051)
[PASS] test_ProposalDefeated() (gas: 312016)
[PASS] test_ProposalLifecycle() (gas: 460782)
Logs:
  === DAO Bank Proposal Lifecycle Test ===
  
  Step 1: Creating proposal...
    - Withdraw amount: 5000000000000000000
    - Recipient: 0x006217c47ffA5Eb3F3c92247ffFE22AD998242c5
    - Proposal ID: 1666499474038357532009377763834646886152701363814623466647609998075117013054
    - State: Pending
  
  Step 2: Advancing past voting delay...
    - State: Active
  
  Step 3: Casting votes...
    - Alice voted: For (400,000 GOV)
    - Bob voted: Against (100,000 GOV)
    - Deployer voted: For (500,000 GOV)
  
    Vote Tally:
      For: 900000000000000000000000
      Against: 100000000000000000000000
      Abstain: 0
  
  Step 4: Advancing past voting period...
    - State: Succeeded
  
  Step 5: Executing proposal...
    - Bank balance before: 10000000000000000000
    - Recipient balance before: 0
    - Bank balance after: 5000000000000000000
    - Recipient balance after: 5000000000000000000
    - State: Executed
  
  === Proposal Lifecycle Complete ===
  Successfully withdrew 5000000000000000000 wei via DAO vote!

Suite result: ok. 7 passed; 0 failed; 0 skipped; finished in 12.67ms (11.26ms CPU time)

Ran 1 test suite in 252.59ms (12.67ms CPU time): 7 tests passed, 0 failed, 0 skipped (7 total tests)
```

## 📖 OpenZeppelin Governor 接口详解

本项目使用 OpenZeppelin Governor 合约库，以下是涉及的核心接口说明：

### 继承结构

```
BankGovernor
├── Governor                      # 核心治理逻辑
├── GovernorSettings              # 配置 votingDelay, votingPeriod, proposalThreshold
├── GovernorCountingSimple        # 简单计票 (For/Against/Abstain)
├── GovernorVotes                 # 使用 ERC20Votes 获取投票权
└── GovernorVotesQuorumFraction   # 基于百分比的法定人数
```

---

### IGovernor 接口 (核心)

#### 提案状态 `ProposalState`

```solidity
enum ProposalState {
    Pending,    // 0: 等待投票延迟
    Active,     // 1: 投票进行中
    Canceled,   // 2: 已取消
    Defeated,   // 3: 投票未通过
    Succeeded,  // 4: 投票通过
    Queued,     // 5: 在时间锁队列中
    Expired,    // 6: 已过期
    Executed    // 7: 已执行
}
```

#### 核心函数

| 函数 | 说明 |
|------|------|
| `propose(targets, values, calldatas, description)` | 创建提案，返回 proposalId |
| `castVote(proposalId, support)` | 投票：0=反对, 1=支持, 2=弃权 |
| `castVoteWithReason(proposalId, support, reason)` | 带理由投票 |
| `execute(targets, values, calldatas, descriptionHash)` | 执行已通过的提案 |
| `cancel(targets, values, calldatas, descriptionHash)` | 取消提案 (仅提案者) |
| `state(proposalId)` | 查询提案状态 |
| `proposalVotes(proposalId)` | 获取票数统计 (against, for, abstain) |

#### 配置查询

| 函数 | 说明 |
|------|------|
| `votingDelay()` | 提案创建到投票开始的区块数 |
| `votingPeriod()` | 投票持续的区块数 |
| `proposalThreshold()` | 创建提案所需的最低投票权 |
| `quorum(blockNumber)` | 指定区块的法定人数 |

---

### ERC20Votes 接口 (投票权)

GovToken 继承自 ERC20Votes，提供投票权功能：

| 函数 | 说明 |
|------|------|
| `delegate(delegatee)` | 将投票权委托给其他地址 |
| `delegates(account)` | 查询委托对象 |
| `getVotes(account)` | 获取当前投票权 |
| `getPastVotes(account, blockNumber)` | 获取历史投票权 |

> ⚠️ **重要**: 代币持有者必须调用 `delegate(self)` 将投票权委托给自己，否则无法投票！

---

### GovernorCountingSimple

简单计票模块，提供三种投票选项：

```solidity
enum VoteType {
    Against,  // 0: 反对
    For,      // 1: 支持
    Abstain   // 2: 弃权
}
```

| 函数 | 说明 |
|------|------|
| `hasVoted(proposalId, account)` | 检查是否已投票 |
| `proposalVotes(proposalId)` | 返回 (againstVotes, forVotes, abstainVotes) |

---

### 使用示例

#### 1. 委托投票权 (必需)

```solidity
// 用户必须先委托投票权给自己
govToken.delegate(msg.sender);
```

#### 2. 创建提案

```solidity
// 调用 Bank.withdraw(recipient, 5 ether)
address[] memory targets = new address[](1);
targets[0] = address(bank);

uint256[] memory values = new uint256[](1);
values[0] = 0;

bytes[] memory calldatas = new bytes[](1);
calldatas[0] = abi.encodeWithSelector(Bank.withdraw.selector, recipient, 5 ether);

string memory description = "Proposal #1: Withdraw 5 ETH";

uint256 proposalId = governor.propose(targets, values, calldatas, description);
```

#### 3. 投票

```solidity
// 等待 votingDelay 后
governor.castVote(proposalId, 1); // 1 = 支持
```

#### 4. 执行

```solidity
// 等待 votingPeriod 结束且投票通过后
bytes32 descriptionHash = keccak256(bytes(description));
governor.execute(targets, values, calldatas, descriptionHash);
```

---

## 📖 Bank 合约接口

| 函数 | 修饰符 | 说明 |
|------|--------|------|
| `deposit()` | payable | 存入 ETH |
| `withdraw(to, amount)` | onlyAdmin | 提取 ETH 到指定地址 |
| `setAdmin(newAdmin)` | onlyAdmin | 更换管理员地址 |
| `receive()` | payable | 接收 ETH 转账 |

---

## 📚 依赖

- [OpenZeppelin Contracts v5.5.0](https://github.com/OpenZeppelin/openzeppelin-contracts)
  - `Governor.sol` - 核心治理合约
  - `GovernorSettings.sol` - 治理参数配置
  - `GovernorCountingSimple.sol` - 简单计票
  - `GovernorVotes.sol` - ERC20Votes 投票权集成
  - `GovernorVotesQuorumFraction.sol` - 百分比法定人数
  - `ERC20.sol` / `ERC20Votes.sol` / `ERC20Permit.sol` - 投票代币
- [Forge Std](https://github.com/foundry-rs/forge-std)
