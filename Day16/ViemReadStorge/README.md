# Viem Read Storage Demo

本项目演示了如何使用 [Viem](https://viem.sh/) 直接读取 Solidity 合约中的 `private` 状态变量（Storage）。 specifically targeting a dynamic array of structs.

## 运行结果示例

```sh
➜  Backend git:(main) ✗ npx ts-node read_locks.ts 
Reading storage from contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Array length: 11
locks[0]: user:0x0000000000000000000000000000000000000001 ,startTime:3534161450,amount:1000000000000000000
locks[1]: user:0x0000000000000000000000000000000000000002 ,startTime:3534161449,amount:2000000000000000000
locks[2]: user:0x0000000000000000000000000000000000000003 ,startTime:3534161448,amount:3000000000000000000
locks[3]: user:0x0000000000000000000000000000000000000004 ,startTime:3534161447,amount:4000000000000000000
locks[4]: user:0x0000000000000000000000000000000000000005 ,startTime:3534161446,amount:5000000000000000000
locks[5]: user:0x0000000000000000000000000000000000000006 ,startTime:3534161445,amount:6000000000000000000
locks[6]: user:0x0000000000000000000000000000000000000007 ,startTime:3534161444,amount:7000000000000000000
locks[7]: user:0x0000000000000000000000000000000000000008 ,startTime:3534161443,amount:8000000000000000000
locks[8]: user:0x0000000000000000000000000000000000000009 ,startTime:3534161442,amount:9000000000000000000
locks[9]: user:0x000000000000000000000000000000000000000a ,startTime:3534161441,amount:10000000000000000000
locks[10]: user:0x000000000000000000000000000000000000000b ,startTime:3534161440,amount:11000000000000000000
```

## 1. 环境准备 (Prerequisites)

Ensure you have the following installed:
- **Foundry**: 用于启动本地测试链 Anvil 和部署合约。
- **Node.js**: 用于运行 TypeScript 脚本。

## 2. 项目结构 (Project Structure)

- **Contract**: Foundry 项目，包含 `esRNT.sol` 合约及其部署脚本。
- **Backend**: TypeScript 项目，包含使用 Viem 读取存储的脚本 `read_locks.ts`。

## 3. 快速开始 (Getting Started)

### 步骤 1: 启动本地测试链
在项目根目录下运行 Anvil：
```bash
anvil
```

### 步骤 2: 部署合约
打开一个新的终端窗口，进入 `Contract` 目录并部署合约到本地网络：
```bash
cd Contract
make deploy local
```
*记录下部署成功的合约地址 (Output中的 `esRNT deployed to: ...`)，确认与 `Backend/read_locks.ts` 中的 `CONTRACT_ADDRESS` 一致 (默认为 `0x5FbDB2315678afecb367f032d93F642f64180aa3`)。*

### 步骤 3: 运行读取脚本
进入 `Backend` 目录，安装依赖并运行脚本：
```bash
cd Backend
npm install
npx ts-node read_locks.ts
```

## 4. 存储读取原理 (Storage Layout & Reading Logic)

Soldity 合约中的状态变量按照特定的规则存储在 32 字节（256位）的 Storage Slot 中。虽然变量声明为 `private`，但通过 RPC 节点的 `eth_getStorageAt` 方法依然可以读取原始数据。

### 合约数据结构
`esRNT.sol` 中定义了一个结构体数组：
```solidity
struct LockInfo {
    address user;       // 160 bits (20 bytes)
    uint64 startTime;   // 64 bits  (8 bytes)
    uint256 amount;     // 256 bits (32 bytes)
}
LockInfo[] private _locks;
```

### Storage Layout 分析

1.  **动态数组 (Dynamic Array)**
    *   `_locks` 定义在 Slot 0。
    *   **Slot 0** 存储数组的长度 (Length)。
    *   数组元素的起始存储位置为 `keccak256(0)`。

2.  **结构体紧凑打包 (Struct Packing)**
    `LockInfo` 结构体会尝试紧凑存储：
    *   `user` (20 bytes) 和 `startTime` (8 bytes) 加起来 28 bytes < 32 bytes，因此它们会被打包在其同一个 Slot 中。
    *   `amount` (32 bytes) 需要一个完整的 Slot。

    **因此，每个数组元素占用 2 个 Slot：**

    | Offset | Slot Content Detail | Decoded Variable |
    | :--- | :--- | :--- |
    | **Slot N** | `[padding 4B][startTime 8B][user 20B]` | `user`, `startTime` |
    | **Slot N+1** | `[amount 32B]` | `amount` |

    *注意：Solidity 存储是从低位（右侧）开始填充的。*

### 脚本实现逻辑 (`read_locks.ts`)

1.  **读取数组长度**:
    ```typescript
    const length = await client.getStorageAt({ slot: 0 });
    ```
2.  **计算元素基准位置**:
    ```typescript
    const baseSlot = keccak256(encodePacked(['uint256'], [0n]));
    ```
3.  **遍历并解析元素**:
    对于第 `i` 个元素：
    *   **读取 Slot A** (`baseSlot + i*2`):
        *   这里包含了 packed 的数据。
        *   通过位运算提取 `user`: `value & ((1 << 160) - 1)`
        *   通过位移提取 `startTime`: `value >> 160`
    *   **读取 Slot B** (`baseSlot + i*2 + 1`):
        *   直接转换为 BigInt 得到 `amount`。
