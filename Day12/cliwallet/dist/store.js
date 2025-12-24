"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStoreInitialized = isStoreInitialized;
exports.isStoreEncrypted = isStoreEncrypted;
exports.unlockStore = unlockStore;
exports.loadStore = loadStore;
exports.saveStore = saveStore;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const DATA_DIR = path_1.default.join(process.cwd(), 'data');
const WALLET_FILE = path_1.default.join(DATA_DIR, 'wallets.json');
// Session State
let sessionKey = null;
let currentSalt = null;
let cachedData = null;
// Encryption Consts
const ALGORITHM = 'aes-256-gcm';
const KEY_LEN = 32;
const SALT_LEN = 16;
const IV_LEN = 12;
function initStore() {
    if (!fs_1.default.existsSync(DATA_DIR)) {
        fs_1.default.mkdirSync(DATA_DIR);
    }
}
function deriveKey(password, salt) {
    return crypto_1.default.scryptSync(password, salt, KEY_LEN);
}
function isStoreInitialized() {
    return fs_1.default.existsSync(WALLET_FILE);
}
function isStoreEncrypted() {
    if (!isStoreInitialized())
        return false;
    try {
        const raw = fs_1.default.readFileSync(WALLET_FILE, 'utf8');
        const json = JSON.parse(raw);
        return !!(json.encrypted && json.salt && json.iv);
    }
    catch {
        return false;
    }
}
function unlockStore(password) {
    initStore();
    // Case 1: New Store
    if (!fs_1.default.existsSync(WALLET_FILE)) {
        currentSalt = crypto_1.default.randomBytes(SALT_LEN);
        sessionKey = deriveKey(password, currentSalt);
        cachedData = { wallets: [] };
        // Save initial
        saveStore(cachedData);
        return;
    }
    const raw = fs_1.default.readFileSync(WALLET_FILE, 'utf8');
    let json;
    try {
        json = JSON.parse(raw);
    }
    catch (e) {
        throw new Error('Corrupted wallet data file');
    }
    // Case 2: Encrypted Store
    if (json.encrypted) {
        currentSalt = Buffer.from(json.salt, 'hex');
        const iv = Buffer.from(json.iv, 'hex');
        const tag = Buffer.from(json.tag, 'hex');
        const text = json.data;
        const key = deriveKey(password, currentSalt);
        const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        try {
            let decrypted = decipher.update(text, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            cachedData = JSON.parse(decrypted);
            sessionKey = key; // Auth success
        }
        catch (e) {
            throw new Error('Incorrect password');
        }
    }
    // Case 3: Legacy Plaintext Store
    else {
        cachedData = json;
        // Upgrade immediately
        currentSalt = crypto_1.default.randomBytes(SALT_LEN);
        sessionKey = deriveKey(password, currentSalt);
        saveStore(cachedData);
    }
}
function loadStore() {
    if (!cachedData) {
        throw new Error('Wallet locked. Please unlock first.');
    }
    return cachedData;
}
function saveStore(data) {
    cachedData = data; // Update cache
    initStore();
    if (!sessionKey || !currentSalt)
        throw new Error('Cannot save: Wallet locked');
    // Encrypt
    const iv = crypto_1.default.randomBytes(IV_LEN);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, sessionKey, iv);
    const stringified = JSON.stringify(data);
    let encrypted = cipher.update(stringified, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    const output = {
        encrypted: true,
        salt: currentSalt.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        data: encrypted
    };
    fs_1.default.writeFileSync(WALLET_FILE, JSON.stringify(output, null, 2));
}
