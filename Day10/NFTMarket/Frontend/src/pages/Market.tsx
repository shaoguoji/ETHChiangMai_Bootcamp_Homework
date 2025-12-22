
import { useReadContract } from 'wagmi';
import { CONTRACTS } from '../config/contracts';
import { NFTCard } from '../components/NFTCard';
import { Header } from '../components/Header';
import { useState, useEffect } from 'react';

export function Market() {
    const [tokens, setTokens] = useState<bigint[]>([]);

    useEffect(() => {
        setTokens(Array.from({ length: 20 }, (_, i) => BigInt(i)));
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Header />
            <main className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10">
                    <div>
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Explore Marketplace</h2>
                        <p className="text-gray-500">Discover and collect extraordinary NFTs</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>Recently Listed</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {tokens.map((id) => (
                        <MarketItem key={id.toString()} tokenId={id} />
                    ))}
                </div>
            </main>
        </div>
    );
}

function MarketItem({ tokenId }: { tokenId: bigint }) {
    const { data: price } = useReadContract({
        address: CONTRACTS.NFTMarket.address,
        abi: CONTRACTS.NFTMarket.abi,
        functionName: 'priceOfNft',
        args: [tokenId],
    }) as { data: bigint };

    const { data: owner } = useReadContract({
        address: CONTRACTS.BaseERC721.address,
        abi: CONTRACTS.BaseERC721.abi,
        functionName: 'ownerOf',
        args: [tokenId],
    });

    if (!owner) return null;
    if (!price || price === 0n) return null;

    return (
        <NFTCard
            tokenId={tokenId}
            price={price}
            owner={owner as string}
            isOwner={false}
            refetch={() => { }}
        />
    );
}
