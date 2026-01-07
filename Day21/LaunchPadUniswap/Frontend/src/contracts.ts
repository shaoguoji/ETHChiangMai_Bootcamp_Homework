// MemeFactory Contract ABI (subset for frontend interactions)
export const MemeFactoryABI = [
  {
    inputs: [{ internalType: 'address', name: '_uniswapRouter', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'tokenAddress', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amountToken', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amountETH', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'liquidity', type: 'uint256' },
    ],
    name: 'LiquidityAdded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'tokenAddress', type: 'address' },
      { indexed: false, internalType: 'string', name: 'symbol', type: 'string' },
      { indexed: true, internalType: 'address', name: 'issuer', type: 'address' },
    ],
    name: 'MemeDeployed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'tokenAddress', type: 'address' },
      { indexed: true, internalType: 'address', name: 'minter', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'MemeMinted',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'address', name: 'tokenAddr', type: 'address' }],
    name: 'buyMeme',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
      { internalType: 'uint256', name: 'perMint', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
    ],
    name: 'deployMeme',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'implementation',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '', type: 'address' }],
    name: 'memeInfos',
    outputs: [
      { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
      { internalType: 'uint256', name: 'currentSupply', type: 'uint256' },
      { internalType: 'uint256', name: 'perMint', type: 'uint256' },
      { internalType: 'uint256', name: 'price', type: 'uint256' },
      { internalType: 'address', name: 'issuer', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'tokenAddr', type: 'address' }],
    name: 'mintMeme',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'uniswapRouter',
    outputs: [{ internalType: 'contract IUniswapV2Router02', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDeployedMemes',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getDeployedMemesCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
] as const;

// MemeToken Contract ABI (subset for frontend interactions)
export const MemeTokenABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Deployed Contract Addresses (update after deployment)
export const CONTRACTS = {
  // Anvil Local (Chain ID: 31337)
  31337: {
    MemeFactory: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
  },
  // Sepolia (Chain ID: 11155111)
  11155111: {
    MemeFactory: '0x11ACe159470496f5197A4e6b58EA688B49e4902A' as `0x${string}`,
  },
} as const;

// Uniswap V2 Router ABI (subset for price queries)
export const UniswapRouterABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'address[]', name: 'path', type: 'address[]' },
    ],
    name: 'getAmountsOut',
    outputs: [{ internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'WETH',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'pure',
    type: 'function',
  },
] as const;

// Uniswap Router addresses
export const UNISWAP_ROUTER = {
  31337: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3' as `0x${string}`,
  11155111: '0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3' as `0x${string}`,
} as const;

// WETH addresses
export const WETH = {
  31337: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9' as `0x${string}`,
  11155111: '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9' as `0x${string}`,
} as const;
