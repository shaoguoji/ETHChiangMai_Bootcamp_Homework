import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const ENV_PATH = path.join(process.cwd(), '.env');

// Public client for reading data (balance, nonce, etc.)
export const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
});

// Helper to update .env calculation
export function updateEnv(key: string, value: string) {
    let envContent = '';
    if (fs.existsSync(ENV_PATH)) {
        envContent = fs.readFileSync(ENV_PATH, 'utf8');
    }

    const lines = envContent.split('\n');
    let found = false;
    const newLines = lines.map(line => {
        if (line.startsWith(`${key}=`)) {
            found = true;
            return `${key}=${value}`;
        }
        return line;
    });

    if (!found) {
        newLines.push(`${key}=${value}`);
    }

    // Filter empty lines to keep it clean
    const finalContent = newLines.filter(line => line.trim() !== '').join('\n');
    fs.writeFileSync(ENV_PATH, finalContent + '\n');

    // Update process.env for current session
    process.env[key] = value;
}

export function savePrivateKey(privateKey: string) {
    updateEnv('PRIVATE_KEY', privateKey);
    if (!process.env.RPC_URL) {
        updateEnv('RPC_URL', 'https://ethereum-sepolia-rpc.publicnode.com');
    }
}

export function loadPrivateKey(): string | undefined {
    return process.env.PRIVATE_KEY;
}

export function saveTokenAddress(address: string) {
    updateEnv('TOKEN_ADDRESS', address);
}

export function loadTokenAddress(): string | undefined {
    return process.env.TOKEN_ADDRESS;
}
