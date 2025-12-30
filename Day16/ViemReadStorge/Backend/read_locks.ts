import { createPublicClient, http, hexToBigInt, keccak256, encodePacked, toHex, Address, Hex } from 'viem';
import { foundry } from 'viem/chains';

// Configuration
const RPC_URL = 'http://127.0.0.1:8545';
const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Deployed address from logs
const LOCKS_SLOT = 0n; // _locks is at slot 0

// Slot layout for LockInfo struct:
// Slot N   : [padding: 4 bytes][startTime: 8 bytes][user: 20 bytes]
// Slot N+1 : [amount: 32 bytes]

async function main() {
    const client = createPublicClient({
        chain: foundry,
        transport: http(RPC_URL),
    });

    console.log(`Reading storage from contract: ${CONTRACT_ADDRESS}`);

    // 1. Get Array Length from Slot 0
    const lengthHex = await client.getStorageAt({
        address: CONTRACT_ADDRESS,
        slot: toHex(LOCKS_SLOT),
    });

    if (!lengthHex) {
        console.error('Could not read array length.');
        return;
    }

    const length = hexToBigInt(lengthHex);
    console.log(`Array length: ${length}`);

    if (length === 0n) {
        console.log('Array is empty.');
        return;
    }

    // 2. Calculate Base Slot for Array Data
    // keccak256(slot)
    const baseSlotHash = keccak256(encodePacked(['uint256'], [LOCKS_SLOT]));
    const baseSlot = hexToBigInt(baseSlotHash);

    // 3. Iterate and Read Each Element
    for (let i = 0n; i < length; i++) {
        const elementStartSlot = baseSlot + (i * 2n);

        // Read Slot 0 of the element (User + StartTime)
        const slot0Hex = await client.getStorageAt({
            address: CONTRACT_ADDRESS,
            slot: toHex(elementStartSlot),
        });

        // Read Slot 1 of the element (Amount)
        const slot1Hex = await client.getStorageAt({
            address: CONTRACT_ADDRESS,
            slot: toHex(elementStartSlot + 1n),
        });

        if (!slot0Hex || !slot1Hex) {
            console.error(`Failed to read data for index ${i}`);
            continue;
        }

        // Parse Slot 0 (Packed)
        // Data is right-aligned: [startTime (8 bytes)][user (20 bytes)]
        // user mask: 160 bits
        const slot0Val = hexToBigInt(slot0Hex);

        const userMask = (1n << 160n) - 1n;
        const userInt = slot0Val & userMask;
        const userAddress = '0x' + userInt.toString(16).padStart(40, '0');

        const startTime = (slot0Val >> 160n) & ((1n << 64n) - 1n);

        // Parse Slot 1 (Amount)
        const amount = hexToBigInt(slot1Hex);

        // Print formatted output
        // locks[0]: user:…… ,startTime:……,amount:……
        console.log(`locks[${i}]: user:${userAddress} ,startTime:${startTime},amount:${amount}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
