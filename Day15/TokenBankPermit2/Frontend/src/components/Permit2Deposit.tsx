import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSignTypedData } from 'wagmi';
import { parseEther, formatEther, maxUint256 } from 'viem';
import { CONTRACTS_V2 } from '../constants/addresses';
import { HOOKERC20_ABI, TOKEN_BANK_V2_ABI } from '../constants/abis';

type AddressType = `0x${string}`;

interface Permit2DepositProps {
    onSuccess?: () => void;
}

export default function Permit2Deposit({ onSuccess }: Permit2DepositProps) {
    const { address, chainId } = useAccount();
    const [amount, setAmount] = useState('');
    const { signTypedDataAsync } = useSignTypedData();

    // Read allowance for Permit2
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: CONTRACTS_V2.MyTokenV2 as AddressType,
        abi: HOOKERC20_ABI,
        functionName: 'allowance',
        args: address ? [address, CONTRACTS_V2.Permit2 as AddressType] : undefined,
    });

    // Approve Permit2
    const { writeContract: approve, data: approveHash, isPending: isApproving } = useWriteContract();
    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
        hash: approveHash,
    });

    // Deposit with Permit2
    const { writeContract: deposit, data: depositHash, isPending: isDepositing, error: depositError } = useWriteContract();
    const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
        hash: depositHash,
    });

    useEffect(() => {
        if (isApproveSuccess) {
            refetchAllowance();
        }
    }, [isApproveSuccess, refetchAllowance]);

    useEffect(() => {
        if (isDepositSuccess) {
            setAmount('');
            if (onSuccess) {
                onSuccess();
            }
        }
    }, [isDepositSuccess, onSuccess]);

    const handleApprove = () => {
        approve({
            address: CONTRACTS_V2.MyTokenV2 as AddressType,
            abi: HOOKERC20_ABI,
            functionName: 'approve',
            args: [CONTRACTS_V2.Permit2 as AddressType, maxUint256],
        });
    };




    const handleDeposit = async () => {
        if (!amount || !address) return;

        try {
            const depositAmount = parseEther(amount);
            const nonce = BigInt(Math.floor(Math.random() * 1000000000)); // Random nonce for simplicty in demo
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now

            // EIP-712 Typed Data
            const domain = {
                name: 'Permit2',
                version: '1',
                chainId: chainId,
                verifyingContract: CONTRACTS_V2.Permit2 as AddressType,
            } as const;

            const types = {
                TokenPermissions: [
                    { name: 'token', type: 'address' },
                    { name: 'amount', type: 'uint256' },
                ],
                PermitTransferFrom: [
                    { name: 'permitted', type: 'TokenPermissions' },
                    { name: 'spender', type: 'address' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                ],
            } as const;

            const value = {
                permitted: {
                    token: CONTRACTS_V2.MyTokenV2 as AddressType,
                    amount: depositAmount,
                },
                spender: CONTRACTS_V2.TokenBankV2 as AddressType,
                nonce: nonce,
                deadline: deadline,
            } as const;

            const signature = await signTypedDataAsync({
                domain,
                types,
                primaryType: 'PermitTransferFrom',
                message: value,
            });

            console.log('Signature:', signature);

            deposit({
                address: CONTRACTS_V2.TokenBankV2 as AddressType,
                abi: TOKEN_BANK_V2_ABI,
                functionName: 'depositWithPermit2',
                args: [depositAmount, nonce, deadline, signature],
            });

        } catch (err) {
            console.error('Error signing or depositing:', err);
        }
    };

    return (
        <div className="rounded-lg border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 shadow-sm">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Deposit with Permit2</h2>
                    <p className="mt-1 text-sm text-gray-600">Sign a permit offline and deposit in one tx (after initial approval to Permit2).</p>
                </div>
                <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white">Permit2</span>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm text-gray-600">Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full rounded-lg border border-indigo-300 bg-white px-4 py-2 text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="text-sm text-gray-600">
                    Permit2 Allowance: {allowance ? formatEther(allowance as bigint) : '0'}
                </div>

                <div className="flex gap-4">
                    {/* Show Approve button only if allowance is insufficient */}
                    {(!allowance || allowance < (amount ? parseEther(amount) : 0n)) ? (
                        <button
                            onClick={handleApprove}
                            disabled={isApproving || isApproveConfirming}
                            className="flex-1 rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isApproving || isApproveConfirming ? 'Approving (Infinite)...' : 'Approve Permit2 (Infinite)'}
                        </button>
                    ) : (
                        <button
                            onClick={handleDeposit}
                            disabled={isDepositing || isDepositConfirming || !amount}
                            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isDepositing || isDepositConfirming ? 'Sign & Deposit' : 'Sign & Deposit'}
                        </button>
                    )}
                </div>

                {depositHash && (
                    <div className="text-sm text-green-600 truncate">
                        Tx: {depositHash}
                    </div>
                )}
                {depositError && (
                    <div className="text-sm text-red-600 break-words">
                        Error: {depositError.message}
                    </div>
                )}
            </div>
        </div>
    );
}
