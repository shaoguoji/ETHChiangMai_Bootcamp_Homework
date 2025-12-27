import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount, useReadContract, usePublicClient, useChainId } from 'wagmi';
import { formatEther, parseEther, encodeFunctionData, type Hex, type Address } from 'viem';
import { getContractsByChainId, CHAIN_IDS } from '../constants/addresses';
import { TOKEN_BANK_V2_ABI, HOOKERC20_ABI } from '../constants/abis';

type AddressType = `0x${string}`;

export default function EIP7702Deposit() {
    const { address, isConnected, connector } = useAccount();
    const publicClient = usePublicClient();
    const chainId = useChainId();

    // Get contracts based on current chain
    const CONTRACTS = useMemo(() => getContractsByChainId(chainId), [chainId]);
    const isSepolia = chainId === CHAIN_IDS.SEPOLIA;

    const [depositAmount, setDepositAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null); // callsId or txHash
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');
    const [debugStatus, setDebugStatus] = useState<string>('');

    // Read token balance
    const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
        address: CONTRACTS.MyTokenV2 as AddressType,
        abi: HOOKERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Read bank balance
    const { data: bankBalance, refetch: refetchBankBalance } = useReadContract({
        address: CONTRACTS.TokenBankV2 as AddressType,
        abi: TOKEN_BANK_V2_ABI,
        functionName: 'amountsOf',
        args: address ? [address] : undefined,
    });

    // Read token symbol
    const { data: tokenSymbol } = useReadContract({
        address: CONTRACTS.MyTokenV2 as AddressType,
        abi: HOOKERC20_ABI,
        functionName: 'symbol',
        args: [],
    });

    // Refetch statuses
    useEffect(() => {
        if (txHash && !isProcessing) {
            refetchTokenBalance();
            refetchBankBalance();
        }
    }, [txHash, isProcessing, refetchTokenBalance, refetchBankBalance]);

    // Polling function for wallet_getCallsStatus
    const waitForCallsConfirmation = useCallback(async (
        callId: string,
        provider: any
    ): Promise<{ success: boolean; transactionHash?: Hex }> => {
        const maxAttempts = 60;
        const intervalMs = 2000;

        for (let i = 0; i < maxAttempts; i++) {
            try {
                const status = await provider.request({
                    method: 'wallet_getCallsStatus',
                    params: [callId]
                }) as { status: string | number; receipts?: Array<{ transactionHash: Hex }> };

                console.log('Call Status:', status);
                setDebugStatus(JSON.stringify(status));

                // Success if status is 'CONFIRMED' or 200 (HTTP OK-like code used by MetaMask)
                if (status.status === 'CONFIRMED' || status.status === 200) {
                    return {
                        success: true,
                        transactionHash: status.receipts?.[0]?.transactionHash
                    };
                }

                if (status.status === 'FAILED') {
                    return { success: false };
                }

                // Still pending
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            } catch (err) {
                console.warn('Status check failed, retrying...', err);
                await new Promise(resolve => setTimeout(resolve, intervalMs));
            }
        }
        return { success: false };
    }, []);

    const handleEIP7702Deposit = async () => {
        if (!isConnected || !address || !connector) {
            setError('Please connect your wallet');
            return;
        }

        if (!depositAmount) {
            setError('Please enter amount');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setTxHash(null);

        try {
            const amount = parseEther(depositAmount);
            const provider = await connector.getProvider() as any;

            if (!provider) {
                throw new Error('Provider not available');
            }

            // Prepare Batch Calls
            // Call 1: Approve
            const approveData = encodeFunctionData({
                abi: HOOKERC20_ABI,
                functionName: 'approve',
                args: [CONTRACTS.TokenBankV2 as AddressType, amount],
            });

            // Call 2: Deposit
            const depositData = encodeFunctionData({
                abi: TOKEN_BANK_V2_ABI,
                functionName: 'deposit',
                args: [amount],
            });

            const calls = [
                {
                    to: CONTRACTS.MyTokenV2 as AddressType,
                    data: approveData,
                    value: '0x0'
                },
                {
                    to: CONTRACTS.TokenBankV2 as AddressType,
                    data: depositData,
                    value: '0x0'
                }
            ];

            setStatus('Requesting EIP-5792 Batch Transaction via MetaMask...');

            // wallet_sendCalls (EIP-5792)
            // MetaMask interprets this and handles the EIP-7702 upgrade internally if needed
            const callId = await provider.request({
                method: 'wallet_sendCalls',
                params: [{
                    version: '2.0.0', // MetaMask requires 2.0.0 strictly
                    chainId: `0x${chainId.toString(16)}`,
                    from: address,
                    calls: calls,
                    // capabilities: { atomicBatch: { supported: true } }, // Old spec
                    // EIP-5792 Atomic Batch validation requires this field at top level
                    atomicRequired: true
                }]
            }) as unknown;

            console.log('Batch Call Response:', callId);
            // Extract identifier properly
            let actualCallId: string;
            if (typeof callId === 'string') {
                actualCallId = callId;
            } else if (callId && typeof callId === 'object' && 'id' in callId) {
                actualCallId = (callId as any).id;
            } else {
                actualCallId = JSON.stringify(callId);
            }

            setStatus(`Batch submitted! Call ID: ${actualCallId.slice(0, 10)}...`);
            setTxHash(actualCallId);

            setStatus('Waiting for confirmation...');
            const result = await waitForCallsConfirmation(actualCallId, provider);

            if (result.success) {
                setStatus('Transaction confirmed successfully!');
                if (result.transactionHash) {
                    setTxHash(result.transactionHash);
                    console.log('Final Tx Hash:', result.transactionHash);
                }
                setDepositAmount('');
                refetchTokenBalance();
                refetchBankBalance();

                // Delayed refetch to ensure indexing
                setTimeout(() => {
                    refetchTokenBalance();
                    refetchBankBalance();
                }, 2000);
            } else {
                setError('Transaction failed or timed out.');
                setStatus('');
            }

        } catch (err: any) {
            console.error('EIP-7702/5792 error:', err);
            // Handle specific errors
            if (err.code === 4001 || err.message?.includes('rejected')) {
                setError('User rejected the request.');
            } else if (err.message?.includes('unsupported') || err.message?.includes('method not found')) {
                setError('Your wallet does not support wallet_sendCalls (EIP-5792) yet. Please update MetaMask.');
            } else {
                setError(err.message || 'Unknown error');
            }
            setStatus('');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isConnected || !address) {
        return (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-gray-700">Wallet Not Connected</h2>
                <p className="mt-2 text-sm text-gray-500">Please connect your MetaMask wallet to continue.</p>
            </div>
        );
    }

    return (
        <div className={`rounded-xl border-2 ${isSepolia ? 'border-purple-400 bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50' : 'border-cyan-400 bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50'} p-6 shadow-lg`}>
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className={`text-xl font-bold ${isSepolia ? 'text-purple-900' : 'text-cyan-900'}`}>
                        {isSepolia ? 'MetaMask 7702 Deposit (Sepolia)' : 'EIP-7702 Deposit (Local)'}
                    </h2>
                    <p className={`mt-1 text-sm ${isSepolia ? 'text-purple-700' : 'text-cyan-700'}`}>
                        {isSepolia ? 'Using wallet_sendCalls (EIP-5792)' : 'Using Local Delegate Contract'}
                    </p>
                    <p className={`mt-1 text-xs ${isSepolia ? 'text-purple-600' : 'text-cyan-600'}`}>
                        Account: <code className={`${isSepolia ? 'bg-purple-100' : 'bg-cyan-100'} px-1 rounded`}>{address.slice(0, 10)}...{address.slice(-8)}</code>
                    </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold text-white shadow bg-gradient-to-r ${isSepolia ? 'from-purple-500 to-indigo-500' : 'from-cyan-500 to-teal-500'}`}>
                    {isSepolia ? 'Sepolia' : 'Anvil'}
                </span>
            </div>

            {/* Balance Display */}
            <div className="mb-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-white/80 p-4 shadow-sm">
                    <h3 className="text-xs font-medium text-gray-500">Wallet Balance</h3>
                    <p className="text-lg font-semibold text-gray-900">
                        {tokenBalance ? formatEther(tokenBalance as bigint) : '0'} {tokenSymbol || 'MTK'}
                    </p>
                </div>
                <div className="rounded-lg bg-white/80 p-4 shadow-sm">
                    <h3 className="text-xs font-medium text-gray-500">Bank Balance</h3>
                    <p className="text-lg font-semibold text-gray-900">
                        {bankBalance ? formatEther(bankBalance as bigint) : '0'} {tokenSymbol || 'MTK'}
                    </p>
                </div>
            </div>

            {/* Deposit Form */}
            <div className="space-y-4">
                <div>
                    <label className={`mb-1 block text-sm font-medium ${isSepolia ? 'text-purple-800' : 'text-cyan-800'}`}>Deposit Amount</label>
                    <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Enter amount to deposit"
                        className={`w-full rounded-lg border bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 ${isSepolia ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-200' : 'border-cyan-300 focus:border-cyan-500 focus:ring-cyan-200'}`}
                        disabled={isProcessing}
                    />
                </div>

                <button
                    onClick={handleEIP7702Deposit}
                    disabled={isProcessing || !depositAmount}
                    className={`w-full rounded-lg px-4 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:shadow-none bg-gradient-to-r ${isSepolia ? 'from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400' : 'from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400'}`}
                >
                    {isProcessing ? status || 'Processing...' : `🚀 7702 Deposit (Popup)`}
                </button>

                {/* Status Messages */}
                {status && !error && (
                    <div className={`rounded-lg p-3 text-sm ${status.toLowerCase().includes('success') || status.toLowerCase().includes('confirmed')
                        ? 'bg-green-100 text-green-800'
                        : (isSepolia ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800')
                        }`}>
                        <span className={`mr-2 ${status.toLowerCase().includes('success') || status.toLowerCase().includes('confirmed') ? '' : 'animate-pulse'
                            }`}>
                            {status.toLowerCase().includes('success') || status.toLowerCase().includes('confirmed') ? '✅' : '⏳'}
                        </span>
                        {status}
                    </div>
                )}

                {error && (
                    <div className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
                        <span className="mr-2">❌</span>
                        {error}
                    </div>
                )}

                {txHash && (
                    <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800 break-all">
                        <span className="mr-2">✅</span>
                        ID/Hash: {txHash}
                    </div>
                )}

                {/* Debug Info: Hidden */}
            </div>
        </div>
    );
}
