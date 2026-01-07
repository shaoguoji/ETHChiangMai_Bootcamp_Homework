# Uniswap V2 Local Development with Foundry

This project contains a complete local Uniswap V2 deployment using Foundry, including the core contracts, periphery contracts, and a patched frontend interface.

## 📋 Project Structure

```
Day21/
├── UniswapV2_foundry/          # Foundry project with Uniswap V2 contracts
│   ├── src/
│   │   ├── v2-core/            # UniswapV2 Core contracts (Solidity 0.5.16)
│   │   ├── v2-periphery/       # UniswapV2 Periphery contracts (Solidity 0.6.6)
│   │   ├── WETH9.sol           # Wrapped ETH contract
│   │   └── Multicall.sol       # Multicall for batch RPC calls
│   ├── script/
│   │   └── Deploy.s.sol        # Deployment script
│   └── foundry.toml            # Foundry configuration
│
└── UniswapV2-interface-2.6.4/  # Uniswap V2 Frontend
    ├── scripts/
    │   └── patch-uniswap-sdk.js  # SDK patching script
    └── src/constants/
        ├── index.ts              # Router address config
        └── multicall/index.ts    # Multicall address config
```

## 🔧 Key Technical Challenges Solved

### 1. Multi-Version Solidity Compilation

Uniswap V2 uses different Solidity versions:
- **v2-core**: `=0.5.16`
- **v2-periphery**: `=0.6.6`
- **Deployment scripts**: `^0.8.13`

**Solution**: Enable `auto_detect_solc = true` in `foundry.toml` to let Foundry compile each contract with its required version.

### 2. Init Code Hash Mismatch

UniswapV2Library uses a hardcoded `init_code_hash` to calculate pair addresses via CREATE2. The mainnet hash doesn't match locally compiled bytecode.

**Solution**: Generate the correct hash and update `UniswapV2Library.sol`:

```bash
forge inspect UniswapV2Pair bytecode | cast keccak
# Output: 0x4a164ea51df2a6a7cb0fc4385184ca464c646f6510b5cd69201035f64e9ee391
```

### 3. SDK Hardcoded Addresses

The `@uniswap/sdk` package has hardcoded mainnet addresses that need patching for local development.

**Solution**: Create a post-install patch script that automatically updates:
- `FACTORY_ADDRESS`
- `INIT_CODE_HASH`
- `WETH` addresses for each network

### 4. Node.js OpenSSL Compatibility

Node.js 17+ uses OpenSSL 3.0 which doesn't support legacy crypto algorithms used by older webpack.

**Solution**: Add `NODE_OPTIONS=--openssl-legacy-provider` to npm scripts.

### 5. Chain ID Compatibility

The Uniswap SDK only supports specific chain IDs (1, 3, 4, 5, 42). Sepolia (11155111) is not supported.

**Solution**: Use `anvil --chain-id 3` to simulate Ropsten network locally.

## 🚀 Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js v16+ (v16 LTS recommended)
- Yarn
- MetaMask or compatible wallet

### 1. Start Local Anvil Chain

```bash
# Use chain ID 3 (Ropsten) for SDK compatibility
anvil --chain-id 3
```

### 2. Deploy Contracts

```bash
cd UniswapV2_foundry

# Build contracts
forge build

# Deploy (using Anvil default account)
forge script script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**Note the deployed addresses:**
- Multicall: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- WETH9: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`
- Factory: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- Router: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`

### 3. Configure Frontend

```bash
cd UniswapV2-interface-2.6.4

# Install dependencies (automatically patches SDK)
yarn install

# Or manually patch SDK
yarn patch-sdk
```

Update addresses if needed in:
- `src/constants/index.ts` - `ROUTER_ADDRESS`
- `src/constants/multicall/index.ts` - `MULTICALL_NETWORKS[ChainId.ROPSTEN]`
- `scripts/patch-uniswap-sdk.js` - All addresses in `LOCAL_CONFIG`

### 4. Start Frontend

```bash
yarn start
```

### 5. Configure MetaMask

Add a custom network:

| Setting | Value |
|---------|-------|
| Network Name | Local Anvil (Ropsten) |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `3` |
| Currency Symbol | ETH |

Import the Anvil test account:
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## 🧪 Testing the Deployment

### 1. Deploy a Test ERC20 Token

```bash
# Example: Deploy HookERC20 from another project
cast send --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --create <ERC20_BYTECODE>
```

### 2. Approve Router to Spend Tokens

```bash
# Replace TOKEN_ADDRESS with your token address
# Replace AMOUNT with the amount to approve (in wei)
cast send TOKEN_ADDRESS \
  "approve(address,uint256)" \
  0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
  1000000000000000000000 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. Add Liquidity via Frontend

1. Go to http://localhost:3000/#/pool
2. Click "Add Liquidity"
3. Select ETH and paste your token address
4. Enter amounts and click "Supply"

### 4. Perform a Swap

1. Go to http://localhost:3000/#/swap
2. Select tokens
3. Enter amount and click "Swap"

## 📝 Configuration Files

### foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
auto_detect_solc = true
optimizer = true
optimizer_runs = 200

remappings = [
    "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/",
    "@uniswap/lib/contracts/libraries/=src/v2-periphery/libraries/",
    "@uniswap/v2-core/contracts/interfaces/=src/v2-core/interfaces/",
    "@uniswap/v2-core/contracts/libraries/=src/v2-core/libraries/",
]
```

### Current Deployment Addresses (Chain ID: 3)

| Contract | Address |
|----------|---------|
| Multicall | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| WETH9 | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| UniswapV2Factory | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| UniswapV2Router02 | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
| Init Code Hash | `0x4a164ea51df2a6a7cb0fc4385184ca464c646f6510b5cd69201035f64e9ee391` |

## 🔄 Redeployment Checklist

When you restart Anvil or redeploy contracts:

1. **Restart Anvil**: `anvil --chain-id 3`

2. **Deploy contracts**: `make deploy local` or `forge script ...`

3. **Update frontend addresses** in:
   - `src/constants/index.ts`: `ROUTER_ADDRESS`
   - `src/constants/multicall/index.ts`: `MULTICALL_NETWORKS[ChainId.ROPSTEN]`

4. **Update SDK patch** (if addresses changed):
   ```javascript
   // scripts/patch-uniswap-sdk.js
   const LOCAL_CONFIG = {
     FACTORY_ADDRESS: '0x...',
     INIT_CODE_HASH: '...',
     WETH_ROPSTEN: '0x...'
   };
   ```

5. **Re-run patch**: `yarn patch-sdk`

6. **Restart frontend**: `yarn start`

## ⚠️ Troubleshooting

### "execution reverted" errors

- Ensure you've approved the Router to spend your tokens
- Check that the init code hash in `UniswapV2Library.sol` matches the deployed Pair bytecode

### "No liquidity found"

- SDK addresses may not be patched correctly
- Run `yarn patch-sdk` and restart the frontend

### OpenSSL errors on Node.js 17+

- The `NODE_OPTIONS=--openssl-legacy-provider` is already set in package.json
- If issues persist, downgrade to Node.js 16 LTS

### MetaMask "Wrong network"

- Ensure you're connected to the custom network with Chain ID 3
- Clear MetaMask activity data if nonces are out of sync

## 📚 References

- [Uniswap V2 Documentation](https://docs.uniswap.org/contracts/v2/overview)
- [Foundry Book](https://book.getfoundry.sh/)
- [Uniswap V2 Core](https://github.com/Uniswap/v2-core)
- [Uniswap V2 Periphery](https://github.com/Uniswap/v2-periphery)

## 📄 License

This project is for educational purposes. Uniswap V2 contracts are licensed under GPL-3.0.
