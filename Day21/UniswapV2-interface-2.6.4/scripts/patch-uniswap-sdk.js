/**
 * Patch script for @uniswap/sdk
 * This script patches the SDK to use local contract addresses instead of mainnet
 * Run: node scripts/patch-uniswap-sdk.js
 * 
 * Auto-runs via postinstall in package.json
 */

const fs = require('fs');
const path = require('path');

// Configuration - UPDATE THESE VALUES AFTER EACH DEPLOYMENT
const LOCAL_CONFIG = {
  // Factory contract address from local deployment
  FACTORY_ADDRESS: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  
  // Init code hash of UniswapV2Pair
  // Generate with: forge inspect UniswapV2Pair bytecode | cast keccak
  INIT_CODE_HASH: '4a164ea51df2a6a7cb0fc4385184ca464c646f6510b5cd69201035f64e9ee391',
  
  // WETH address (for Ropsten network in SDK)
  WETH_ROPSTEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
};

// Mainnet/Testnet values to replace
const MAINNET_CONFIG = {
  FACTORY_ADDRESS: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  INIT_CODE_HASH: '96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
  // Original Ropsten WETH address in SDK
  WETH_ROPSTEN: '0xc778417E063141139Fce010982780140Aa0cD5Ab'
};

const SDK_PATH = path.join(__dirname, '../node_modules/@uniswap/sdk/dist');
const FILES_TO_PATCH = ['sdk.esm.js', 'sdk.cjs.production.min.js'];

function patchSDK() {
  console.log('🔧 Patching @uniswap/sdk for local deployment...\n');
  
  let patchedCount = 0;
  
  FILES_TO_PATCH.forEach(file => {
    const filePath = path.join(SDK_PATH, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace Factory Address
    if (content.includes(MAINNET_CONFIG.FACTORY_ADDRESS)) {
      content = content.split(MAINNET_CONFIG.FACTORY_ADDRESS).join(LOCAL_CONFIG.FACTORY_ADDRESS);
      modified = true;
    }
    
    // Replace Init Code Hash
    if (content.includes(MAINNET_CONFIG.INIT_CODE_HASH)) {
      content = content.split(MAINNET_CONFIG.INIT_CODE_HASH).join(LOCAL_CONFIG.INIT_CODE_HASH);
      modified = true;
    }
    
    // Replace WETH Ropsten Address
    if (content.includes(MAINNET_CONFIG.WETH_ROPSTEN)) {
      content = content.split(MAINNET_CONFIG.WETH_ROPSTEN).join(LOCAL_CONFIG.WETH_ROPSTEN);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Patched: ${file}`);
      patchedCount++;
    } else if (content.includes(LOCAL_CONFIG.FACTORY_ADDRESS)) {
      console.log(`⏭️  Already patched: ${file}`);
    } else {
      console.log(`❓ No changes needed: ${file}`);
    }
  });
  
  console.log(`\n📦 Patch complete! (${patchedCount} files modified)`);
  console.log('\n📋 Local Configuration:');
  console.log(`   Factory: ${LOCAL_CONFIG.FACTORY_ADDRESS}`);
  console.log(`   Init Hash: 0x${LOCAL_CONFIG.INIT_CODE_HASH}`);
  console.log(`   WETH (Ropsten): ${LOCAL_CONFIG.WETH_ROPSTEN}`);
}

// Run the patch
patchSDK();
