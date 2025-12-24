"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHDWallet = createHDWallet;
exports.importMnemonic = importMnemonic;
exports.deriveNewAccount = deriveNewAccount;
exports.importPrivateKey = importPrivateKey;
exports.importKeystore = importKeystore;
exports.exportKeystore = exportKeystore;
exports.getActiveWallet = getActiveWallet;
exports.getActiveAccount = getActiveAccount;
exports.getActiveViemAccount = getActiveViemAccount;
const accounts_1 = require("viem/accounts");
const accounts_2 = require("viem/accounts");
const store_1 = require("./store");
const ethers_1 = require("ethers");
const uuid_1 = require("uuid");
// --- Wallet ---
async function createHDWallet(name) {
    const mnemonic = (0, accounts_1.generateMnemonic)(accounts_1.english);
    const store = (0, store_1.loadStore)();
    const newWallet = {
        id: (0, uuid_1.v4)(),
        type: 'hd',
        name,
        mnemonic,
        accounts: []
    };
    // Derive first account
    const account = (0, accounts_1.mnemonicToAccount)(mnemonic, { accountIndex: 0 });
    newWallet.accounts.push({
        address: account.address,
        path: "m/44'/60'/0'/0/0",
        name: 'Account 1'
    });
    store.wallets.push(newWallet);
    store.activeWalletId = newWallet.id;
    store.activeAccountAddress = account.address;
    (0, store_1.saveStore)(store);
    return { mnemonic, address: account.address };
}
function importMnemonic(name, mnemonic) {
    const store = (0, store_1.loadStore)();
    // Verify mnemonic? Simple check for now
    if (mnemonic.split(' ').length < 12)
        throw new Error('Invalid mnemonic');
    const newWallet = {
        id: (0, uuid_1.v4)(),
        type: 'hd',
        name,
        mnemonic,
        accounts: []
    };
    const account = (0, accounts_1.mnemonicToAccount)(mnemonic, { accountIndex: 0 });
    newWallet.accounts.push({
        address: account.address,
        path: "m/44'/60'/0'/0/0",
        name: 'Account 1'
    });
    store.wallets.push(newWallet);
    store.activeWalletId = newWallet.id;
    store.activeAccountAddress = account.address;
    (0, store_1.saveStore)(store);
}
// --- Accounts ---
function deriveNewAccount(walletId) {
    const store = (0, store_1.loadStore)();
    const wallet = store.wallets.find(w => w.id === walletId);
    if (!wallet || wallet.type !== 'hd' || !wallet.mnemonic) {
        throw new Error('Cannot derive account: Wallet not found or not HD');
    }
    const index = wallet.accounts.length;
    const account = (0, accounts_1.mnemonicToAccount)(wallet.mnemonic, { accountIndex: index });
    const newAccount = {
        address: account.address,
        path: `m/44'/60'/0'/0/${index}`,
        name: `Account ${index + 1}`
    };
    wallet.accounts.push(newAccount);
    store.activeAccountAddress = newAccount.address; // Auto-switch
    (0, store_1.saveStore)(store);
    return newAccount;
}
function importPrivateKey(name, privateKey, walletId) {
    const store = (0, store_1.loadStore)();
    const wallet = store.wallets.find(w => w.id === walletId);
    if (!wallet)
        throw new Error('Wallet not found');
    // Use viem to verify and get address
    const account = (0, accounts_2.privateKeyToAccount)(privateKey);
    wallet.accounts.push({
        address: account.address,
        privateKey: privateKey, // Saving RAW private key as per plan (unencrypted locally)
        name
    });
    store.activeAccountAddress = account.address;
    (0, store_1.saveStore)(store);
    return account.address;
}
// --- Keystore ---
async function importKeystore(filePath, password, walletId) {
    const fs = require('fs');
    const json = fs.readFileSync(filePath, 'utf8');
    // Ethers v6 Wallet.fromEncryptedJson
    const wallet = await ethers_1.Wallet.fromEncryptedJson(json, password);
    return importPrivateKey('Imported Keystore', wallet.privateKey, walletId);
}
async function exportKeystore(privateKey, password) {
    const wallet = new ethers_1.Wallet(privateKey);
    const json = await wallet.encrypt(password);
    return json;
}
// --- State Helpers ---
function getActiveWallet() {
    const store = (0, store_1.loadStore)();
    if (!store.activeWalletId)
        return null;
    return store.wallets.find(w => w.id === store.activeWalletId);
}
function getActiveAccount() {
    const store = (0, store_1.loadStore)();
    const wallet = getActiveWallet();
    if (!wallet || !store.activeAccountAddress)
        return null;
    return wallet.accounts.find(a => a.address === store.activeAccountAddress);
}
// For compatibility with existing actions.ts, let's export a helper that gets the actual client or PK
function getActiveViemAccount() {
    const wallet = getActiveWallet();
    const account = getActiveAccount();
    if (!wallet || !account)
        throw new Error('No active account');
    if (account.privateKey) {
        return (0, accounts_2.privateKeyToAccount)(account.privateKey);
    }
    if (wallet.type === 'hd' && wallet.mnemonic && account.path) {
        const index = parseInt(account.path.split('/').pop() || '0');
        return (0, accounts_1.mnemonicToAccount)(wallet.mnemonic, { accountIndex: index });
    }
    throw new Error('Invalid account state');
}
