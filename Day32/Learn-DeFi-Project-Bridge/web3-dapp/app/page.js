import Link from 'next/link'

export default function Home() {
  return (
    <div className="container py-16">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8">
          <div className="text-6xl mb-6">🌉</div>
          <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            CCIP Bridge
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            使用 Chainlink CCIP 实现 Sepolia ↔ Base Sepolia 安全跨链
          </p>
        </div>

        <div className="grid gap-6 mb-12">
          <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg p-6 text-left">
            <h2 className="text-2xl font-bold mb-4">核心功能</h2>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Sepolia ↔ Base Sepolia 双向跨链</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Burn-Mint 模型确保总供应量恒定</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>实时余额查询和 CCIP Message ID 追踪</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>自动网络切换和 Gas 费用估算</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border p-6 text-left">
            <h2 className="text-xl font-bold mb-3">已部署合约</h2>
            <div className="space-y-2 text-sm">
              <div>
                <div className="font-semibold text-blue-600">Sepolia</div>
                <div className="text-muted-foreground font-mono text-xs break-all">
                  0xDC1D17004a2A724d5aa9f6B428C56814aBD156D9
                </div>
              </div>
              <div>
                <div className="font-semibold text-violet-600">Base Sepolia</div>
                <div className="text-muted-foreground font-mono text-xs break-all">
                  0x431306040c181E768C4301a7bfD4fC6a770E833F
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/bridge"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-4 text-lg font-semibold text-white hover:opacity-90 transition-opacity"
        >
          开始跨链 →
        </Link>

        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            由 <a href="https://chain.link/ccip" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Chainlink CCIP</a> 提供支持
          </p>
        </div>
      </div>
    </div>
  )
}
