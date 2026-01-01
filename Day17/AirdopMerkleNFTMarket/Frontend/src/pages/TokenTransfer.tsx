
import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, encodeAbiParameters, parseAbiParameters } from 'viem';
import { CONTRACTS } from '../config/contracts';
import { Header } from '../components/Header';

export function TokenTransfer() {
    const { address, isConnected } = useAccount();
    const [mode, setMode] = useState<'standard' | 'callback'>('standard');

    // Standard Transfer State
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');

    // Callback Transfer State
    const [cbAmount, setCbAmount] = useState('');
    const [tokenId, setTokenId] = useState('');

    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const handleStandardTransfer = () => {
        if (!recipient || !amount) return;
        writeContract({
            address: CONTRACTS.HookERC20.address,
            abi: CONTRACTS.HookERC20.abi,
            functionName: 'transfer',
            args: [recipient as `0x${string}`, parseEther(amount)],
        });
    };

    const handleCallbackTransfer = () => {
        if (!tokenId || !cbAmount) return;

        // Encode tokenId as uint256 bytes
        const data = encodeAbiParameters(
            parseAbiParameters('uint256'),
            [BigInt(tokenId)]
        );

        writeContract({
            address: CONTRACTS.HookERC20.address,
            abi: CONTRACTS.HookERC20.abi,
            functionName: 'transferWithCallback',
            args: [CONTRACTS.NFTMarket.address, parseEther(cbAmount), data],
        });
    };

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-gray-50 pt-20">
                <Header />
                <div className="container mx-auto px-6 py-20 text-center">
                    <h2 className="text-2xl font-bold text-gray-700">Please Connect Wallet</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            <Header />
            <main className="container mx-auto px-6 py-8">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">ERC20 Token Transfer</h2>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-gray-100">
                            <button
                                onClick={() => setMode('standard')}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'standard' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Standard Transfer
                            </button>
                            <button
                                onClick={() => setMode('callback')}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${mode === 'callback' ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Transfer with Callback (Auto-Buy)
                            </button>
                        </div>

                        <div className="p-8">
                            {mode === 'standard' ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Address</label>
                                        <input
                                            type="text"
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            placeholder="0x..."
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount (HERC20)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.0"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleStandardTransfer}
                                        disabled={isPending || isConfirming}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                                    >
                                        {isPending || isConfirming ? 'Sending...' : 'Send Tokens'}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6">
                                        <p className="text-sm text-amber-800">
                                            This sends tokens to the <strong>NFT Market Contract</strong> and triggers a purchase for the specified Token ID.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">NFT Token ID to Buy</label>
                                        <input
                                            type="number"
                                            value={tokenId}
                                            onChange={(e) => setTokenId(e.target.value)}
                                            placeholder="e.g. 1042"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount (HERC20)</label>
                                        <input
                                            type="number"
                                            value={cbAmount}
                                            onChange={(e) => setCbAmount(e.target.value)}
                                            placeholder="Price of NFT"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleCallbackTransfer}
                                        disabled={isPending || isConfirming}
                                        className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50"
                                    >
                                        {isPending || isConfirming ? 'Processing...' : 'Transfer & Buy NFT'}
                                    </button>
                                </div>
                            )}

                            {isSuccess && (
                                <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-center">
                                    Transaction Successful!
                                </div>
                            )}
                            {error && (
                                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-center break-all text-sm">
                                    {error.message.split('\n')[0]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
