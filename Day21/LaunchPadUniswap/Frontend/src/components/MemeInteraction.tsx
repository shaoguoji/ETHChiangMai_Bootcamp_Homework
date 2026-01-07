import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId, useAccount } from 'wagmi';
import { formatEther, parseEther, isAddress } from 'viem';
import { MemeFactoryABI, MemeTokenABI, CONTRACTS } from '../contracts';

export function MemeInteraction() {
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const [tokenAddress, setTokenAddress] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  const factoryAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.MemeFactory;
  const isValidAddress = isAddress(tokenAddress);

  // Read meme info
  const { data: memeInfo, refetch: refetchMemeInfo } = useReadContract({
    address: factoryAddress,
    abi: MemeFactoryABI,
    functionName: 'memeInfos',
    args: isValidAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: isValidAddress && !!factoryAddress },
  });

  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: isValidAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: MemeTokenABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: isValidAddress && !!userAddress },
  });

  // Read token symbol
  const { data: tokenSymbol } = useReadContract({
    address: isValidAddress ? (tokenAddress as `0x${string}`) : undefined,
    abi: MemeTokenABI,
    functionName: 'symbol',
    query: { enabled: isValidAddress },
  });

  // Mint contract write
  const { writeContract: mintWrite, data: mintHash, isPending: mintPending, error: mintError } = useWriteContract();
  const { isLoading: mintConfirming, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  // Buy contract write
  const { writeContract: buyWrite, data: buyHash, isPending: buyPending, error: buyError } = useWriteContract();
  const { isLoading: buyConfirming, isSuccess: buySuccess } = useWaitForTransactionReceipt({ hash: buyHash });

  // Refetch on success
  useEffect(() => {
    if (mintSuccess || buySuccess) {
      refetchMemeInfo();
      refetchBalance();
    }
  }, [mintSuccess, buySuccess, refetchMemeInfo, refetchBalance]);

  const handleMint = () => {
    if (!factoryAddress || !memeInfo) return;
    const price = memeInfo[3]; // price is index 3
    mintWrite({
      address: factoryAddress,
      abi: MemeFactoryABI,
      functionName: 'mintMeme',
      args: [tokenAddress as `0x${string}`],
      value: price,
    });
  };

  const handleBuy = () => {
    if (!factoryAddress || !buyAmount) return;
    buyWrite({
      address: factoryAddress,
      abi: MemeFactoryABI,
      functionName: 'buyMeme',
      args: [tokenAddress as `0x${string}`],
      value: parseEther(buyAmount),
    });
  };

  const isLoading = mintPending || mintConfirming || buyPending || buyConfirming;

  return (
    <div className="bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl p-6 backdrop-blur-sm border border-blue-500/30">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-6">
        💎 Interact with Meme Token
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-600 focus:border-blue-500 focus:outline-none text-white placeholder-gray-500 font-mono text-sm"
          />
        </div>

        {isValidAddress && memeInfo && memeInfo[0] > 0n && (
          <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
            <h3 className="text-lg font-semibold text-cyan-300">{tokenSymbol || 'Token'} Info</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Total Supply:</div>
              <div className="text-white font-mono">{memeInfo[0].toString()}</div>
              <div className="text-gray-400">Current Supply:</div>
              <div className="text-white font-mono">{memeInfo[1].toString()}</div>
              <div className="text-gray-400">Per Mint:</div>
              <div className="text-white font-mono">{memeInfo[2].toString()}</div>
              <div className="text-gray-400">Price:</div>
              <div className="text-green-400 font-mono">{formatEther(memeInfo[3])} ETH</div>
              <div className="text-gray-400">Your Balance:</div>
              <div className="text-yellow-400 font-mono">{tokenBalance?.toString() || '0'}</div>
            </div>
          </div>
        )}

        {isValidAddress && memeInfo && memeInfo[0] > 0n && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mint Section */}
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h4 className="text-md font-semibold text-purple-300 mb-3">🪙 Mint Tokens</h4>
              <p className="text-xs text-gray-400 mb-3">
                Pay {formatEther(memeInfo[3])} ETH to mint {memeInfo[2].toString()} tokens
              </p>
              <button
                onClick={handleMint}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-semibold text-white transition-all duration-300"
              >
                {mintPending ? '⏳ Confirming...' : mintConfirming ? '⛏️ Mining...' : '🪙 Mint'}
              </button>
            </div>

            {/* Buy Section */}
            <div className="bg-gray-800/30 rounded-xl p-4">
              <h4 className="text-md font-semibold text-green-300 mb-3">💸 Buy from Uniswap</h4>
              <input
                type="text"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="ETH amount"
                className="w-full px-3 py-2 bg-gray-700/50 rounded-lg border border-gray-600 focus:border-green-500 focus:outline-none text-white placeholder-gray-500 text-sm mb-3"
              />
              <button
                onClick={handleBuy}
                disabled={isLoading || !buyAmount}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-semibold text-white transition-all duration-300"
              >
                {buyPending ? '⏳ Confirming...' : buyConfirming ? '⛏️ Mining...' : '💸 Buy'}
              </button>
            </div>
          </div>
        )}

        {(mintError || buyError) && (
          <div className="p-3 bg-red-900/50 rounded-lg border border-red-500/50 text-red-300 text-sm">
            Error: {(mintError || buyError)?.message}
          </div>
        )}

        {(mintSuccess || buySuccess) && (
          <div className="p-3 bg-green-900/50 rounded-lg border border-green-500/50 text-green-300 text-sm">
            ✅ Transaction successful!
          </div>
        )}
      </div>
    </div>
  );
}
