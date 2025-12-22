import { CONTRACTS } from '../config/contracts';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';

interface NFTCardProps {
    tokenId: bigint;
    price: bigint; // 0 if not listed
    owner: string;
    isOwner: boolean;
    refetch: () => void;
}

export function NFTCard({ tokenId, price, owner, isOwner, refetch }: NFTCardProps) {
    const { address } = useAccount();
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    if (isSuccess) {
        setTimeout(() => refetch(), 1000);
    }

    const { data: isApproved } = useReadContract({
        address: CONTRACTS.BaseERC721.address,
        abi: CONTRACTS.BaseERC721.abi,
        functionName: 'isApprovedForAll',
        args: address && isOwner ? [address, CONTRACTS.NFTMarket.address] : undefined,
        query: { enabled: !!address && isOwner }
    });

    const { writeContract: writeApprove, isPending: isApproving } = useWriteContract();

    const handleApproveMarket = () => {
        writeApprove({
            address: CONTRACTS.BaseERC721.address,
            abi: CONTRACTS.BaseERC721.abi,
            functionName: 'setApprovalForAll',
            args: [CONTRACTS.NFTMarket.address, true]
        });
    }

    const handleList = () => {
        const listPrice = prompt("Enter price in Tokens:");
        if (!listPrice) return;

        writeContract({
            address: CONTRACTS.NFTMarket.address,
            abi: CONTRACTS.NFTMarket.abi,
            functionName: 'list',
            args: [tokenId, parseEther(listPrice)],
        });
    };

    const handleBuy = () => {
        if (!address) return alert("Connect Wallet");

        writeContract({
            address: CONTRACTS.NFTMarket.address,
            abi: CONTRACTS.NFTMarket.abi,
            functionName: 'buyNFT',
            args: [tokenId, price],
        });
    };

    const handleApproveToken = () => {
        writeContract({
            address: CONTRACTS.HookERC20.address,
            abi: CONTRACTS.HookERC20.abi,
            functionName: 'approve',
            args: [CONTRACTS.NFTMarket.address, price],
        });
    }

    return (
        <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            {/* Image Placeholder with Gradient */}
            <div className="aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-gray-400 font-semibold text-lg">NFT #{tokenId.toString()}</div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">Abstract Art #{tokenId.toString()}</h3>
                        <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                            {owner.slice(0, 6)}...{owner.slice(-4)}
                        </p>
                    </div>
                    {price > 0n && (
                        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                            Listed
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                    {price > 0n ? (
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500">Price</span>
                            <span className="text-indigo-600 font-bold text-lg">{Number(price) / 1e18} Token</span>
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400 font-medium">Not Listed</span>
                    )}

                    <div className="flex gap-2">
                        {price > 0n && !isOwner && (
                            <>
                                <button
                                    onClick={handleApproveToken}
                                    disabled={isPending || isConfirming}
                                    className="px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={handleBuy}
                                    disabled={isPending || isConfirming}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
                                >
                                    {isPending || isConfirming ? 'Processing...' : 'Buy Now'}
                                </button>
                            </>
                        )}
                        {isOwner && price === 0n && (
                            !isApproved ? (
                                <button
                                    onClick={handleApproveMarket}
                                    disabled={isApproving}
                                    className="px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50"
                                >
                                    {isApproving ? 'Approving...' : 'Approve Market'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleList}
                                    disabled={isPending || isConfirming}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                                >
                                    {isPending || isConfirming ? 'Listing...' : 'List for Sale'}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
