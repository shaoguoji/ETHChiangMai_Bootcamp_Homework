import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { type Chain } from 'viem';

const anvil = {
    id: 31337,
    name: 'Anvil Local',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['http://127.0.0.1:8545'] },
    },
    testnet: true,
} as const satisfies Chain;

export const config = getDefaultConfig({
    appName: 'TokenBank Dapp',
    projectId: import.meta.env.VITE_PROJECT_ID,
    chains: [anvil, sepolia],
    ssr: false, // Vite is client-side
});
