import { ConnectButton } from '@rainbow-me/rainbowkit';
import TokenBankV2 from './components/TokenBankV2';
import EIP7702Deposit from './components/EIP7702Deposit';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 px-6 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">TokenBank</p>
            <h1 className="text-2xl font-semibold text-slate-900">TokenBank V2 Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Manage deposits with EIP-7702 batch support.</p>
          </div>
          <ConnectButton />
        </header>

        <main className="mt-8 flex-1 space-y-8">
          {/* EIP-7702 Deposit Feature */}
          <EIP7702Deposit />

          {/* Original TokenBankV2 Component */}
          <TokenBankV2 />
        </main>
      </div>
    </div>
  );
}

