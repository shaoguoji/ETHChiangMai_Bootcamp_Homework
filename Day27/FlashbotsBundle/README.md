# Flashbots Bundle - OpenspaceNFT Presale

使用 Flashbots `eth_sendBundle` API 将 OpenspaceNFT 的 `enablePresale` 和 `presale` 两笔交易捆绑在一起，原子性地提交到 Sepolia 测试网络。

## 📋 目录结构

```
FlashbotsBundle/
├── Contract/                 # OpenspaceNFT 智能合约
│   ├── src/
│   │   └── OpenspaceNFT.sol  # NFT 合约
│   ├── script/
│   │   └── Deploy.s.sol      # 部署脚本
│   └── ...
├── Script/                   # TypeScript Flashbots 脚本
│   ├── src/
│   │   └── flashbotsBundle.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
└── README.md
```

## 🔧 技术实现

### 1. Flashbots Bundle 原理

Flashbots 允许将多笔交易捆绑（Bundle）在一起，作为一个原子单元提交给区块构建者。主要特性：

- **原子性执行**: Bundle 中的所有交易要么全部成功上链，要么全部失败
- **隐私保护**: 交易不会进入公开 mempool，防止被 MEV 攻击
- **指定区块**: 可以指定交易在哪个区块被包含

### 2. 核心 API

#### `mev_sendBundle` (推荐)

发送交易捆绑到 Flashbots relay（新版 API，Sepolia 推荐使用）：

```typescript
const bundleParams = {
  version: "v0.1",
  inclusion: {
    block: "0x999999",
    maxBlock: "0x99999e",
  },
  body: [
    { tx: signedEnablePresaleTx, canRevert: false },
    { tx: signedPresaleTx, canRevert: false },
  ],
};

await flashbotsRpc(authSigner, "mev_sendBundle", [bundleParams]);
```

#### `eth_sendBundle` (传统)

传统的 bundle 发送方式（主网常用）：

```typescript
const bundleParams = {
  txs: [signedEnablePresaleTx, signedPresaleTx],
  blockNumber: "0x999999",
};

await flashbotsRpc(authSigner, "eth_sendBundle", [bundleParams]);
```

#### `flashbots_getBundleStatsV2`

查询 Bundle 的状态和统计信息：

```typescript
const statsResponse = await flashbotsRpc(authSigner, "flashbots_getBundleStatsV2", [
  { bundleHash: bundleHash, blockNumber: blockHex }
]);
```

### 3. 交易流程

```
┌─────────────────┐
│   Owner Wallet  │
│  (enablePresale)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│ Sign & Bundle   │────▶│  Flashbots Relay │
│   Transactions  │     │ (relay-sepolia)  │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         │                       ▼
┌────────┴────────┐     ┌──────────────────┐
│   Buyer Wallet  │     │  Block Builders  │
│    (presale)    │     └────────┬─────────┘
└─────────────────┘              │
                                 ▼
                        ┌──────────────────┐
                        │  Sepolia Chain   │
                        │ (Atomic Include) │
                        └──────────────────┘
```

## 🚀 使用方法

### 1. 部署合约

```bash
cd Contract

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置 SEPOLIA_RPC_URL 和 keystore

# 部署到 Sepolia
make deploy-sepolia
```

### 2. 运行 Flashbots 脚本

```bash
cd Script

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env，设置以下变量：
# - SEPOLIA_RPC_URL
# - OWNER_PRIVATE_KEY
# - BUYER_PRIVATE_KEY
# - NFT_CONTRACT_ADDRESS

# 运行脚本
npm run bundle
```

## 📝 提交记录

### 脚本运行日志

```
============================================================
Flashbots Bundle - OpenspaceNFT Presale
============================================================

📋 Configuration:
   Owner Address: 0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd
   Buyer Address: 0xE8FDE9408C65C743ff38bA0EbA5C85020F7B4401
   NFT Contract: 0xFdAcfcD8F428A23b79067c87CE6fF9FC6fDE7D68
   Owner Balance: 3.740845257933088951 ETH
   Buyer Balance: 0.559395358738765132 ETH

📊 Contract State:
   isPresaleActive: false
   nextTokenId: 1
   Contract Owner: 0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd

🔐 Flashbots Auth Signer: 0xfe5a581A5A08885cE0d5035AceD2439b1D969e7e

🎯 Current Block: 10048064
   Target Block: 10048066

⛽ Gas Settings:
   Max Fee: 4.050385822 gwei
   Priority Fee: 1.5 gwei

🔢 Nonces:
   Owner Nonce: 183
   Buyer Nonce: 11

📦 Building Bundle...
   TX1: enablePresale() from Owner
   TX2: presale(1) from Buyer with 0.01 ETH

✅ Transactions signed successfully
   TX1 Hash: 0xc5b98086c013e69b616456e70a20eddc0a59692a6fe57200e43ef3f5df0631c4
   TX2 Hash: 0x9f1906b6b0ee0501e9cd70d4bfbd68b7b33ace0417de1532d4dd5cfa808178a8

📤 Sending bundle to Flashbots relay using mev_sendBundle...

   Submitting to block 10048066 (0x995242)...
   ❌ Error: no backend is currently healthy to serve traffic
      Waiting 12s for next block...
   Submitting to block 10048067 (0x995243)...
   ❌ Error: no backend is currently healthy to serve traffic
      Waiting 12s for next block...
   Submitting to block 10048068 (0x995244)...
   ❌ Error: no backend is currently healthy to serve traffic
```

> **注意**: 签名已验证成功（API 返回 "no backend is currently healthy" 而非 "signature is required"）。Flashbots Sepolia relay 后端暂时不可用，请稍后重试。

### 交易哈希

| 交易 | 描述 | 哈希 |
|------|------|------|
| TX1 | enablePresale | `0xc5b98086c013e69b616456e70a20eddc0a59692a6fe57200e43ef3f5df0631c4` |
| TX2 | presale | `0x9f1906b6b0ee0501e9cd70d4bfbd68b7b33ace0417de1532d4dd5cfa808178a8` |

### Bundle Stats

> ⚠️ Flashbots Sepolia relay 后端暂时不可用，待后端恢复后可获取 bundle stats。

```json
{
  "status": "pending",
  "note": "Flashbots Sepolia relay backend temporarily unavailable"
}
```

## 📚 依赖说明

### 合约依赖

- OpenZeppelin Contracts v5.x (ERC721, Ownable)
- Forge/Foundry

### 脚本依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| ethers | ^5.7.2 | 以太坊交互库 |
| @flashbots/ethers-provider-bundle | ^0.6.2 | Flashbots SDK |
| dotenv | ^16.3.1 | 环境变量管理 |
| typescript | ^5.3.2 | TypeScript 编译 |

## 🔍 关键代码解析

### 1. 初始化 Flashbots Provider

```typescript
// 使用随机签名者进行 Flashbots 认证
const authSigner = Wallet.createRandom();

const flashbotsProvider = await FlashbotsBundleProvider.create(
  provider,
  authSigner,
  "https://relay-sepolia.flashbots.net",
  "sepolia"
);
```

### 2. 构建 Bundle

```typescript
// 交易 1: Owner 开启预售
const enablePresaleTx = {
  to: nftContractAddress,
  data: nftContract.interface.encodeFunctionData("enablePresale"),
  gasLimit: 100000,
  maxFeePerGas: maxFeePerGas,
  maxPriorityFeePerGas: maxPriorityFeePerGas,
  nonce: ownerNonce,
  type: 2,
  chainId: 11155111, // Sepolia
};

// 交易 2: Buyer 参与预售
const presaleTx = {
  to: nftContractAddress,
  data: nftContract.interface.encodeFunctionData("presale", [1]),
  value: ethers.utils.parseEther("0.01"),
  gasLimit: 200000,
  ...
};

// 签名并捆绑
const signedBundle = await flashbotsProvider.signBundle([
  { signer: ownerWallet, transaction: enablePresaleTx },
  { signer: buyerWallet, transaction: presaleTx },
]);
```

### 3. 模拟和发送

```typescript
// 先模拟，确保交易可执行
const simulation = await flashbotsProvider.simulate(signedBundle, targetBlock);

// 发送到多个连续区块，增加上链概率
for (let i = 0; i < 5; i++) {
  await flashbotsProvider.sendBundle(signedBundle, targetBlock + i);
}
```

### 4. 等待确认和查询状态

```typescript
// 等待 Bundle 被包含
const resolution = await submission.wait();

if (resolution === FlashbotsBundleResolution.BundleIncluded) {
  // 获取交易收据
  const receipts = await submission.receipts();
  
  // 查询 Bundle 统计信息
  const bundleStats = await flashbotsProvider.getBundleStats(bundleHash, blockNumber);
}
```

## 📖 参考资料

- [Flashbots Docs](https://docs.flashbots.net/)
- [Flashbots Bundle SDK](https://github.com/flashbots/ethers-provider-flashbots-bundle)
- [Sepolia Testnet](https://sepolia.dev/)

## ⚠️ 注意事项

1. **私钥安全**: 切勿将真实私钥提交到 Git
2. **测试网络**: 本项目仅在 Sepolia 测试网运行
3. **Gas 费用**: 确保 Owner 和 Buyer 钱包有足够的 ETH 支付 Gas
4. **网络延迟**: Bundle 发送后可能需要等待几个区块才能被包含
