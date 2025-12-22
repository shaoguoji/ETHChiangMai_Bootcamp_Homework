
import { Header } from '../components/Header';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACTS } from '../config/contracts';
import { NFTCard } from '../components/NFTCard';
import { useState, useEffect } from 'react';

export function Profile() {
    const { address } = useAccount();
    const [userTokens, setUserTokens] = useState<bigint[]>([]);

    useEffect(() => {
        setUserTokens(Array.from({ length: 20 }, (_, i) => BigInt(i)));
    }, []);

    const { writeContract } = useWriteContract();

    const handleMint = () => {
        if (!address) return;
        writeContract({
            address: CONTRACTS.BaseERC721.address,
            abi: CONTRACTS.BaseERC721.abi,
            functionName: 'mint',
            args: [address, "ipfs://test"],
        });
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Header />
            <main className="container mx-auto px-6 py-8">
                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 p-[2px]">
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                                    <span className="text-3xl">👤</span>
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">My Collection</h2>
                                <p className="text-sm font-mono text-gray-500 bg-gray-100 px-3 py-1 rounded-full inline-block">
                                    {address}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <BalanceDisplay address={address} />
                            <button
                                onClick={handleMint}
                                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                            >
                                + Mint New NFT
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Your NFTs</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {userTokens.map((id) => (
                        <ProfileItem key={id.toString()} tokenId={id} ownerAddress={address} />
                    ))}
                </div>
            </main>
        </div>
    );
}

function BalanceDisplay({ address }: { address?: `0x${string}` }) {
    const { data: balance } = useReadContract({
        address: CONTRACTS.HookERC20.address,
        abi: CONTRACTS.HookERC20.abi,
        functionName: 'balanceOf',
        args: [address],
    });

    return (
        <div className="bg-indigo-50 px-5 py-3 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Balance</p>
            <p className="text-xl font-bold text-indigo-700">{balance ? Number(balance) / 1e18 : 0} HERC20</p>
        </div>
    )
}

function ProfileItem({ tokenId, ownerAddress }: { tokenId: bigint, ownerAddress?: `0x${string}` }) {
    const { data: owner } = useReadContract({
        address: CONTRACTS.BaseERC721.address,
        abi: CONTRACTS.BaseERC721.abi,
        functionName: 'ownerOf',
        args: [tokenId],
    });

    if (owner !== ownerAddress) return null;

    const { data: price } = useReadContract({
        address: CONTRACTS.NFTMarket.address,
        abi: CONTRACTS.NFTMarket.abi,
        functionName: 'priceOfNft',
        args: [tokenId],
    });

    return (
        <div>
            <NFTCard
                tokenId={tokenId}
                price={price as bigint || 0n}
                owner={owner as string}
                isOwner={true}
                refetch={() => { }}
            />
            <ApprovalCheck owner={ownerAddress} />
        </div>
    );
}

function ApprovalCheck({ owner }: { owner?: `0x${string}` }) {
    const { data: isApproved } = useReadContract({
        address: CONTRACTS.BaseERC721.address,
        abi: CONTRACTS.BaseERC721.abi,
        functionName: 'isApprovedForAll',
        args: [owner, CONTRACTS.NFTMarket.address],
    });

    const { writeContract, isPending } = useWriteContract();

    if (isApproved) return (
        <div className="mt-2 text-center">
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                ✓ Market Approved
            </span>
        </div>
    );

    return (
        <button
            onClick={() => writeContract({
                address: CONTRACTS.BaseERC721.address,
                abi: CONTRACTS.BaseERC721.abi,
                functionName: 'setApprovalForAll',
                args: [CONTRACTS.NFTMarket.address, true]
            })}
            disabled={isPending}
            className="w-full mt-3 text-xs font-semibold text-indigo-600 border border-indigo-200 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
        >
            {isPending ? 'Approving...' : 'Approve Market Access'}
        </button>
    )
}
