import { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, usePublicClient, useChainId } from 'wagmi';
import { formatEther, parseEther, encodeFunctionData, type Hex, createWalletClient, http, encodeAbiParameters } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { getContractsByChainId, CHAIN_IDS } from '../constants/addresses';
import { TOKEN_BANK_V2_ABI, HOOKERC20_ABI, DELEGATE_ABI } from '../constants/abis';

type AddressType = `0x${string}`;

// Get chain config for wallet client
const getChainConfig = (chainId: number) => {
    if (chainId === CHAIN_IDS.SEPOLIA) {
        return {
            id: 11155111,
            name: 'Sepolia',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: ['https://ethereum-sepolia.publicnode.com'] } },
        };
    }
    return {
        id: 31337,
        name: 'Anvil',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
    };
};

export default function EIP7702Deposit() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const chainId = useChainId();

    // Get contracts based on current chain
    const CONTRACTS = useMemo(() => getContractsByChainId(chainId), [chainId]);
    const isSepolia = chainId === CHAIN_IDS.SEPOLIA;

    const [depositAmount, setDepositAmount] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [txHash, setTxHash] = useState<Hex | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');

    // Check if private key is available
    const privateKey = import.meta.env.VITE_PRIVATE_KEY as Hex | undefined;
    const hasPrivateKey = privateKey && privateKey.startsWith('0x') && privateKey.length === 66;

    // Create local account from private key
    const localAccount = useMemo(() => {
        if (hasPrivateKey && privateKey) {
            try {
                return privateKeyToAccount(privateKey);
            } catch {
                return null;
            }
        }
        return null;
    }, [privateKey, hasPrivateKey]);

    // Read token balance (use local account address if available, otherwise connected wallet)
    const accountAddress = localAccount?.address || address;

    const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
        address: CONTRACTS.MyTokenV2 as AddressType,
        abi: HOOKERC20_ABI,
        functionName: 'balanceOf',
        args: accountAddress ? [accountAddress] : undefined,
    });

    // Read bank balance
    const { data: bankBalance, refetch: refetchBankBalance } = useReadContract({
        address: CONTRACTS.TokenBankV2 as AddressType,
        abi: TOKEN_BANK_V2_ABI,
        functionName: 'amountsOf',
        args: accountAddress ? [accountAddress] : undefined,
    });

    // Read token symbol
    const { data: tokenSymbol } = useReadContract({
        address: CONTRACTS.MyTokenV2 as AddressType,
        abi: HOOKERC20_ABI,
        functionName: 'symbol',
        args: [],
    });

    // Refetch balances when transaction succeeds
    useEffect(() => {
        if (txHash) {
            const timer = setTimeout(() => {
                refetchTokenBalance();
                refetchBankBalance();
            }, 5000); // 5s for Sepolia mainly
            return () => clearTimeout(timer);
        }
    }, [txHash, refetchTokenBalance, refetchBankBalance]);

    const handleEIP7702Deposit = async () => {
        if (!depositAmount || !publicClient) {
            setError('Please enter amount');
            return;
        }

        if (!localAccount) {
            setError('Private key not configured. Set VITE_PRIVATE_KEY in .env file.');
            return;
        }

        const delegateAddress = CONTRACTS.Delegate;
        if (!delegateAddress || delegateAddress.length < 42) {
            setError('Delegate contract not configured.');
            return;
        }

        setIsProcessing(true);
        setError(null);
        setTxHash(null);

        try {
            const amount = parseEther(depositAmount);
            const chainConfig = getChainConfig(chainId);

            // Create wallet client with local account
            const walletClient = createWalletClient({
                account: localAccount,
                chain: chainConfig,
                transport: http(),
            });

            // Step 1: Sign EIP-7702 authorization
            setStatus('Signing EIP-7702 authorization...');

            const authorization = await walletClient.signAuthorization({
                contractAddress: delegateAddress as AddressType,
                executor: 'self',
            });

            // Step 2: Prepare calls
            setStatus('Preparing batch transaction...');

            const approveData = encodeFunctionData({
                abi: HOOKERC20_ABI,
                functionName: 'approve',
                args: [CONTRACTS.TokenBankV2 as AddressType, amount],
            });

            const depositData = encodeFunctionData({
                abi: TOKEN_BANK_V2_ABI,
                functionName: 'deposit',
                args: [amount],
            });

            let executeCallData: Hex;

            // Step 3: Construct Transaction Data based on Network
            if (isSepolia) {
                // SEPOLIA: MetaMask EIP-7702 Delegator (ERC-7579)
                console.log("Encoding for MetaMask Delegator (Sepolia)...");

                // ERC-7579 Batch Mode: CallType(0x01) + ExecType(0x00) + Unused(4 bytes) + Payload(22 bytes)
                // Mode = 0x0100000000000000000000000000000000000000000000000000000000000000
                const mode = '0x0100000000000000000000000000000000000000000000000000000000000000';

                // Encode Execution[] for batch call
                // Execution struct: { target: address, value: uint256, callData: bytes }
                const executionCalldata = encodeAbiParameters(
                    [
                        {
                            components: [
                                { name: 'target', type: 'address' },
                                { name: 'value', type: 'uint256' },
                                { name: 'callData', type: 'bytes' }
                            ],
                            name: 'executions',
                            type: 'tuple[]'
                        }
                    ],
                    [[
                        { target: CONTRACTS.MyTokenV2 as AddressType, value: 0n, callData: approveData },
                        { target: CONTRACTS.TokenBankV2 as AddressType, value: 0n, callData: depositData }
                    ]]
                );

                executeCallData = encodeFunctionData({
                    abi: DELEGATE_ABI,
                    functionName: 'execute',
                    args: [mode, executionCalldata],
                });
            } else {
                // ANVIL: Local Delegate (Simple struct array)
                console.log("Encoding for Local Delegate (Anvil)...");
                executeCallData = encodeFunctionData({
                    abi: DELEGATE_ABI,
                    functionName: 'execute',
                    args: [[
                        { to: CONTRACTS.MyTokenV2 as AddressType, data: approveData, value: 0n },
                        { to: CONTRACTS.TokenBankV2 as AddressType, data: depositData, value: 0n },
                    ]],
                });
            }

            // Step 4: Send transaction
            setStatus('Sending 7702 transaction...');

            const hash = await walletClient.sendTransaction({
                to: localAccount.address, // Execute as self
                data: executeCallData,
                authorizationList: [authorization],
                gas: isSepolia ? 500000n : undefined, // Explicit gas for Sepolia safety too
            });

            setTxHash(hash);
            setStatus('Transaction sent! Waiting for confirmation...');

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            if (receipt.status === 'success') {
                setStatus('Transaction confirmed successfully!');
                setDepositAmount('');
                refetchTokenBalance();
                refetchBankBalance();
            } else {
                setError('Transaction failed');
                setStatus('');
            }
        } catch (err) {
            console.error('EIP-7702 deposit error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
            setStatus('');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!localAccount) {
        return (
            <div className="rounded-xl border border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 px-6 py-12 text-center shadow-sm">
                <h2 className="text-2xl font-semibold text-orange-900">EIP-7702 Deposit</h2>
                <p className="mt-2 text-sm text-orange-700">
                    Private key not configured. Set <code className="bg-orange-100 px-1 rounded">VITE_PRIVATE_KEY</code> in your <code className="bg-orange-100 px-1 rounded">.env</code> file.
                </p>
                <p className="mt-4 text-xs text-orange-600">
                    Example: VITE_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
                </p>
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
                        {isSepolia ? 'Using MetaMask Delegator (ERC-7579)' : 'Using Local Delegate Contract'}
                    </p>
                    <p className={`mt-1 text-xs ${isSepolia ? 'text-purple-600' : 'text-cyan-600'}`}>
                        Account: <code className={`${isSepolia ? 'bg-purple-100' : 'bg-cyan-100'} px-1 rounded`}>{localAccount.address.slice(0, 10)}...{localAccount.address.slice(-8)}</code>
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
                    {isProcessing ? status || 'Processing...' : `🚀 7702 Deposit ${isSepolia ? '(SDK)' : '(Local)'}`}
                </button>

                {/* Status Messages */}
                {status && !error && (
                    <div className={`rounded-lg p-3 text-sm ${isSepolia ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800'}`}>
                        <span className="mr-2 animate-pulse">⏳</span>
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
                    <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800">
                        <span className="mr-2">✅</span>
                        Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </div>
                )}
            </div>
        </div>
    );
}
