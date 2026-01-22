# Foundry DeFi Project - CCIP Bridge Module

基于 Foundry 的 Chainlink CCIP 跨链桥项目，实现 Sepolia ↔ Base Sepolia 双向跨链。

## 📋 目录

- [技术栈](#技术栈)
- [CCIP Bridge 模块](#ccip-bridge-模块)
- [快速开始](#快速开始)
- [部署指南](#部署指南)
- [验证和测试](#验证和测试)
- [自定义指南](#自定义指南)
- [故障排除](#故障排除)

## 🛠 技术栈

- **Foundry** - 以太坊开发工具链
- **Solidity 0.8.24** - 智能合约语言
- **Chainlink CCIP** - 跨链互操作协议
- **OpenZeppelin** - 安全合约库

### Chainlink 依赖

- `@chainlink/contracts@1.4.0` - Chainlink 核心合约
- `@chainlink/contracts-ccip@1.6.0` - CCIP 协议合约

## 🌉 CCIP Bridge 模块

### 概述

使用 **Chainlink CCIP** (Cross-Chain Interoperability Protocol) 实现 **Sepolia ↔ Base Sepolia** 双向跨链，采用 **Burn-Mint Token 模型**。

### 核心机制

**Burn-Mint 模型**:
- **源链**: Burn (销毁) CCT Token
- **目标链**: Mint (铸造) CCT Token
- **总供应量**: 保持恒定（burn 和 mint 数量相等）

### 已部署合约

#### Sepolia 测试网

| 合约类型 | 地址 |
|---------|------|
| CrossChainToken (CCT) | `0xDC1D17004a2A724d5aa9f6B428C56814aBD156D9` |
| BurnMintTokenPool | `0x7EbB65FC69F94Cf11f754B102950edab38343536` |
| CCIP Router | `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59` |
| Token Admin Registry | `0x95F29FEE11c5C55d26cCcf1DB6772DE953B37B82` |
| Chain Selector | `16015286601757825753` |

#### Base Sepolia 测试网

| 合约类型 | 地址 |
|---------|------|
| CrossChainToken (CCT) | `0x431306040c181E768C4301a7bfD4fC6a770E833F` |
| BurnMintTokenPool | `0x27BCD1de1BDd9a40814e2d4BdC500C52c76938e7` |
| CCIP Router | `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93` |
| Token Admin Registry | `0x6554c6fbd1c8f5b163a64183de8b9c1bd8e69016` |
| Chain Selector | `10344971235874465080` |

### 成功验证

**跨链测试结果** (2024-12-02):
```
源链 (Sepolia):   999.9 CCT (0.1 CCT burned) ✓
目标链 (Base):    0.1 CCT (minted)           ✓
Message ID:       0x12158e8a873e0666f1f37ccd5050562213398e4deb7c7ab9b9fe912364014902 ✓
跨链时间:         ~10 minutes                ✓
CCIP Explorer:    https://ccip.chain.link/msg/0x12158... ✓
```

## 🚀 快速开始

### 前置要求

- **Foundry** - 安装: `curl -L https://foundry.paradigm.xyz | bash && foundryup`
- **Node.js 18+** - 用于 npm 包管理
- **钱包私钥** - 用于部署和交互
- **测试网 ETH** - Sepolia 和 Base Sepolia 测试币

### 安装

```bash
# 克隆项目
git clone <your-repo-url>
cd foundry-demo

# 安装 Foundry 依赖
forge install

# 安装 Chainlink npm 包
npm install @chainlink/contracts@1.4.0 @chainlink/contracts-ccip@1.6.0

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的私钥和 RPC URLs
```

### 环境变量配置

创建 `.env` 文件:

```bash
# 私钥 (不要提交到 Git!)
PRIVATE_KEY=your_private_key_here

# RPC URLs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Etherscan API Keys (用于验证合约)
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

## 📖 部署指南

### 完整部署流程 (10 步)

#### 步骤 1: 部署 Sepolia Token

```bash
forge script script/ccip/DeployToken.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

**输出**: `0xDC1D17004a2A724d5aa9f6B428C56814aBD156D9`

---

#### 步骤 2: 部署 Base Sepolia Token

```bash
forge script script/ccip/DeployToken.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

**输出**: `0x431306040c181E768C4301a7bfD4fC6a770E833F`

---

#### 步骤 3: 部署 Sepolia TokenPool

```bash
forge script script/ccip/DeployBurnMintTokenPool.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

**输出**: `0x7EbB65FC69F94Cf11f754B102950edab38343536`

---

#### 步骤 4: 部署 Base Sepolia TokenPool

```bash
forge script script/ccip/DeployBurnMintTokenPool.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

**输出**: `0x27BCD1de1BDd9a40814e2d4BdC500C52c76938e7`

---

#### 步骤 5-6: Claim Admin (两条链)

```bash
# Sepolia
forge script script/ccip/ClaimAdmin.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Base Sepolia
forge script script/ccip/ClaimAdmin.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

#### 步骤 7-8: Accept Admin Role (两条链)

```bash
# Sepolia
forge script script/ccip/AcceptAdminRole.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Base Sepolia
forge script script/ccip/AcceptAdminRole.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

#### 步骤 9: Set Pool (两条链)

```bash
# Sepolia
forge script script/ccip/SetPool.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Base Sepolia
forge script script/ccip/SetPool.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

#### 步骤 10: Apply Chain Updates (配置跨链路由)

```bash
# Sepolia (配置到 Base Sepolia 的路由)
forge script script/ccip/ApplyChainUpdates.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast

# Base Sepolia (配置到 Sepolia 的路由)
forge script script/ccip/ApplyChainUpdates.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

---

### 配置文件

**`script/ccip/config.json`**:
```json
{
  "sourceTokenAdmin": "0x0b332c99Fd6511Ca9FAf9654DfcF18C575941094",
  "networks": {
    "11155111": {
      "crossChainMap": {
        "84532": {
          "remoteToken": "0x431306040c181E768C4301a7bfD4fC6a770E833F",
          "remotePool": "0x27BCD1de1BDd9a40814e2d4BdC500C52c76938e7",
          "outboundRateLimiterEnabled": false,
          "inboundRateLimiterEnabled": false
        }
      }
    },
    "84532": {
      "crossChainMap": {
        "11155111": {
          "remoteToken": "0xDC1D17004a2A724d5aa9f6B428C56814aBD156D9",
          "remotePool": "0x7EbB65FC69F94Cf11f754B102950edab38343536",
          "outboundRateLimiterEnabled": false,
          "inboundRateLimiterEnabled": false
        }
      }
    }
  }
}
```

## 🧪 验证和测试

### 铸造测试代币

```bash
forge script script/ccip/MintTokens.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

铸造 1000 CCT 到部署者地址。

---

### 执行跨链转账

```bash
forge script script/ccip/TransferTokens.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

从 Sepolia 跨 0.1 CCT 到 Base Sepolia。

---

### 查询余额

```bash
# Sepolia 余额
cast call 0xDC1D17004a2A724d5aa9f6B428C56814aBD156D9 \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url $SEPOLIA_RPC_URL

# Base Sepolia 余额
cast call 0x431306040c181E768C4301a7bfD4fC6a770E833F \
  "balanceOf(address)(uint256)" \
  YOUR_ADDRESS \
  --rpc-url $BASE_SEPOLIA_RPC_URL
```

---

### 后台监控脚本

```bash
# 自动监控跨链完成状态
bash script/ccip/CheckCrossChainStatus.sh
```

每 30 秒检查一次 Base Sepolia 余额，最多 20 分钟。

---

### 在 CCIP Explorer 追踪

访问: https://ccip.chain.link/msg/YOUR_MESSAGE_ID

实时查看跨链状态。

## 🔧 自定义指南

### 修改 Token 名称和符号

**文件**: `script/ccip/DeployToken.s.sol`

```solidity
BurnMintERC677 token = new BurnMintERC677(
    "My Custom Token",  // 修改名称
    "MCT",             // 修改符号
    18,                // decimals
    0                  // maxSupply (0 = unlimited)
);
```

---

### 修改初始铸造数量

**文件**: `script/ccip/MintTokens.s.sol`

```solidity
uint256 amountToMint = 10000 * 1e18; // 改为 10000 个代币
```

---

### 修改跨链转账金额

**文件**: `script/ccip/TransferTokens.s.sol`

```solidity
uint256 amount = 1 * 1e18; // 改为 1 个代币
```

---

### 添加新的支持链

1. **更新 `script/ccip/HelperConfig.s.sol`** 添加新链配置
2. **在新链上部署 Token 和 TokenPool**
3. **更新 `config.json`** 添加跨链映射
4. **执行 ClaimAdmin, AcceptAdminRole, SetPool, ApplyChainUpdates**

**示例 - 添加 Arbitrum Sepolia**:

```solidity
// HelperConfig.s.sol
function getArbitrumSepoliaConfig() public pure returns (NetworkConfig memory) {
    return NetworkConfig({
        chainSelector: 3478487238524512106,
        router: 0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165,
        rmnProxy: 0xba3f6251de62dED61Ff98590cB2fDf6871FbB991,
        tokenAdminRegistry: 0x...,
        registryModuleOwnerCustom: 0x...,
        link: 0x...,
        confirmations: 2,
        nativeCurrencySymbol: "ETH"
    });
}
```

---

### 启用 Rate Limiter

**文件**: `script/ccip/config.json`

```json
{
  "crossChainMap": {
    "84532": {
      "outboundRateLimiterEnabled": true,
      "outboundRateLimiterCapacity": "1000000000000000000",  // 1 token
      "outboundRateLimiterRate": "100000000000000000",      // 0.1 token/sec
      "inboundRateLimiterEnabled": true,
      "inboundRateLimiterCapacity": "1000000000000000000",
      "inboundRateLimiterRate": "100000000000000000"
    }
  }
}
```

## 💰 Gas 费用估算

| 操作 | Gas (Sepolia) | Gas (Base Sepolia) | 费用 (Gwei=50) |
|------|---------------|-------------------|----------------|
| Deploy Token | ~1,500,000 | ~1,500,000 | ~0.075 ETH |
| Deploy TokenPool | ~3,000,000 | ~3,000,000 | ~0.15 ETH |
| ClaimAdmin | ~100,000 | ~100,000 | ~0.005 ETH |
| AcceptAdminRole | ~50,000 | ~50,000 | ~0.0025 ETH |
| SetPool | ~100,000 | ~100,000 | ~0.005 ETH |
| ApplyChainUpdates | ~200,000 | ~200,000 | ~0.01 ETH |
| Mint Tokens | ~50,000 | - | ~0.0025 ETH |
| Cross-Chain Transfer | ~150,000 | - | ~0.0075 ETH |
| **CCIP Fee** | - | - | **~0.0002 ETH** |

**总计**: 约 0.26 ETH (部署) + 0.01 ETH (每次跨链)

## 🐛 故障排除

### 问题 1: npm 包导入失败

**错误**: `Could not find @chainlink/contracts-ccip/...`

**解决方案**:
```bash
# 重新安装正确版本
npm install @chainlink/contracts@1.4.0 @chainlink/contracts-ccip@1.6.0

# 检查 foundry.toml 的 remappings
[profile.default]
remappings = [
    "@chainlink/contracts-ccip/=node_modules/@chainlink/contracts-ccip/contracts/",
    "@chainlink/contracts/=node_modules/@chainlink/contracts/",
]
```

---

### 问题 2: Base Sepolia RPC 401 错误

**错误**: `HTTP 401` 使用 Infura URL

**解决方案**:
```bash
# 使用公共 RPC
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

---

### 问题 3: 跨链卡住未完成

**可能原因**:
- CCIP 网络拥堵
- 目标链 RPC 问题
- Gas 费用不足

**解决方案**:
1. 访问 CCIP Explorer 查看 Message ID 状态
2. 等待 15-20 分钟后再检查
3. 检查 https://status.chain.link/ 确认服务正常

---

### 问题 4: Revert - "Unauthorized"

**原因**: Admin 权限未正确配置

**解决方案**:
```bash
# 检查 Token Admin
cast call TOKEN_ADDRESS "getCCIPAdmin()(address)" --rpc-url $RPC_URL

# 重新执行 ClaimAdmin 和 AcceptAdminRole
forge script script/ccip/ClaimAdmin.s.sol --rpc-url $RPC_URL --broadcast
forge script script/ccip/AcceptAdminRole.s.sol --rpc-url $RPC_URL --broadcast
```

---

### 问题 5: TokenPool 地址错误

**错误**: `InvalidPool()` 或 `PoolDoesNotExist()`

**解决方案**:
```bash
# 验证 TokenPool 是否正确设置
cast call TOKEN_ADDRESS "getPool()(address)" --rpc-url $RPC_URL

# 重新设置 Pool
forge script script/ccip/SetPool.s.sol --rpc-url $RPC_URL --broadcast
```

## 📚 参考资源

- **Chainlink CCIP 官方文档**: https://docs.chain.link/ccip
- **CCIP Explorer**: https://ccip.chain.link/
- **支持的网络列表**: https://docs.chain.link/ccip/supported-networks
- **Burn-Mint Token 教程**: https://docs.chain.link/ccip/tutorials/cross-chain-tokens
- **Token Admin Registry**: https://docs.chain.link/ccip/architecture#tokenadminregistry
- **Foundry Book**: https://book.getfoundry.sh/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Base Sepolia Faucet**: https://docs.base.org/tools/network-faucets/

## 📄 许可证

MIT License - 免费用于教育目的。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🙏 致谢

- Chainlink Labs - CCIP 协议
- Foundry 团队 - 开发工具
- OpenZeppelin - 合约库
