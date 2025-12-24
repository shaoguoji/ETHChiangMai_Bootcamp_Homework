"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelError = exports.publicClient = exports.ENV_PATH = void 0;
exports.updateEnv = updateEnv;
exports.savePrivateKey = savePrivateKey;
exports.loadPrivateKey = loadPrivateKey;
exports.saveTokenAddress = saveTokenAddress;
exports.waitForKeypress = waitForKeypress;
exports.loadTokenAddress = loadTokenAddress;
exports.cancellablePrompt = cancellablePrompt;
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
dotenv_1.default.config();
exports.ENV_PATH = path_1.default.join(process.cwd(), '.env');
// Public client for reading data (balance, nonce, etc.)
exports.publicClient = (0, viem_1.createPublicClient)({
    chain: chains_1.sepolia,
    transport: (0, viem_1.http)(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
});
// Helper to update .env calculation
function updateEnv(key, value) {
    let envContent = '';
    if (fs_1.default.existsSync(exports.ENV_PATH)) {
        envContent = fs_1.default.readFileSync(exports.ENV_PATH, 'utf8');
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
    fs_1.default.writeFileSync(exports.ENV_PATH, finalContent + '\n');
    // Update process.env for current session
    process.env[key] = value;
}
function savePrivateKey(privateKey) {
    updateEnv('PRIVATE_KEY', privateKey);
    if (!process.env.RPC_URL) {
        updateEnv('RPC_URL', 'https://ethereum-sepolia-rpc.publicnode.com');
    }
}
function loadPrivateKey() {
    return process.env.PRIVATE_KEY;
}
function saveTokenAddress(address) {
    updateEnv('TOKEN_ADDRESS', address);
}
async function waitForKeypress() {
    console.log(chalk_1.default.dim('\nPress any key to return to menu...'));
    process.stdin.setRawMode(true);
    process.stdin.resume();
    return new Promise(resolve => {
        process.stdin.once('data', () => {
            process.stdin.setRawMode(false);
            process.stdin.pause();
            resolve();
        });
    });
}
function loadTokenAddress() {
    return process.env.TOKEN_ADDRESS;
}
class CancelError extends Error {
    constructor() {
        super('Cancelled');
        this.name = 'CancelError';
    }
}
exports.CancelError = CancelError;
function cancellablePrompt(questions) {
    const promptPromise = inquirer_1.default.prompt(questions);
    const ui = promptPromise.ui;
    return new Promise((resolve, reject) => {
        // Handle standard completion
        promptPromise.then((answers) => resolve(answers)).catch(reject);
        // Handle ESC
        if (ui && ui.rl) {
            ui.rl.input.on('keypress', (_, key) => {
                if (key && key.name === 'escape') {
                    // Close the prompt prompt UI
                    try {
                        ui.close();
                    }
                    catch { }
                    reject(new CancelError());
                }
            });
        }
    });
}
