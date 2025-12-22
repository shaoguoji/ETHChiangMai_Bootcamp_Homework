
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia } from '@reown/appkit/networks'
import { type AppKitNetwork } from '@reown/appkit/networks'


const anvil: AppKitNetwork = {
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
    chainNamespace: 'eip155',
    caipNetworkId: 'eip155:31337',
}

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, anvil]


export const projectId = import.meta.env.VITE_PROJECT_ID

if (!projectId) {
    throw new Error('Project ID is not defined')
}

export const wagmiAdapter = new WagmiAdapter({
    projectId,
    networks
})

export const config = wagmiAdapter.wagmiConfig

createAppKit({
    adapters: [wagmiAdapter],
    networks: networks,
    projectId,
    features: {
        analytics: true
    }
})

