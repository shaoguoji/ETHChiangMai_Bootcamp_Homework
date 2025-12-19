import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, localhost } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'TokenBank Dapp',
    projectId: import.meta.env.VITE_PROJECT_ID,
    chains: [localhost, sepolia],
    ssr: false, // Vite is client-side
});
