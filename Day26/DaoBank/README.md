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

## 📖 核心函数

### Bank.sol
- `deposit()` - 存入 ETH
- `withdraw(to, amount)` - 提取 ETH (仅管理员)
- `setAdmin(newAdmin)` - 更换管理员 (仅管理员)

### BankGovernor.sol
- `propose(targets, values, calldatas, description)` - 创建提案
- `castVote(proposalId, support)` - 投票 (0=反对, 1=支持, 2=弃权)
- `execute(targets, values, calldatas, descriptionHash)` - 执行提案

## 📚 依赖

- [OpenZeppelin Contracts v5.5.0](https://github.com/OpenZeppelin/openzeppelin-contracts)
- [Forge Std](https://github.com/foundry-rs/forge-std)
