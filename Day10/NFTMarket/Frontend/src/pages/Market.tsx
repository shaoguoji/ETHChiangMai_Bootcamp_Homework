
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACTS } from '../config/contracts';
import { NFTCard } from '../components/NFTCard';
import { Header } from '../components/Header';
import { useState, useEffect } from 'react';
import { parseAbiItem } from 'viem';

export function Market() {
    const publicClient = usePublicClient();
    const [tokens, setTokens] = useState<bigint[]>([]);

    useEffect(() => {
        if (!publicClient) return;

        const fetchListedTokens = async () => {
            try {
                const currentBlock = await publicClient.getBlockNumber();
                const fromBlock = currentBlock - 50000n > 0n ? currentBlock - 50000n : 0n;

                // Fetch all logList events to find any token that has ever been listed
                const logs = await publicClient.getLogs({
                    address: CONTRACTS.NFTMarket.address,
                    event: parseAbiItem('event logList(address saler, uint256 tokenId, uint256 price)'),
                    fromBlock: fromBlock
                });

                // Extract unique Token IDs
                // Cast logic to fix lint error if needed, but simple map should work if typed correctly
                const tokenIds = Array.from(new Set(logs.map(log => (log as any).args.tokenId as bigint)));

                // We will let the MarketItem component decide if it's *currently* listed by checking priceOfNft
                // Effectively, we are iterating over "candidate" tokens instead of 0-20.
                setTokens(tokenIds);
            } catch (e) {
                console.error(e);
            }
        };

        fetchListedTokens();
        const interval = setInterval(fetchListedTokens, 5000);
        return () => clearInterval(interval);

    }, [publicClient]);

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Header />
            <main className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10">
                    <div>
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Explore Marketplace</h2>
                        <p className="text-gray-500">Discover and collect extraordinary NFTs</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {tokens.length > 0 ? (
                        tokens.map((id) => (
                            <MarketItem key={id.toString()} tokenId={id} />
                        ))
                    ) : (
                        <div className="col-span-4 text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                            <div className="text-6xl mb-4">🏪</div>
                            <h3 className="text-xl font-bold text-gray-900">Market is Empty</h3>
                            <p className="text-gray-500 mt-2">Be the first to list an NFT!</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function MarketItem({ tokenId }: { tokenId: bigint }) {
    const { data: price, refetch: refetchPrice } = useReadContract({
        address: CONTRACTS.NFTMarket.address,
        abi: CONTRACTS.NFTMarket.abi,
        functionName: 'priceOfNft',
        args: [tokenId],
    });

    const { data: owner } = useReadContract({
        address: CONTRACTS.BaseERC721.address,
        abi: CONTRACTS.BaseERC721.abi,
        functionName: 'ownerOf',
        args: [tokenId],
    });

    // If data is not loaded yet
    if (price === undefined) return null;

    // If price is 0, it means it's not currently listed (or unlisted/bought)
    if (price === 0n) return null;

    // Safety check
    if (!owner) return null;

    return (
        <NFTCard
            tokenId={tokenId}
            price={price as bigint}
            owner={owner as string}
            isOwner={false}
            refetch={() => { refetchPrice() }}
        />
    );
}
