import { createPublicClient, http, parseAbiItem, webSocket, decodeFunctionData, parseAbi } from 'viem';
import { sepolia } from 'viem/chains';
import { saveTransfer } from './db';
import dotenv from 'dotenv';

dotenv.config();

const client = createPublicClient({
    chain: sepolia,
    transport: webSocket(process.env.RPC_URL || 'wss://ethereum-sepolia-rpc.publicnode.com'), // Fallback to public RPC
});

// const CONTRACT_ADDRESS = '0xb8119Af65964BF83b0c44E8DD07e4bEbD3432d5c';
// const CONTRACT_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984';  // ERC-20: Uniswap (UNI)
const CONTRACT_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';  // ERC-20: USDC (USDC)
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
            console.log(`Indexed transfer: ${log.transactionHash}, amount: ${Number(value) / 1e6} USDC`);
        }
    }
}


export function startIndexer() {
    // Run once on startup (historical data)
    // indexTransfers().catch(console.error);

    const TRANSFER_ABI = parseAbi(['function transfer(address to, uint256 value)']);

    // Watch for new pending transactions
    client.watchPendingTransactions({
        onTransactions: async (hashes) => {
            for (const hash of hashes) {
                try {
                    const tx = await client.getTransaction({ hash });

                    // Check if interaction is with our target contract
                    if (tx.to && tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {

                        // Decode input data to see if it is a transfer
                        try {
                            const { args } = decodeFunctionData({
                                abi: TRANSFER_ABI,
                                data: tx.input,
                            });

                            const [to, value] = args;

                            console.log(`Pending Transfer found: ${hash}`);
                            console.log(`From: ${tx.from}, To: ${to}, Value: ${Number(value) / 1e6} USDC`);

                            saveTransfer({
                                hash: hash,
                                from: tx.from,
                                to: to,
                                value: value.toString(),
                                blockNumber: 0n, // Pending transactions have no block number
                            });

                        } catch (err) {
                            // Not a transfer function call, ignore
                        }
                    }
                } catch (error) {
                    // Transaction might disappear or fail to fetch
                    // console.debug(`Failed to fetch tx ${hash}`, error);
                }
            }
        },
    });
}
