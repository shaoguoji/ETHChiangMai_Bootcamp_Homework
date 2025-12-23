import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import { formatEther } from 'viem';

interface Transfer {
    id: number;
    hash: string;
    from_address: string;
    to_address: string;
    value: string;
    block_number: number;
}

export function TransferList() {
    const { address, isConnected } = useAccount();
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isConnected && address) {
            fetchTransfers();
            const interval = setInterval(fetchTransfers, 5000); // Auto-refresh every 5s
            return () => clearInterval(interval);
        } else {
            setTransfers([]);
        }
    }, [address, isConnected]);

    const fetchTransfers = async () => {
        if (!address) return;
        try {
            // Only set loading on initial fetch if list is empty
            if (transfers.length === 0) setLoading(true);
            const response = await axios.get(`http://localhost:3000/transfers/${address}`);
            setTransfers(response.data);
        } catch (error) {
            console.error('Error fetching transfers:', error);
        } finally {
            if (transfers.length === 0) setLoading(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Wallet Disconnected</h3>
                <p className="text-gray-500 max-w-sm">Please connect your wallet to view your transaction history for the indexed token.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Transfer History</h2>
                    <p className="text-sm text-gray-500 mt-1">Found {transfers.length} transactions associated with this address.</p>
                </div>
                <button
                    onClick={fetchTransfers}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Refresh"
                >
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {transfers.length === 0 && !loading ? (
                <div className="text-center py-16 px-4">
                    <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No Transactions Found</h3>
                    <p className="text-gray-500 mt-1">This address hasn't sent or received any indexed tokens yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tx Hash
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    From
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    To
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Value
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Block
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transfers.map((tx) => {
                                const isFromMe = tx.from_address.toLowerCase() === address.toLowerCase();
                                const isToMe = tx.to_address.toLowerCase() === address.toLowerCase();

                                return (
                                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                            <a href={`https://sepolia.etherscan.io/tx/${tx.hash}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                {tx.hash.substring(0, 8)}...{tx.hash.substring(tx.hash.length - 6)}
                                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                {isFromMe ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                        OUT
                                                    </span>
                                                ) : null}
                                                <span title={tx.from_address} className={isFromMe ? 'font-medium text-gray-900' : ''}>
                                                    {isFromMe ? 'You' : `${tx.from_address.substring(0, 6)}...${tx.from_address.substring(tx.from_address.length - 4)}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div className="flex items-center gap-2">
                                                {isToMe ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        IN
                                                    </span>
                                                ) : null}
                                                <span title={tx.to_address} className={isToMe ? 'font-medium text-gray-900' : ''}>
                                                    {isToMe ? 'You' : `${tx.to_address.substring(0, 6)}...${tx.to_address.substring(tx.to_address.length - 4)}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-medium text-gray-900">
                                            {formatEther(BigInt(tx.value))} ETH
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {tx.block_number}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
