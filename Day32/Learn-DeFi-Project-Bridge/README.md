# CCIP Bridge DApp - Chainlink 跨链桥前端

基于 Next.js 的 Chainlink CCIP 跨链桥 Web 应用，实现 Sepolia ↔ Base Sepolia 双向跨链。

## 📋 目录

- [技术栈](#技术栈)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [CCIP 集成指南](#ccip-集成指南)
- [自定义和替换](#自定义和替换)
- [故障排除](#故障排除)

## 🛠 技术栈

- **Next.js 15** - React 框架
- **wagmi v2** + **viem v2** - Web3 Hooks
- **RainbowKit** - 钱包连接
- **Tailwind CSS** - 样式框架
- **Chainlink CCIP** - 跨链协议

## ✨ 功能特性

- ✅ Sepolia ↔ Base Sepolia 双向跨链
- ✅ 实时余额查询（多链）
- ✅ ERC20 授权流程
- ✅ CCIP Message ID 追踪
- ✅ 自动网络切换
- ✅ Gas 费用估算

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 WalletConnect Project ID

# 运行开发服务器
npm run dev
# 访问 http://localhost:3000
```

## 🔧 环境配置

创建 `.env.local`:

```bash
# WalletConnect Project ID (必需)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# CCIP 合约地址（已部署）
NEXT_PUBLIC_CCIP_TOKEN_SEPOLIA=0xDC1D17004a2A724d5aa9f6B428C56814aBD156D9
NEXT_PUBLIC_CCIP_TOKEN_BASE_SEPOLIA=0x431306040c181E768C4301a7bfD4fC6a770E833F
NEXT_PUBLIC_CCIP_ROUTER_SEPOLIA=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
NEXT_PUBLIC_CCIP_ROUTER_BASE_SEPOLIA=0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93
NEXT_PUBLIC_CHAIN_SELECTOR_SEPOLIA=16015286601757825753
NEXT_PUBLIC_CHAIN_SELECTOR_BASE_SEPOLIA=10344971235874465080
```

获取 WalletConnect Project ID: https://cloud.walletconnect.com/

## 🌉 CCIP 集成指南

### 核心代码

**读取余额（多链）**:
```javascript
const { data: balance } = useReadContract({
  address: tokenAddress,
  abi: BurnMintERC20ABI,
  functionName: 'balanceOf',
  args: [userAddress],
  chainId: chainId,  // 指定链 ID
})
```

**授权代币**:
```javascript
await writeContract({
  address: tokenAddress,
  abi: BurnMintERC20ABI,
  functionName: 'approve',
  args: [routerAddress, amount]
})
```

**发起跨链**:
```javascript
const message = {
  receiver: encodePacked(['address'], [recipient]),
  data: '0x',
  tokenAmounts: [{ token: tokenAddress, amount: amount }],
  feeToken: '0x0000000000000000000000000000000000000000',
  extraArgs: CCIP_EXTRA_ARGS
}

await writeContract({
  address: routerAddress,
  abi: IRouterClientABI,
  functionName: 'ccipSend',
  args: [destinationChainSelector, message],
  value: estimatedFee
})
```

完整实现请查看 `/app/bridge/page.js`

## 🔄 自定义和替换

### 替换为自己的 Token

1. 在 Foundry 项目部署新 Token
2. 更新 `.env.local` 中的地址
3. （可选）修改页面中的代币符号

### 添加更多支持的链

1. 部署合约到新链
2. 更新 `SUPPORTED_CHAINS` 数组
3. 添加新的环境变量

### 替换为其他跨链协议

1. 部署 LayerZero/Wormhole 合约
2. 提取新的 ABI
3. 修改 Bridge 页面跨链逻辑

详细指南请查看项目 Wiki。

## 🐛 故障排除

**钱包无法连接**: 检查 WALLETCONNECT_PROJECT_ID 是否设置

**交易 revert**: 确认已授权且余额充足

**余额显示 0**: 检查 Token 地址和网络连接

**Message ID 无法追踪**: 等待 1-2 分钟后重试

## 📚 参考资源

- [Chainlink CCIP 文档](https://docs.chain.link/ccip)
- [CCIP Explorer](https://ccip.chain.link/)
- [wagmi 文档](https://wagmi.sh/)
- [Foundry 合约项目](../foundry-demo/)

## 📄 许可证

MIT License
