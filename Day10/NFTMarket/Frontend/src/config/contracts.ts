
import NFTMarketABI from '../abi_NFTMarket.json';
import HookERC20ABI from '../abi_HookERC20.json';
import BaseERC721ABI from '../abi_BaseERC721.json';

// Local Anvil addresses from deployment log
export const CONTRACTS = {
    NFTMarket: {
        address: '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c' as `0x${string}`,
        abi: NFTMarketABI,
    },
    HookERC20: {
        address: '0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE' as `0x${string}`,
        abi: HookERC20ABI,
    },
    BaseERC721: {
        address: '0x68B1D87F95878fE05B998F19b66F4baba5De1aed' as `0x${string}`,
        abi: BaseERC721ABI,
    }
};
