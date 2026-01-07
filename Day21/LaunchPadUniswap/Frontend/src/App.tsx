import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { DeployMeme } from './components/DeployMeme';
import { DeployedMemeList } from './components/DeployedMemeList';
import { CONTRACTS } from './contracts';

function App() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const factoryAddress = CONTRACTS[chainId as keyof typeof CONTRACTS]?.MemeFactory;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <header className="border-b border-purple-500/20 backdrop-blur-sm bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
              Meme Launchpad
            </h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🎮</div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to Meme Launchpad</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to deploy, mint, and trade meme tokens!</p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-2xl p-4 border border-yellow-500/30">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-yellow-200 font-medium">
                    Factory: <span className="font-mono text-sm">{factoryAddress || 'Not deployed'}</span>
                  </p>
                  <p className="text-yellow-400/70 text-sm">
                    5% of mint fees go to Uniswap liquidity!
                  </p>
                </div>
              </div>
            </div>

            {/* Deploy Section */}
            <DeployMeme />

            {/* Deployed Memes List with Interactions */}
            <DeployedMemeList />

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl mb-3">🏭</div>
                <h3 className="text-lg font-semibold text-white mb-2">Deploy Tokens</h3>
                <p className="text-gray-400 text-sm">Create your own meme token with custom supply and mint price.</p>
              </div>
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl mb-3">🪙</div>
                <h3 className="text-lg font-semibold text-white mb-2">Fair Mint</h3>
                <p className="text-gray-400 text-sm">5% of mint fees automatically add liquidity to Uniswap V2.</p>
              </div>
              <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
                <div className="text-3xl mb-3">💱</div>
                <h3 className="text-lg font-semibold text-white mb-2">Smart Buy</h3>
                <p className="text-gray-400 text-sm">Compare mint vs Uniswap prices and buy at the best rate.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          Built with ❤️ for ETH Chiang Mai Bootcamp
        </div>
      </footer>
    </div>
  );
}

export default App;
