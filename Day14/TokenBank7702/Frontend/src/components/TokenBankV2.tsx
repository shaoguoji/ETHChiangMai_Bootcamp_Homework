import { useEffect, useState, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { getContractsByChainId, CHAIN_IDS } from '../constants/addresses';
import { TOKEN_BANK_V2_ABI, HOOKERC20_ABI } from '../constants/abis';

type AddressType = `0x${string}`;

// Explorer URLs by chain
const EXPLORER_URLS: Record<number, string> = {
  [CHAIN_IDS.SEPOLIA]: 'https://sepolia.etherscan.io/tx/',
  [CHAIN_IDS.ANVIL]: '', // No explorer for local
};

export default function TokenBankV2() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get contracts based on current chain
  const CONTRACTS = useMemo(() => getContractsByChainId(chainId), [chainId]);
  const EXPLORER_URL = EXPLORER_URLS[chainId] || '';

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [directDepositAmount, setDirectDepositAmount] = useState('');

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

  // Read allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.MyTokenV2 as AddressType,
    abi: HOOKERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.TokenBankV2 as AddressType] : undefined,
  });

  // Read token symbol
  const { data: tokenSymbol } = useReadContract({
    address: CONTRACTS.MyTokenV2 as AddressType,
    abi: HOOKERC20_ABI,
    functionName: 'symbol',
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

  // Direct deposit via transferWithCallback
  const { writeContract: directDeposit, data: directDepositHash, isPending: isDirectDepositing } = useWriteContract();
  const { isLoading: isDirectDepositConfirming, isSuccess: isDirectDepositSuccess } = useWaitForTransactionReceipt({
    hash: directDepositHash,
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
    if (isDepositSuccess || isDirectDepositSuccess) {
      refetchTokenBalance();
      refetchBankBalance();
      refetchAllowance();
      setDepositAmount('');
      setDirectDepositAmount('');
    }
  }, [isDepositSuccess, isDirectDepositSuccess, refetchTokenBalance, refetchBankBalance, refetchAllowance]);

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
      address: CONTRACTS.MyTokenV2 as AddressType,
      abi: HOOKERC20_ABI,
      functionName: 'approve',
      args: [CONTRACTS.TokenBankV2 as AddressType, parseEther(depositAmount)],
    });
  };

  const handleDeposit = () => {
    if (!depositAmount) return;
    deposit({
      address: CONTRACTS.TokenBankV2 as AddressType,
      abi: TOKEN_BANK_V2_ABI,
      functionName: 'deposit',
      args: [parseEther(depositAmount)],
    });
  };

  const handleDirectDeposit = () => {
    if (!directDepositAmount) return;
    directDeposit({
      address: CONTRACTS.MyTokenV2 as AddressType,
      abi: HOOKERC20_ABI,
      functionName: 'transferWithCallback',
      args: [CONTRACTS.TokenBankV2 as AddressType, parseEther(directDepositAmount), '0x'],
    });
  };

  const handleWithdraw = () => {
    if (!withdrawAmount) return;
    withdraw({
      address: CONTRACTS.TokenBankV2 as AddressType,
      abi: TOKEN_BANK_V2_ABI,
      functionName: 'withdraw',
      args: [parseEther(withdrawAmount)],
    });
  };

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">TokenBank V2</h2>
        <p className="mt-2 text-sm text-slate-600">Connect your wallet to view balances and manage deposits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">TokenBank V2</h2>
        <p className="mt-2 text-gray-600">Enhanced version with transferWithCallback hook support</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm text-gray-500">Wallet Token Balance</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {tokenBalance ? formatEther(tokenBalance as bigint) : '0'} {tokenSymbol || 'MTK'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-sm text-gray-500">Bank Deposit Balance</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {bankBalance ? formatEther(bankBalance as bigint) : '0'} {tokenSymbol || 'MTK'}
          </p>
        </div>
      </div>

      {(approveHash || depositHash || directDepositHash || withdrawHash) && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-blue-900">Recent Transactions</h3>
          <div className="space-y-2">
            {approveHash && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  Approve: {isApproveConfirming ? 'Confirming...' : isApproveSuccess ? 'Success' : 'Pending'}
                </span>
                <a
                  href={`${EXPLORER_URL}${approveHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  View on Etherscan
                </a>
              </div>
            )}
            {depositHash && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  Deposit: {isDepositConfirming ? 'Confirming...' : isDepositSuccess ? 'Success' : 'Pending'}
                </span>
                <a
                  href={`${EXPLORER_URL}${depositHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  View on Etherscan
                </a>
              </div>
            )}
            {directDepositHash && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  Direct Deposit: {isDirectDepositConfirming ? 'Confirming...' : isDirectDepositSuccess ? 'Success' : 'Pending'}
                </span>
                <a
                  href={`${EXPLORER_URL}${directDepositHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  View on Etherscan
                </a>
              </div>
            )}
            {withdrawHash && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  Withdraw: {isWithdrawConfirming ? 'Confirming...' : isWithdrawSuccess ? 'Success' : 'Pending'}
                </span>
                <a
                  href={`${EXPLORER_URL}${withdrawHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  View on Etherscan
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="rounded-lg border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-blue-50 p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Direct Deposit (One-Step)</h2>
            <p className="mt-1 text-sm text-gray-600">Use transferWithCallback - No approve needed!</p>
          </div>
          <span className="rounded-full bg-purple-500 px-3 py-1 text-xs font-semibold text-white">V2 Feature</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-gray-600">Amount</label>
            <input
              type="number"
              value={directDepositAmount}
              onChange={(e) => setDirectDepositAmount(e.target.value)}
              placeholder="Enter amount for direct deposit"
              className="w-full rounded-lg border border-purple-300 bg-white px-4 py-2 text-gray-900 focus:border-purple-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleDirectDeposit}
            disabled={isDirectDepositing || isDirectDepositConfirming || !directDepositAmount}
            className="w-full rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isDirectDepositing || isDirectDepositConfirming ? 'Processing...' : 'Direct Deposit (transferWithCallback)'}
          </button>
          <div className="rounded border border-purple-200 bg-white p-3 text-xs text-gray-600">
            <strong>How it works:</strong> This uses transferWithCallback which automatically calls the TokenBank tokensReceived
            function, completing the deposit in a single transaction without needing separate approve!
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Traditional Deposit (Two-Step)</h2>
          <span className="rounded-full bg-gray-400 px-3 py-1 text-xs font-semibold text-white">V1 Compatible</span>
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
            Current Allowance: {allowance ? formatEther(allowance as bigint) : '0'} {tokenSymbol || 'MTK'}
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
