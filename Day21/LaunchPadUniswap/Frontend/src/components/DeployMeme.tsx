import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useChainId } from 'wagmi';
import { parseEther } from 'viem';
import { MemeFactoryABI, CONTRACTS } from '../contracts';

export function DeployMeme() {
  const chainId = useChainId();
  const [symbol, setSymbol] = useState('');
  const [totalSupply, setTotalSupply] = useState('');
  const [perMint, setPerMint] = useState('');
  const [price, setPrice] = useState('');

  const factoryAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.MemeFactory;

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDeploy = () => {
    if (!factoryAddress) {
      alert('Factory not deployed on this chain');
      return;
    }

    writeContract({
      address: factoryAddress,
      abi: MemeFactoryABI,
      functionName: 'deployMeme',
      args: [
        symbol,
        BigInt(totalSupply),
        BigInt(perMint),
        parseEther(price),
      ],
    });
  };

  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/30">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-6">
        🚀 Deploy New Meme Token
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="PEPE"
            className="w-full px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-600 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Total Supply</label>
          <input
            type="number"
            value={totalSupply}
            onChange={(e) => setTotalSupply(e.target.value)}
            placeholder="1000000"
            className="w-full px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-600 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tokens Per Mint</label>
          <input
            type="number"
            value={perMint}
            onChange={(e) => setPerMint(e.target.value)}
            placeholder="100"
            className="w-full px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-600 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Price per Mint (ETH)</label>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.01"
            className="w-full px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-600 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500"
          />
        </div>

        <button
          onClick={handleDeploy}
          disabled={isPending || isConfirming || !symbol || !totalSupply || !perMint || !price}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-600 disabled:to-gray-600 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isPending ? '⏳ Confirming...' : isConfirming ? '⛏️ Mining...' : '🚀 Deploy Meme Token'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 rounded-lg border border-red-500/50 text-red-300 text-sm">
            Error: {error.message}
          </div>
        )}

        {isSuccess && hash && (
          <div className="mt-4 p-3 bg-green-900/50 rounded-lg border border-green-500/50 text-green-300 text-sm">
            ✅ Token deployed! TX: {hash.slice(0, 10)}...{hash.slice(-8)}
          </div>
        )}
      </div>
    </div>
  );
}
