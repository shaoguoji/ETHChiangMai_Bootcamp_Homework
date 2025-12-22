
import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACTS } from '../config/contracts';
import { Header } from '../components/Header';
import { parseAbiItem } from 'viem';

export function History() {
    const publicClient = usePublicClient();
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        if (!publicClient) return;

        const fetchLogs = async () => {
            try {
                const listLogs = await publicClient.getLogs({
                    address: CONTRACTS.NFTMarket.address,
                    event: parseAbiItem('event logList(address saler, uint256 tokenId, uint256 price)'),
                    fromBlock: 'earliest'
                });

                const buyLogs = await publicClient.getLogs({
                    address: CONTRACTS.NFTMarket.address,
                    event: parseAbiItem('event logBuy(address buyer, uint256 tokenId, uint256 price)'),
                    fromBlock: 'earliest'
                });

                const allLogs = [
                    ...listLogs.map(l => ({ ...l, type: 'List' })),
                    ...buyLogs.map(l => ({ ...l, type: 'Buy' }))
                ].sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

                setLogs(allLogs);
            } catch (e) {
                console.error(e);
            }
        };

        fetchLogs();
    }, [publicClient]);

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Header />
            <main className="container mx-auto px-6 py-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Activity History</h2>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Event</th>
                                    <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item</th>
                                    <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price (Token)</th>
                                    <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map((log) => (
                                    <tr key={log.transactionHash + log.logIndex} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${log.type === 'Buy'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {log.type.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-5 font-medium text-gray-900">NFT #{log.args.tokenId?.toString()}</td>
                                        <td className="p-5 font-bold text-gray-700">{log.args.price ? (Number(log.args.price) / 1e18).toString() : '0'}</td>
                                        <td className="p-5 font-mono text-xs text-gray-500">
                                            {log.type === 'List' ? (log.args as any).saler : (log.args as any).buyer}
                                        </td>
                                        <td className="p-5">
                                            <a
                                                href="#" // In real app Link to explorer 
                                                className="font-mono text-xs text-indigo-500 hover:text-indigo-700 hover:underline truncate max-w-[150px] block"
                                            >
                                                {log.transactionHash}
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-gray-400">
                                            No activity found yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
