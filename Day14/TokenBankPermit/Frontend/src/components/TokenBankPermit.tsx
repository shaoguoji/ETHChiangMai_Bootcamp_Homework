import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData, useChainId } from 'wagmi';
import { formatEther, parseEther, parseSignature, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry, sepolia, localhost } from 'viem/chains';
import { CONTRACTS_V2 } from '../constants/addresses';
import { TOKEN_BANK_ABI, PERMIT_TOKEN_ABI } from '../constants/abis';

const EXPLORER_URL = 'https://sepolia.etherscan.io/tx/';

type AddressType = `0x${string}`;

export default function TokenBankPermit() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const { signTypedDataAsync } = useSignTypedData();

    const [depositAmount, setDepositAmount] = useState('');
    const [permitDepositAmount, setPermitDepositAmount] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');

    // State for Split Flow
    const [signAmount, setSignAmount] = useState('');
    // We keep track of the full context in state for the relayer step
    const [signatureData, setSignatureData] = useState<{ v: number, r: `0x${string}`, s: `0x${string}`, deadline: bigint, value: bigint, owner: AddressType, signature: `0x${string}` } | null>(null);

    const [inputSignature, setInputSignature] = useState('');
    const [relayerStatus, setRelayerStatus] = useState('');
    const [relayerTxHash, setRelayerTxHash] = useState('');

    // Read token balance
    const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
        address: CONTRACTS_V2.MyTokenV2 as AddressType,
        abi: PERMIT_TOKEN_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // Read bank balance
    const { data: bankBalance, refetch: refetchBankBalance } = useReadContract({
        address: CONTRACTS_V2.TokenBankV2 as AddressType,
        abi: TOKEN_BANK_ABI,
        functionName: 'amount',
        args: address ? [address] : undefined,
    });

    // Read allowance
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: CONTRACTS_V2.MyTokenV2 as AddressType,
        abi: PERMIT_TOKEN_ABI,
        functionName: 'allowance',
        args: address ? [address, CONTRACTS_V2.TokenBankV2 as AddressType] : undefined,
    });

    // Read token symbol
    const { data: tokenSymbol } = useReadContract({
        address: CONTRACTS_V2.MyTokenV2 as AddressType,
        abi: PERMIT_TOKEN_ABI,
        functionName: 'symbol',
        args: [],
    });

    // Read nonce for permit
    const { data: nonce, refetch: refetchNonce } = useReadContract({
        address: CONTRACTS_V2.MyTokenV2 as AddressType,
        abi: PERMIT_TOKEN_ABI,
        functionName: 'nonces',
        args: address ? [address] : undefined,
    });

    // Read token name for domain separator
    const { data: tokenName } = useReadContract({
        address: CONTRACTS_V2.MyTokenV2 as AddressType,
        abi: PERMIT_TOKEN_ABI,
        functionName: 'name',
        args: [],
    });

    // Approve transaction
    const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
        hash: approveHash,
    });

    // Deposit transaction (traditional way)
    const { writeContract: deposit, data: depositHash, isPending: isDepositing } = useWriteContract();
    const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
        hash: depositHash,
    });

    // Permit Deposit transaction (Integrated)
    const { writeContract: permitDeposit, data: permitDepositHash, isPending: isPermitDepositing } = useWriteContract();
    const { isLoading: isPermitDepositConfirming, isSuccess: isPermitDepositSuccess } = useWaitForTransactionReceipt({
        hash: permitDepositHash,
    });

    // Withdraw transaction
    const { writeContract: withdraw, data: withdrawHash, isPending: isWithdrawing } = useWriteContract();
    const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } = useWaitForTransactionReceipt({
        hash: withdrawHash,
    });

    // Refetch balances when transactions succeed
    useEffect(() => {
        if (isApproveSuccess) {
            refetchAllowance();
        }
    }, [isApproveSuccess, refetchAllowance]);

    useEffect(() => {
        if (isDepositSuccess || isPermitDepositSuccess || relayerTxHash) {
            refetchTokenBalance();
            refetchBankBalance();
            refetchAllowance();
            refetchNonce();
            setDepositAmount('');
            setPermitDepositAmount('');
            // Optional: Clear signature data after success
            // setSignatureData(null); 
            // setInputSignature('');
        }
    }, [isDepositSuccess, isPermitDepositSuccess, relayerTxHash, refetchTokenBalance, refetchBankBalance, refetchAllowance, refetchNonce]);

    useEffect(() => {
        if (isWithdrawSuccess) {
            refetchTokenBalance();
            refetchBankBalance();
            setWithdrawAmount('');
        }
    }, [isWithdrawSuccess, refetchTokenBalance, refetchBankBalance]);

    const handleApprove = () => {
        if (!depositAmount) return;
        approve({
            address: CONTRACTS_V2.MyTokenV2 as AddressType,
            abi: PERMIT_TOKEN_ABI,
            functionName: 'approve',
            args: [CONTRACTS_V2.TokenBankV2 as AddressType, parseEther(depositAmount)],
        });
    };

    const handleDeposit = () => {
        if (!depositAmount) return;
        deposit({
            address: CONTRACTS_V2.TokenBankV2 as AddressType,
            abi: TOKEN_BANK_ABI,
            functionName: 'deposit',
            args: [parseEther(depositAmount)],
        });
    };

    const getPermitSignature = async (amountStr: string) => {
        if (!amountStr || !tokenName || nonce === undefined) return null;
        const value = parseEther(amountStr);
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

        const domain = {
            name: tokenName as string,
            version: '1',
            chainId: BigInt(chainId),
            verifyingContract: CONTRACTS_V2.MyTokenV2 as AddressType,
        } as const;

        const types = {
            Permit: [
                { name: 'owner', type: 'address' },
                { name: 'spender', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'deadline', type: 'uint256' },
            ],
        } as const;

        const message = {
            owner: address as AddressType,
            spender: CONTRACTS_V2.TokenBankV2 as AddressType,
            value: value,
            nonce: nonce as bigint,
            deadline: deadline,
        } as const;

        const signature = await signTypedDataAsync({
            domain,
            types,
            primaryType: 'Permit',
            message,
        });

        const { v, r, s } = parseSignature(signature);
        return { v: Number(v), r, s, deadline, value, signature, owner: address as AddressType };
    };

    const handlePermitDeposit = async () => {
        try {
            const sigData = await getPermitSignature(permitDepositAmount);
            if (!sigData) return;

            permitDeposit({
                address: CONTRACTS_V2.TokenBankV2 as AddressType,
                abi: TOKEN_BANK_ABI,
                functionName: 'permitDeposit',
                args: [sigData.owner, sigData.value, sigData.deadline, sigData.v, sigData.r, sigData.s],
            });
        } catch (error) {
            console.error("Permit signing or deposit error:", error);
        }
    };

    // Step 1: Sign Permit Only
    const handleSignPermitOnly = async () => {
        try {
            const sigData = await getPermitSignature(signAmount);
            if (sigData) {
                setSignatureData({
                    v: sigData.v,
                    r: sigData.r,
                    s: sigData.s,
                    deadline: sigData.deadline,
                    value: sigData.value,
                    owner: sigData.owner,
                    signature: sigData.signature
                });
                // Auto-fill input for convenience, but user can edit
                setInputSignature(sigData.signature);
            }
        } catch (e) {
            console.error("Signing error:", e);
        }
    };

    // Step 2: Relayer Deposit
    const handleRelayerDeposit = async () => {
        if (!signatureData || !inputSignature) return;
        setRelayerStatus('Processing...');
        setRelayerTxHash('');

        try {
            // Parse the input signature string
            const { v, r, s } = parseSignature(inputSignature as `0x${string}`);

            const relayerPrivateKey = import.meta.env.VITE_RELAYER_PRIVATE_KEY;
            if (!relayerPrivateKey) {
                setRelayerStatus('Error: Relayer Private Key not found in .env');
                return;
            }

            const account = privateKeyToAccount(relayerPrivateKey as `0x${string}`);
            const client = createWalletClient({
                account,
                chain: chainId === 11155111 ? sepolia : (chainId === 31337 ? foundry : localhost),
                transport: http()
            });

            const hash = await client.writeContract({
                address: CONTRACTS_V2.TokenBankV2 as AddressType,
                abi: TOKEN_BANK_ABI,
                functionName: 'permitDeposit',
                args: [
                    signatureData.owner, // Using saved owner from Step 1 state
                    signatureData.value, // Using saved value from Step 1 state
                    signatureData.deadline, // Using saved deadline from Step 1 state
                    Number(v),
                    r,
                    s
                ]
            });

            setRelayerTxHash(hash);
            setRelayerStatus('Success! Transaction sent.');
            // setSignatureData(null); // Keep data visible
        } catch (e) {
            console.error("Relayer error:", e);
            setRelayerStatus('Error: ' + (e as Error).message);
        }
    };

    const handleWithdraw = () => {
        if (!withdrawAmount) return;
        withdraw({
            address: CONTRACTS_V2.TokenBankV2 as AddressType,
            abi: TOKEN_BANK_ABI,
            functionName: 'withdraw',
            args: [parseEther(withdrawAmount)],
        });
    };

    if (!isConnected) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
                <h2 className="text-2xl font-semibold text-slate-900">TokenBank Permit</h2>
                <p className="mt-2 text-sm text-slate-600">Connect your wallet to view balances and manage deposits.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900">TokenBank Permit</h2>
                <p className="mt-2 text-gray-600">Supports Permit (EIP-2612) Deposits</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-1 text-sm text-gray-500">Wallet Token Balance</h3>
                    <p className="text-2xl font-semibold text-gray-900">
                        {tokenBalance ? formatEther(tokenBalance as bigint) : '0'} {tokenSymbol || 'PTOKEN'}
                    </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="mb-1 text-sm text-gray-500">Bank Deposit Balance</h3>
                    <p className="text-2xl font-semibold text-gray-900">
                        {bankBalance ? formatEther(bankBalance as bigint) : '0'} {tokenSymbol || 'PTOKEN'}
                    </p>
                </div>
            </div>

            {(approveHash || depositHash || permitDepositHash || withdrawHash || relayerTxHash) && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-blue-900">Recent Transactions</h3>
                    <div className="space-y-2">
                        {approveHash && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                    Approve: {isApproveConfirming ? 'Confirming...' : isApproveSuccess ? 'Success' : 'Pending'}
                                </span>
                                <a href={`${EXPLORER_URL}${approveHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
                            </div>
                        )}
                        {depositHash && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                    Deposit: {isDepositConfirming ? 'Confirming...' : isDepositSuccess ? 'Success' : 'Pending'}
                                </span>
                                <a href={`${EXPLORER_URL}${depositHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
                            </div>
                        )}
                        {permitDepositHash && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                    Permit Deposit (User): {isPermitDepositConfirming ? 'Confirming...' : isPermitDepositSuccess ? 'Success' : 'Pending'}
                                </span>
                                <a href={`${EXPLORER_URL}${permitDepositHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
                            </div>
                        )}
                        {relayerTxHash && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                    Relayer Deposit: {relayerStatus}
                                </span>
                                <a href={`${EXPLORER_URL}${relayerTxHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
                            </div>
                        )}
                        {withdrawHash && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">
                                    Withdraw: {isWithdrawConfirming ? 'Confirming...' : isWithdrawSuccess ? 'Success' : 'Pending'}
                                </span>
                                <a href={`${EXPLORER_URL}${withdrawHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Relayer Deposit Section */}
            <div className="rounded-lg border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Relayer Deposit (Split Sign/Send)</h2>
                        <p className="mt-1 text-sm text-gray-600">Step 1: Sign Offline. Step 2: Relayer Submits.</p>
                    </div>
                    <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">Advanced</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Step 1: Sign */}
                    <div className="space-y-3 border-r border-indigo-100 pr-4">
                        <h3 className="font-semibold text-indigo-800">Step 1: Sign Permit (Offline)</h3>
                        <input
                            type="number"
                            value={signAmount}
                            onChange={(e) => setSignAmount(e.target.value)}
                            placeholder="Amount to sign"
                            className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm"
                        />
                        <button
                            onClick={handleSignPermitOnly}
                            disabled={!signAmount}
                            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:bg-gray-300"
                        >
                            Sign Permit
                        </button>
                        {signatureData && (
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-600">Generated Signature:</p>
                                <div className="break-all rounded bg-gray-100 p-2 text-[10px] font-mono text-gray-800 border border-gray-200">
                                    {signatureData.signature}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Relayer */}
                    <div className="space-y-3 pl-4">
                        <h3 className="font-semibold text-indigo-800">Step 2: Relayer Deposit</h3>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Signature Input</label>
                            <textarea
                                value={inputSignature}
                                onChange={(e) => setInputSignature(e.target.value)}
                                placeholder="0x..."
                                rows={3}
                                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                            <p>Relayer: Envs VITE_RELAYER_PRIVATE_KEY</p>
                        </div>
                        <button
                            onClick={handleRelayerDeposit}
                            disabled={!inputSignature || !signatureData}
                            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-300"
                        >
                            Execute via Relayer
                        </button>
                        {relayerStatus && <p className="text-xs text-gray-600 mt-1">{relayerStatus}</p>}
                    </div>
                </div>
            </div>

            {/* Integrated Permit Deposit Section */}
            <div className="rounded-lg border border-purple-300 bg-purple-50 p-6 shadow-sm opacity-70">
                <h2 className="text-lg font-semibold text-gray-800">Permit Deposit (Self-Execute)</h2>
                <div className="mt-2 flex gap-2">
                    <input
                        type="number"
                        value={permitDepositAmount}
                        onChange={(e) => setPermitDepositAmount(e.target.value)}
                        placeholder="Amount"
                        className="flex-1 rounded-lg border border-purple-200 px-3 py-2 text-sm"
                    />
                    <button
                        onClick={handlePermitDeposit}
                        disabled={isPermitDepositing || isPermitDepositConfirming || !permitDepositAmount}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:bg-gray-300"
                    >
                        {isPermitDepositing ? 'Processing...' : 'Sign & Send'}
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Traditional Deposit</h2>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Enter amount to deposit"
                        className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        onClick={handleApprove}
                        disabled={isApproving || isApproveConfirming || !depositAmount}
                        className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isApproving || isApproveConfirming ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                        onClick={handleDeposit}
                        disabled={isDepositing || isDepositConfirming || !depositAmount}
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isDepositing || isDepositConfirming ? 'Depositing...' : 'Deposit'}
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">Withdraw Tokens</h2>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Amount</label>
                        <input
                            type="number"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Enter amount to withdraw"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={handleWithdraw}
                        disabled={isWithdrawing || isWithdrawConfirming || !withdrawAmount}
                        className="w-full rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isWithdrawing || isWithdrawConfirming ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                </div>
            </div>
        </div>
    );
}
