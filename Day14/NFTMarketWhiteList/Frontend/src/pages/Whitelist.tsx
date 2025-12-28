
import { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { WHITELIST_ADDRESSES } from '../config/whitelist';

interface WhitelistItem {
    address: string;
    signature: string;
}

export function Whitelist() {
    const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const generateSignatures = async () => {
            try {
                const privateKey = import.meta.env.VITE_MARKET_OWNER_KEY;
                if (!privateKey || !privateKey.startsWith('0x')) {
                    throw new Error('Owner private key not found or invalid in .env (VITE_MARKET_OWNER_KEY)');
                }

                const account = privateKeyToAccount(privateKey as `0x${string}`);
                const items: WhitelistItem[] = [];

                for (const addr of WHITELIST_ADDRESSES) {
                    // Contract Logic: keccak256(abi.encodePacked(msg.sender)) -> toEthSignedMessageHash
                    // Viem Logic: signMessage({ raw: hash }) handles the prefixing for us.
                    // We just need to hash the address first.

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
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Whitelist Manager</h2>
                    <p className="text-gray-500 mb-8">
                        The following addresses have been pre-approved. Use their signatures to buy NFTs.
                    </p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-100">
                            Error: {error}
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                                    <th className="p-4 font-semibold">Address</th>
                                    <th className="p-4 font-semibold">Signature</th>
                                    <th className="p-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {whitelist.map((item) => (
                                    <tr key={item.address} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 font-mono text-sm text-gray-700">
                                            {item.address}
                                        </td>
                                        <td className="p-4 font-mono text-xs text-gray-500 max-w-xs truncate" title={item.signature}>
                                            {item.signature}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => copyToClipboard(item.signature)}
                                                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Copy Sig
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {whitelist.length === 0 && !error && (
                                    <tr>
                                        <td colSpan={3} className="p-8 text-center text-gray-400">
                                            Loading signatures...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <h4 className="text-sm font-bold text-amber-800 mb-2">⚠️ Security Warning</h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            This page generates signatures using a private key stored in the frontend environment.
                            <strong>This is for educational purposes only.</strong> In a production app, signatures should be generated by a secure backend service.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
