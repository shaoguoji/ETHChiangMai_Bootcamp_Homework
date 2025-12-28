import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData, useChainId } from 'wagmi';
import { formatEther, parseEther, parseSignature } from 'viem';
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
        functionName: 'amount', // Function name changed from amountsOf
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

    // Permit Deposit transaction
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
        if (isDepositSuccess || isPermitDepositSuccess) {
            refetchTokenBalance();
            refetchBankBalance();
            refetchAllowance();
            refetchNonce();
            setDepositAmount('');
            setPermitDepositAmount('');
        }
    }, [isDepositSuccess, isPermitDepositSuccess, refetchTokenBalance, refetchBankBalance, refetchAllowance, refetchNonce]);

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

    const handlePermitDeposit = async () => {
        if (!permitDepositAmount || !tokenName || nonce === undefined) return;

        try {
            const value = parseEther(permitDepositAmount);
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

            permitDeposit({
                address: CONTRACTS_V2.TokenBankV2 as AddressType,
                abi: TOKEN_BANK_ABI,
                functionName: 'permitDeposit',
                args: [value, deadline, Number(v), r, s],
            });
        } catch (error) {
            console.error("Permit signing or deposit error:", error);
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

            {(approveHash || depositHash || permitDepositHash || withdrawHash) && (
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
                                    Permit Deposit: {isPermitDepositConfirming ? 'Confirming...' : isPermitDepositSuccess ? 'Success' : 'Pending'}
                                </span>
                                <a href={`${EXPLORER_URL}${permitDepositHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">View</a>
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

            <div className="rounded-lg border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50 p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Permit Deposit (Gasless Auth)</h2>
                        <p className="mt-1 text-sm text-gray-600">Sign offline + Deposit in one txn.</p>
                    </div>
                    <span className="rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white">EIP-2612</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Amount</label>
                        <input
                            type="number"
                            value={permitDepositAmount}
                            onChange={(e) => setPermitDepositAmount(e.target.value)}
                            placeholder="Enter amount for permit deposit"
                            className="w-full rounded-lg border border-purple-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={handlePermitDeposit}
                        disabled={isPermitDepositing || isPermitDepositConfirming || !permitDepositAmount}
                        className="w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {isPermitDepositing || isPermitDepositConfirming ? 'Processing...' : 'Sign & Deposit'}
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Traditional Deposit</h2>
                    <span className="rounded-full bg-gray-400 px-3 py-1 text-xs font-semibold text-white">2 Step</span>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-gray-600">Amount</label>
                        <input
                            type="number"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            placeholder="Enter amount to deposit"
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="text-sm text-gray-600">
                        Current Allowance: {allowance ? formatEther(allowance as bigint) : '0'} {tokenSymbol || 'PTOKEN'}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={handleApprove}
                            disabled={isApproving || isApproveConfirming || !depositAmount}
                            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isApproving || isApproveConfirming ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                            onClick={handleDeposit}
                            disabled={isDepositing || isDepositConfirming || !depositAmount}
                            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isDepositing || isDepositConfirming ? 'Depositing...' : 'Deposit'}
                        </button>
                    </div>
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
