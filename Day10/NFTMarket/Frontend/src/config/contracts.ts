
import NFTMarketABI from '../abi_NFTMarket.json';
import HookERC20ABI from '../abi_HookERC20.json';
import BaseERC721ABI from '../abi_BaseERC721.json';

// Local Anvil addresses from deployment log
export const CONTRACTS = {
    NFTMarket: {
        address: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as `0x${string}`,
        abi: NFTMarketABI,
    },
    HookERC20: {
        address: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9' as `0x${string}`,
        abi: HookERC20ABI,
    },
    BaseERC721: {
        address: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9' as `0x${string}`,
        abi: BaseERC721ABI,
    }
};
