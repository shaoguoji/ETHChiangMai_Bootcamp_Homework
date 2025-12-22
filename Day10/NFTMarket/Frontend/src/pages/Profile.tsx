
import { Header } from '../components/Header';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACTS } from '../config/contracts';
import { NFTCard } from '../components/NFTCard';
import { useState, useEffect } from 'react';
import { parseAbiItem } from 'viem';

export function Profile() {
    const { address, isConnected } = useAccount();
    const publicClient = usePublicClient();
    const [userTokens, setUserTokens] = useState<bigint[]>([]);

    useEffect(() => {
        if (!address || !publicClient) return;

        const fetchUserTokens = async () => {
            try {
                // Fetch all Transfer events to the user
                const logs = await publicClient.getLogs({
                    address: CONTRACTS.BaseERC721.address,
                    event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
                    args: { to: address },
                    fromBlock: 'earliest'
                });

                // Extract unique Token IDs
                const tokenIds = Array.from(new Set(logs.map(log => (log as any).args.tokenId as bigint)));

                // Set state
                setUserTokens(tokenIds);
            } catch (e) {
                console.error(e);
            }
        };

        fetchUserTokens();
        // Poll every 3 seconds to auto-refresh after mint
        const interval = setInterval(fetchUserTokens, 3000);
        return () => clearInterval(interval);

    }, [address, publicClient]);

    const { writeContract } = useWriteContract();

    const handleMint = () => {
        if (!address) return;
        // Contract signature: mint(address to, uint256 tokenId)
        const tokenId = BigInt(Math.floor(Math.random() * 100000) + 1);
        writeContract({
            address: CONTRACTS.BaseERC721.address,
            abi: CONTRACTS.BaseERC721.abi,
            functionName: 'mint',
            args: [address, tokenId],
        });
    }

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <Header />
                <div className="container mx-auto px-6 py-20 text-center">
                    <h2 className="text-2xl font-bold text-gray-700">Please Connect Wallet</h2>
                    <p className="text-gray-500 mt-2">Connect your wallet to view your profile.</p>
                </div>
            </div>
        )
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
                    {userTokens.length > 0 ? (
                        userTokens.map((id) => (
                            <ProfileItem key={id.toString()} tokenId={id} ownerAddress={address} />
                        ))
                    ) : (
                        <div className="col-span-4 text-center py-10 text-gray-400">
                            No NFTs found. Try minting one!
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function BalanceDisplay({ address }: { address?: `0x${string}` }) {
    const { data: balance, isLoading } = useReadContract({
        address: CONTRACTS.HookERC20.address,
        abi: CONTRACTS.HookERC20.abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address,
        }
    });

    if (isLoading) return <div className="animate-pulse h-8 w-24 bg-gray-200 rounded"></div>

    return (
        <div className="bg-indigo-50 px-5 py-3 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider mb-1">Balance</p>
            <p className="text-xl font-bold text-indigo-700">
                {balance ? (Number(balance) / 1e18).toFixed(2) : '0.00'} HERC20
            </p>
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

    const { data: price, refetch: refetchPrice } = useReadContract({
        address: CONTRACTS.NFTMarket.address,
        abi: CONTRACTS.NFTMarket.abi,
        functionName: 'priceOfNft',
        args: [tokenId],
    });

    // Wait for data
    if (!owner) return <div className="animate-pulse h-64 bg-gray-100 rounded-2xl"></div>;

    // We only show items we currently own. 
    if (owner !== ownerAddress) return null;

    return (
        <NFTCard
            tokenId={tokenId}
            price={price as bigint || 0n}
            owner={owner as string}
            isOwner={true}
            refetch={() => { refetchPrice() }}
        />

    );
}

