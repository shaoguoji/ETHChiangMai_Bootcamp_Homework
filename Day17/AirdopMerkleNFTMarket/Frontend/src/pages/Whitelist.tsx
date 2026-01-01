
import { useState, useEffect, useMemo } from 'react';
import { Header } from '../components/Header';
import { keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { WHITELIST_ADDRESSES } from '../config/whitelist';
import { CONTRACTS } from '../config/contracts';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { MerkleTree } from 'merkletreejs';

interface WhitelistItem {
    address: string;
    signature: string;
}

export function Whitelist() {
    const { address: userAddress } = useAccount();
    const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
    const [error, setError] = useState('');

    // --- Merkle Root Logic ---
    const { expectedRoot } = useMemo(() => {
        const leaves = WHITELIST_ADDRESSES.map((addr) => keccak256(encodePacked(['address'], [addr as `0x${string}`])));
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const root = tree.getHexRoot();
        return { expectedRoot: root };
    }, []);

    const { data: onChainRoot, refetch: refetchRoot } = useReadContract({
        address: CONTRACTS.NFTMarket.address,
        abi: CONTRACTS.NFTMarket.abi,
        functionName: 'merkleRoot',
    });

    const { writeContractAsync, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleSetRoot = async () => {
        try {
             await writeContractAsync({
                address: CONTRACTS.NFTMarket.address,
                abi: CONTRACTS.NFTMarket.abi,
                functionName: 'setMerkleRoot',
                args: [expectedRoot as `0x${string}`]
            });
        } catch (e: any) {
            console.error(e);
            alert(e.message);
        }
    };
    
    useEffect(() => {
        if (isSuccess) {
            refetchRoot();
        }
    }, [isSuccess]);


    // --- Existing Signature Logic (Optional/Legacy) ---
    useEffect(() => {
        const generateSignatures = async () => {
            try {
                // Only generate if key exists, otherwise skip to avoid error spam
                const privateKey = import.meta.env.VITE_MARKET_OWNER_KEY;
                if (!privateKey || !privateKey.startsWith('0x')) {
                    // throw new Error('Owner private key not found or invalid in .env (VITE_MARKET_OWNER_KEY)');
                    return; 
                }

                const account = privateKeyToAccount(privateKey as `0x${string}`);
                const items: WhitelistItem[] = [];

                for (const addr of WHITELIST_ADDRESSES) {
                    const hash = keccak256(encodePacked(['address'], [addr as `0x${string}`]));
                    const signature = await account.signMessage({
                        message: { raw: hash }
                    });
                    items.push({ address: addr, signature });
                }
                setWhitelist(items);
            } catch (e: any) {
                console.error(e);
                setError(e.message);
            }
        };

        generateSignatures();
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Header />
            <main className="container mx-auto px-6 py-8">
                
                {/* Admin Section for Merkle Root */}
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">👑 Admin: Merkle Root</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Expected Root (Frontend)</p>
                            <code className="text-sm font-mono text-green-700 bg-green-50 px-2 py-1 rounded block truncate" title={expectedRoot}>
                                {expectedRoot}
                            </code>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">On-Chain Root (Contract)</p>
                            <code className={`text-sm font-mono px-2 py-1 rounded block truncate ${onChainRoot === expectedRoot ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`} title={onChainRoot as string}>
                                {onChainRoot as string || "Loading..."}
                            </code>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        {onChainRoot !== expectedRoot ? (
                            <button 
                                onClick={handleSetRoot}
                                disabled={isPending || isConfirming}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                                {isPending || isConfirming ? 'Updating Root...' : '⚡ Update Merkle Root to Fix WhiteList'}
                            </button>
                        ) : (
                             <div className="flex items-center gap-2 text-green-700 font-semibold bg-green-50 px-4 py-2 rounded-lg inline-block">
                                ✅ Merkle Root Synced
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2 ml-1">
                            Only the contract owner can update the root.
                        </p>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Whitelist Addresses</h2>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="p-4 font-semibold">Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {WHITELIST_ADDRESSES.map((addr) => (
                                    <tr key={addr} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-gray-700">
                                            {addr}
                                            {userAddress && userAddress.toLowerCase() === addr.toLowerCase() && (
                                                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">You</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
