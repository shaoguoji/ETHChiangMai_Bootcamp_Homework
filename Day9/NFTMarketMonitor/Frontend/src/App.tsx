import { useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useWatchContractEvent } from 'wagmi';
import ABI from './NFTMarketABI.json';
import './App.css'

const NFT_MARKET_ADDRESS = import.meta.env.VITE_NFT_MARKET_ADDRESS as `0x${string}`;

type LogEntry = {
  type: 'List' | 'Buy';
  message: string;
  timestamp: string;
  hash?: string;
}

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Listen for List events
  useWatchContractEvent({
    address: NFT_MARKET_ADDRESS,
    abi: ABI,
    eventName: 'logList',
    onLogs(events) {
      console.log('List events:', events);
      events.forEach(event => {
        // @ts-ignore
        const { saler, tokenId, price } = event.args;
        const newLog: LogEntry = {
          type: 'List',
          message: `New Listing! Seller: ${saler}, TokenID: ${tokenId?.toString()}, Price: ${price?.toString()}`,
          timestamp: new Date().toLocaleTimeString(),
          hash: event.transactionHash
        };
        setLogs(prev => [newLog, ...prev]);
      });
    },
    poll: true,
  });

  // Listen for Buy events
  useWatchContractEvent({
    address: NFT_MARKET_ADDRESS,
    abi: ABI,
    eventName: 'logBuy',
    onLogs(events) {
      console.log('Buy events:', events);
      events.forEach(event => {
        // @ts-ignore
        const { buyer, tokenId, price } = event.args;
        const newLog: LogEntry = {
          type: 'Buy',
          message: `NFT Sold! Buyer: ${buyer}, TokenID: ${tokenId?.toString()}, Price: ${price?.toString()}`,
          timestamp: new Date().toLocaleTimeString(),
          hash: event.transactionHash
        };
        setLogs(prev => [newLog, ...prev]);
      });
    },
    poll: true,
  });

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
        <h1>NFT Market Monitor</h1>
        <ConnectButton />
      </header>

      <main style={{ padding: '1rem' }}>
        <div className="status-card">
          <p>Listening to contract: {NFT_MARKET_ADDRESS}</p>
        </div>

        <div className="logs-container" style={{ marginTop: '2rem' }}>
          <h2>Live Event Logs</h2>
          {logs.length === 0 ? (
            <p>No events detected yet. Waiting for activity...</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {logs.map((log, index) => (
                <li key={index} style={{
                  padding: '1rem',
                  margin: '0.5rem 0',
                  backgroundColor: log.type === 'List' ? '#e3f2fd' : '#e8f5e9',
                  borderRadius: '8px',
                  border: '1px solid #ccc'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 'bold', color: log.type === 'List' ? '#1976d2' : '#2e7d32' }}>
                      {log.type.toUpperCase()}
                    </span>
                    <span style={{ color: '#666' }}>{log.timestamp}</span>
                  </div>
                  <div>{log.message}</div>
                  {log.hash && <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.25rem' }}>Hash: {log.hash}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
