import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const WALLET_FILE = path.join(DATA_DIR, 'wallets.json');

export interface Account {
    address: string;
    path?: string;      // HD Derivation path
    privateKey?: string; // Standard private key
    name: string;
}

export interface Wallet {
    id: string;
    type: 'hd' | 'simple';
    mnemonic?: string;
    accounts: Account[];
    name: string;
}

export interface StorageData {
    activeWalletId?: string;
    activeAccountAddress?: string;
    wallets: Wallet[];
}

function initStore() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(WALLET_FILE)) {
        const initialData: StorageData = { wallets: [] };
        fs.writeFileSync(WALLET_FILE, JSON.stringify(initialData, null, 2));
    }
}

export function loadStore(): StorageData {
    initStore();
    const data = fs.readFileSync(WALLET_FILE, 'utf8');
    return JSON.parse(data);
}

export function saveStore(data: StorageData) {
    initStore();
    fs.writeFileSync(WALLET_FILE, JSON.stringify(data, null, 2));
}
