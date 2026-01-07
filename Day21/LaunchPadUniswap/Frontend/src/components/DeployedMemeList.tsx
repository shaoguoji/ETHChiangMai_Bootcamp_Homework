import { useState, useEffect } from 'react';
import { useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { MemeFactoryABI, MemeTokenABI, UniswapRouterABI, CONTRACTS, UNISWAP_ROUTER } from '../contracts';

export function DeployedMemeList() {
  const chainId = useChainId();
  const { address: userAddress } = useAccount();
  const [selectedMeme, setSelectedMeme] = useState<`0x${string}` | null>(null);
  const [buyAmount, setBuyAmount] = useState('');

  const factoryAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.MemeFactory;
  const routerAddress = UNISWAP_ROUTER[chainId as keyof typeof UNISWAP_ROUTER];

  // Get WETH address from router
  const { data: wethAddress } = useReadContract({
    address: routerAddress,
    abi: UniswapRouterABI,
    functionName: 'WETH',
    query: { enabled: !!routerAddress },
  });

  // Fetch deployed memes from contract
  const { data: deployedMemes, refetch: refetchMemes } = useReadContract({
    address: factoryAddress,
    abi: MemeFactoryABI,
    functionName: 'getDeployedMemes',
    query: { enabled: !!factoryAddress },
  });

  // Read meme info for selected meme
  const { data: memeInfo, refetch: refetchMemeInfo } = useReadContract({
    address: factoryAddress,
    abi: MemeFactoryABI,
    functionName: 'memeInfos',
    args: selectedMeme ? [selectedMeme] : undefined,
    query: { enabled: !!selectedMeme },
  });

  // Read token symbol
  const { data: tokenSymbol } = useReadContract({
    address: selectedMeme || undefined,
    abi: MemeTokenABI,
    functionName: 'symbol',
    query: { enabled: !!selectedMeme },
  });

  // Read token balance
  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: selectedMeme || undefined,
    abi: MemeTokenABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!selectedMeme && !!userAddress },
  });

  // Get Uniswap price (how many tokens for 1 ETH)
  const { data: uniswapPrice, error: priceError } = useReadContract({
    address: routerAddress,
    abi: UniswapRouterABI,
    functionName: 'getAmountsOut',
    args: selectedMeme && wethAddress ? [parseEther('0.001'), [wethAddress, selectedMeme]] : undefined,
    query: { enabled: !!selectedMeme && !!wethAddress && !!routerAddress },
  });

  // Mint
  const { writeContract: mintWrite, data: mintHash, isPending: mintPending, error: mintError, reset: resetMint } = useWriteContract();
  const { isLoading: mintConfirming, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  // Buy
  const { writeContract: buyWrite, data: buyHash, isPending: buyPending, error: buyError, reset: resetBuy } = useWriteContract();
  const { isLoading: buyConfirming, isSuccess: buySuccess } = useWaitForTransactionReceipt({ hash: buyHash });

  useEffect(() => {
    if (mintSuccess || buySuccess) {
      refetchBalance();
      refetchMemeInfo();
      refetchMemes();
    }
  }, [mintSuccess, buySuccess, refetchBalance, refetchMemeInfo, refetchMemes]);

  const handleMint = () => {
    if (!factoryAddress || !selectedMeme || !memeInfo) return;
    resetMint();
    mintWrite({
      address: factoryAddress,
      abi: MemeFactoryABI,
      functionName: 'mintMeme',
      args: [selectedMeme],
      value: memeInfo[3],
    });
  };

  const handleBuy = () => {
    if (!factoryAddress || !selectedMeme || !buyAmount) return;
    resetBuy();
    buyWrite({
      address: factoryAddress,
      abi: MemeFactoryABI,
      functionName: 'buyMeme',
      args: [selectedMeme],
      value: parseEther(buyAmount),
    });
  };

  const isLoading = mintPending || mintConfirming || buyPending || buyConfirming;

  // Calculate prices
  const mintPricePerToken = memeInfo ? Number(formatEther(memeInfo[3])) / Number(memeInfo[2]) : 0;
  
  // Uniswap price: if we send 0.001 ETH, we get uniswapPrice[1] tokens
  // Price per token = 0.001 / uniswapPrice[1]
  const uniswapTokensFor001ETH = uniswapPrice && uniswapPrice[1] ? Number(uniswapPrice[1]) : 0;
  const uniswapPricePerToken = uniswapTokensFor001ETH > 0 ? 0.001 / uniswapTokensFor001ETH : null;
  const isBuyBetter = uniswapPricePerToken !== null && uniswapPricePerToken < mintPricePerToken;

  return (
    <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-2xl p-6 backdrop-blur-sm border border-emerald-500/30">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
          📋 Deployed Meme Tokens
        </h2>
        <button
          onClick={() => refetchMemes()}
          className="px-3 py-1 text-sm bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-gray-300"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Debug Info */}
      {selectedMeme && (
        <div className="mb-4 p-2 bg-gray-900/50 rounded text-xs text-gray-500">
          WETH: {wethAddress || 'loading...'} | Router: {routerAddress}
          {priceError && <div className="text-red-400">Price Error: {priceError.message}</div>}
        </div>
      )}

      {!deployedMemes || deployedMemes.length === 0 ? (
        <div className="text-gray-400 text-center py-8">No meme tokens deployed yet.</div>
      ) : (
        <div className="space-y-4">
          {/* Meme List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
            {deployedMemes.map((meme) => (
              <button
                key={meme}
                onClick={() => setSelectedMeme(meme)}
                className={`p-3 rounded-xl border transition-all text-left ${
                  selectedMeme === meme
                    ? 'bg-emerald-600/30 border-emerald-500'
                    : 'bg-gray-800/30 border-gray-700 hover:border-emerald-500/50'
                }`}
              >
                <div className="text-xs text-gray-400 font-mono truncate">{meme}</div>
              </button>
            ))}
          </div>

          {/* Selected Meme Details */}
          {selectedMeme && memeInfo && memeInfo[0] > 0n && (
            <div className="mt-6 space-y-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-teal-300 mb-3">{tokenSymbol || 'Token'} Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Address:</div>
                  <div className="text-white font-mono text-xs truncate">{selectedMeme}</div>
                  <div className="text-gray-400">Total Supply:</div>
                  <div className="text-white font-mono">{memeInfo[0].toString()}</div>
                  <div className="text-gray-400">Minted:</div>
                  <div className="text-white font-mono">{memeInfo[1].toString()}</div>
                  <div className="text-gray-400">Per Mint:</div>
                  <div className="text-white font-mono">{memeInfo[2].toString()}</div>
                  <div className="text-gray-400">Mint Price:</div>
                  <div className="text-green-400 font-mono">{formatEther(memeInfo[3])} ETH</div>
                  <div className="text-gray-400">Your Balance:</div>
                  <div className="text-yellow-400 font-mono">{tokenBalance?.toString() || '0'}</div>
                </div>
              </div>

              {/* Price Comparison */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-md font-semibold text-cyan-300 mb-3">💰 Price Comparison</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 rounded-lg bg-purple-900/30 border border-purple-500/30">
                    <div className="text-gray-400 text-xs mb-1">Mint Price</div>
                    <div className="text-purple-300 font-mono">{mintPricePerToken.toFixed(8)} ETH/token</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isBuyBetter ? 'bg-green-900/30 border-green-500/30' : 'bg-gray-700/30 border-gray-600/30'} border`}>
                    <div className="text-gray-400 text-xs mb-1">Uniswap Price {isBuyBetter && '✨'}</div>
                    <div className={`font-mono ${isBuyBetter ? 'text-green-300' : 'text-gray-400'}`}>
                      {uniswapPricePerToken !== null ? `${uniswapPricePerToken.toFixed(8)} ETH/token` : 'No liquidity'}
                    </div>
                  </div>
                </div>
                {isBuyBetter && (
                  <div className="mt-2 text-xs text-green-400">💡 Uniswap is cheaper! Consider buying instead of minting.</div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <h4 className="text-md font-semibold text-purple-300 mb-3">🪙 Mint</h4>
                  <p className="text-xs text-gray-400 mb-3">Pay {formatEther(memeInfo[3])} ETH for {memeInfo[2].toString()} tokens</p>
                  <button
                    onClick={handleMint}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-semibold text-white transition-all"
                  >
                    {mintPending ? '⏳...' : mintConfirming ? '⛏️...' : '🪙 Mint'}
                  </button>
                </div>

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
                    disabled={isLoading || !buyAmount || uniswapPricePerToken === null}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-semibold text-white transition-all"
                  >
                    {buyPending ? '⏳...' : buyConfirming ? '⛏️...' : '💸 Buy'}
                  </button>
                </div>
              </div>

              {/* Errors/Success */}
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
          )}
        </div>
      )}
    </div>
  );
}
