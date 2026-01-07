import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, sepolia, anvil } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Launchpad',
  projectId: 'YOUR_PROJECT_ID', // Get from WalletConnect Cloud
  chains: [anvil, sepolia, mainnet],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545'),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
