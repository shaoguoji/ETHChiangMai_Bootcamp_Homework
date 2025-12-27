// Contract addresses - Supports multiple networks

export type ContractAddresses = {
  MyTokenV2: string;
  TokenBankV2: string;
  Delegate: string;
};

// Chain IDs
export const CHAIN_IDS = {
  ANVIL: 31337,
  SEPOLIA: 11155111,
} as const;

// V2 Contracts Sepolia
export const CONTRACTS_SEPOLIA: ContractAddresses = {
  MyTokenV2: '0xcf137BBFd546360bd09444D4761c5627A238D39A',
  TokenBankV2: '0x3A730cf364BeDeB1f2b36bF823AC90e6d7f2f207',
  Delegate: '', // TODO: Deploy to Sepolia and update
};

// Anvil Local Contracts (for local testing)
export const CONTRACTS_ANVIL: ContractAddresses = {
  MyTokenV2: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  TokenBankV2: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  Delegate: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

// Helper function to get contracts by chain ID
export function getContractsByChainId(chainId: number | undefined): ContractAddresses {
  switch (chainId) {
    case CHAIN_IDS.ANVIL:
      return CONTRACTS_ANVIL;
    case CHAIN_IDS.SEPOLIA:
      return CONTRACTS_SEPOLIA;
    default:
      // Default to Anvil for local development
      return CONTRACTS_ANVIL;
  }
}

// Keep CONTRACTS_V2 as alias for backward compatibility
export const CONTRACTS_V2 = CONTRACTS_SEPOLIA;

