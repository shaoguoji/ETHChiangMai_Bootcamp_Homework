import { createPublicClient, http, parseAbiItem } from 'viem';
import { sepolia } from 'viem/chains';
import { saveTransfer } from './db';
import dotenv from 'dotenv';

dotenv.config();

const client = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL || 'https://1rpc.io/sepolia'), // Fallback to public RPC
});

const CONTRACT_ADDRESS = '0xb8119Af65964BF83b0c44E8DD07e4bEbD3432d5c';
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

export async function indexTransfers() {
    console.log('Starting indexer...');
    const currentBlock = await client.getBlockNumber();
    const startBlock = currentBlock - 10000n; // Scan last 10000 blocks for demo

    console.log(`Scanning from block ${startBlock} to ${currentBlock}`);

    const logs = await client.getLogs({
        address: CONTRACT_ADDRESS,
        event: TRANSFER_EVENT,
        fromBlock: startBlock,
        toBlock: currentBlock,
    });

    console.log(`Found ${logs.length} transfers`);

    for (const log of logs) {
        const { from, to, value } = log.args;
        if (from && to && value) {
            saveTransfer({
                hash: log.transactionHash,
                from: from,
                to: to,
                value: value.toString(),
                blockNumber: log.blockNumber,
            });
            console.log(`Indexed transfer: ${log.transactionHash}`);
        }
    }
}

export function startIndexer() {
    // Run once on startup
    indexTransfers().catch(console.error);

    // Watch for new events
    client.watchEvent({
        address: CONTRACT_ADDRESS,
        event: TRANSFER_EVENT,
        onLogs: logs => {
            for (const log of logs) {
                const { from, to, value } = log.args;
                if (from && to && value) {
                    saveTransfer({
                        hash: log.transactionHash,
                        from: from,
                        to: to,
                        value: value.toString(),
                        blockNumber: log.blockNumber,
                    });
                    console.log(`Indexed NEW transfer: ${log.transactionHash}`);
                }
            }
        }
    });
}
