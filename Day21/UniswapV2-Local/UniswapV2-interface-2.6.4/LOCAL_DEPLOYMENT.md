# UniswapV2 Local Deployment Configuration

## SDK Patch Script

The `@uniswap/sdk` package has hardcoded mainnet contract addresses. This project uses a patch script to automatically update them for local development.

### How it works

1. After running `yarn install`, the `postinstall` script automatically runs `scripts/patch-uniswap-sdk.js`
2. The script replaces mainnet addresses with your local deployment addresses

### Manual patching

If you need to manually apply the patch:

```bash
yarn patch-sdk
# or
node scripts/patch-uniswap-sdk.js
```

### Updating addresses after redeployment

When you redeploy your contracts, update the addresses in `scripts/patch-uniswap-sdk.js`:

```javascript
const LOCAL_CONFIG = {
  FACTORY_ADDRESS: '0x...', // Your new factory address
  INIT_CODE_HASH: '...'     // Your new init code hash
};
```

To get the init code hash:
```bash
cd ../UniswapV2_foundry
forge inspect UniswapV2Pair bytecode | cast keccak
```

### Files that need to be updated for local deployment

1. `scripts/patch-uniswap-sdk.js` - SDK addresses
2. `src/constants/index.ts` - ROUTER_ADDRESS
3. `src/constants/multicall/index.ts` - MULTICALL_NETWORKS

## Current Local Deployment (Chain ID: 3)

| Contract | Address |
|----------|---------|
| Multicall | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| WETH9 | Check deployment output |
| Factory | `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0` |
| Router | `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9` |
