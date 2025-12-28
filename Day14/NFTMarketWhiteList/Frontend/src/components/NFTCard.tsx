import { useState } from 'react';
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
    const { writeContractAsync, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const [signature, setSignature] = useState<string>('');
    const [showSignatureInput, setShowSignatureInput] = useState(false);
    const [customError, setCustomError] = useState<string>('');

    const { data: isApproved, refetch: refetchApproval } = useReadContract({
        address: CONTRACTS.BaseERC721.address,
        abi: CONTRACTS.BaseERC721.abi,
        functionName: 'isApprovedForAll',
        args: address && isOwner ? [address, CONTRACTS.NFTMarket.address] : undefined,
        query: { enabled: !!address && isOwner }
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: CONTRACTS.HookERC20.address,
        abi: CONTRACTS.HookERC20.abi,
        functionName: 'allowance',
        args: address ? [address, CONTRACTS.NFTMarket.address] : undefined,
        query: { enabled: !!address && !isOwner && price > 0n }
    });

    if (isSuccess) {
        setTimeout(() => {
            refetch();
            refetchAllowance();
            refetchApproval();
        }, 1000);
    }

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

        writeContractAsync({
            address: CONTRACTS.NFTMarket.address,
            abi: CONTRACTS.NFTMarket.abi,
            functionName: 'list',
            args: [tokenId, parseEther(listPrice)],
        }).catch((err) => {
            setCustomError(err.message || "Listing failed");
        });
    };

    const handleBuy = () => {
        if (!address) return alert("Connect Wallet");

        // Show signature input for whitelist buy
        setShowSignatureInput(!showSignatureInput);
    };

    const handlePermitBuy = async () => {
        if (!address) return alert("Connect Wallet");
        if (!signature) return alert("Please enter signature");
        setCustomError('');

        try {
            await writeContractAsync({
                address: CONTRACTS.NFTMarket.address,
                abi: CONTRACTS.NFTMarket.abi,
                functionName: 'permitBuy',
                args: [tokenId, price, signature as `0x${string}`],
            });
        } catch (error: any) {
            console.error("PermitBuy Error:", error);
            // Extract meaningful error message
            let msg = error.message || "Transaction failed";
            if (msg.includes("Invalid signature or not whitelisted")) {
                msg = "Error: Invalid signature or not whitelisted";
            } else if (msg.includes("User denied")) {
                msg = "User denied transaction";
            } else {
                msg = msg.slice(0, 150) + "...";
            }
            setCustomError(msg);
        }
    }

    const handleApproveToken = () => {
        writeApprove({
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

                    {/* Buyer Controls */}
                    {price > 0n && !isOwner && (
                        <>
                            {allowance !== undefined && allowance < price ? (
                                <button
                                    onClick={handleApproveToken}
                                    disabled={isPending || isConfirming}
                                    className="px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                                >
                                    {isPending || isConfirming ? 'Approving...' : 'Approve To Buy'}
                                </button>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleBuy}
                                        disabled={isPending || isConfirming}
                                        className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-50"
                                    >
                                        {showSignatureInput ? 'Cancel' : 'Buy (Whitelist)'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {/* Seller Controls */}
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

                {/* Signature Input */}
                {showSignatureInput && !isOwner && price > 0n && (allowance !== undefined && allowance >= price) && (
                    <div className="mt-4 pt-4 border-t border-gray-50">
                        <div className="mb-2">
                            <label className="text-xs text-gray-500 block mb-1">Your Address</label>
                            <code className="text-[10px] bg-gray-50 p-1 rounded block break-all">{address}</code>
                        </div>
                        <div className="mb-2">
                            <label className="text-xs text-gray-500 block mb-1">Whitelist Signature</label>
                            <textarea
                                value={signature}
                                onChange={(e) => setSignature(e.target.value)}
                                placeholder="0x..."
                                className="w-full text-xs p-2 border border-gray-200 rounded-lg h-16 font-mono"
                            />
                        </div>
                        <button
                            onClick={handlePermitBuy}
                            disabled={isPending || isConfirming}
                            className="w-full py-2 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                        >
                            {isPending || isConfirming ? 'Confirming...' : 'Confirm Whitelist Buy'}
                        </button>
                    </div>
                )}

                {customError && (
                    <div className="mt-2 text-xs text-red-500 break-words bg-red-50 p-2 rounded">
                        {customError}
                    </div>
                )}
            </div>
        </div>
    );
}
