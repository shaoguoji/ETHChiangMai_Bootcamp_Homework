
import NFTMarketABI from '../abi_NFTMarket.json';
import HookERC20ABI from '../abi_HookERC20.json';
import BaseERC721ABI from '../abi_BaseERC721.json';

// Local Anvil addresses from deployment log
export const CONTRACTS = {
    NFTMarket: {
        address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
        abi: NFTMarketABI,
    },
    HookERC20: {
        address: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
        abi: HookERC20ABI,
    },
    BaseERC721: {
        address: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
        abi: BaseERC721ABI,
    }
};
