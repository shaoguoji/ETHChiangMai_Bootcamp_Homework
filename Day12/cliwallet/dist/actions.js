"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWallet = generateWallet;
exports.getBalance = getBalance;
exports.transferERC20 = transferERC20;
exports.transferETH = transferETH;
exports.setTokenAddress = setTokenAddress;
const accounts_1 = require("viem/accounts");
const utils_1 = require("./utils");
const walletManager_1 = require("./walletManager");
const viem_1 = require("viem");
const chains_1 = require("viem/chains");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
// 1. Generate Wallet
async function generateWallet() {
    const spinner = (0, ora_1.default)('Generating new wallet...').start();
    try {
        const privateKey = (0, accounts_1.generatePrivateKey)();
        const account = (0, accounts_1.privateKeyToAccount)(privateKey);
        (0, utils_1.savePrivateKey)(privateKey);
        spinner.succeed(chalk_1.default.green('Wallet generated successfully!'));
        console.log(chalk_1.default.yellow('Address:'), account.address);
        console.log(chalk_1.default.yellow('Private Key:'), privateKey);
        console.log(chalk_1.default.gray('(Saved to .env file)'));
        return { address: account.address, privateKey };
    }
    catch (error) {
        spinner.fail('Failed to generate wallet');
        console.error(error);
        throw error;
    }
}
// 2. Get Balance
async function getBalance(address) {
    if (!address) {
        try {
            const account = (0, walletManager_1.getActiveViemAccount)();
            address = account.address;
        }
        catch (e) {
            console.error(chalk_1.default.red('No active account found. Please create or select a wallet.'));
            return;
        }
    }
    const spinner = (0, ora_1.default)(`Fetching balance for ${address}...`).start();
    try {
        const balance = await utils_1.publicClient.getBalance({
            address: address,
        });
        spinner.stop();
        console.log(chalk_1.default.blue(`ETH Balance: ${(0, viem_1.formatEther)(balance)} ETH`));
        // Check for ERC20
        const tokenAddress = (0, utils_1.loadTokenAddress)();
        if (tokenAddress) {
            const tokenSpinner = (0, ora_1.default)(`Fetching ERC20 balance from ${tokenAddress}...`).start();
            try {
                const abi = (0, viem_1.parseAbi)([
                    'function balanceOf(address) view returns (uint256)',
                    'function decimals() view returns (uint8)',
                    'function symbol() view returns (string)'
                ]);
                const [tokenBalance, decimals, symbol] = await Promise.all([
                    utils_1.publicClient.readContract({
                        address: tokenAddress,
                        abi,
                        functionName: 'balanceOf',
                        args: [address]
                    }),
                    utils_1.publicClient.readContract({
                        address: tokenAddress,
                        abi,
                        functionName: 'decimals'
                    }),
                    utils_1.publicClient.readContract({
                        address: tokenAddress,
                        abi,
                        functionName: 'symbol'
                    })
                ]);
                tokenSpinner.stop();
                const formatted = Number(tokenBalance) / (10 ** decimals);
                console.log(chalk_1.default.cyan(`${symbol} Balance: ${formatted} ${symbol}`));
                console.log(chalk_1.default.gray(`(Contract: ${tokenAddress})`));
            }
            catch (e) {
                tokenSpinner.fail(chalk_1.default.red('Failed to fetch token balance (invalid contract?)'));
            }
        }
        return balance;
    }
    catch (error) {
        spinner.fail('Failed to fetch balance');
        console.error(error);
    }
}
// 3. Transfer ERC20
async function transferERC20(tokenAddress, toAddress, amount, maxFeePerGasGwei, maxPriorityFeePerGasGwei) {
    let account;
    try {
        account = (0, walletManager_1.getActiveViemAccount)();
    }
    catch (e) {
        console.error(chalk_1.default.red('No active account found. Please create or select a wallet.'));
        return;
    }
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: chains_1.sepolia,
        transport: (0, viem_1.http)(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
    });
    const spinner = (0, ora_1.default)('Preparing transaction...').start();
    try {
        // ERC20 Transfer ABI
        const abi = (0, viem_1.parseAbi)(['function transfer(address to, uint256 value) returns (bool)']);
        // Fetch decimals
        const decimals = await utils_1.publicClient.readContract({
            address: tokenAddress,
            abi: (0, viem_1.parseAbi)(['function decimals() view returns (uint8)']),
            functionName: 'decimals',
        });
        const value = BigInt(parseFloat(amount) * (10 ** decimals));
        const maxFeePerGas = maxFeePerGasGwei ? (0, viem_1.parseGwei)(maxFeePerGasGwei) : undefined;
        const maxPriorityFeePerGas = maxPriorityFeePerGasGwei ? (0, viem_1.parseGwei)(maxPriorityFeePerGasGwei) : undefined;
        spinner.text = 'Sending transaction...';
        const hash = await walletClient.writeContract({
            address: tokenAddress,
            abi,
            functionName: 'transfer',
            args: [toAddress, value],
            chain: chains_1.sepolia,
            maxFeePerGas,
            maxPriorityFeePerGas,
        });
        spinner.succeed(chalk_1.default.green('Transaction sent!'));
        console.log(chalk_1.default.yellow('Tx Hash:'), hash);
        console.log(chalk_1.default.blue(`Explorer: https://sepolia.etherscan.io/tx/${hash}`));
    }
    catch (error) {
        spinner.fail('Transfer failed');
        console.error(error);
    }
}
// 3.5 Transfer ETH
async function transferETH(toAddress, amount, maxFeePerGasGwei, maxPriorityFeePerGasGwei) {
    let account;
    try {
        account = (0, walletManager_1.getActiveViemAccount)();
    }
    catch (e) {
        console.error(chalk_1.default.red('No active account found. Please create or select a wallet.'));
        return;
    }
    const walletClient = (0, viem_1.createWalletClient)({
        account,
        chain: chains_1.sepolia,
        transport: (0, viem_1.http)(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
    });
    const spinner = (0, ora_1.default)('Preparing ETH transaction...').start();
    try {
        const value = (0, viem_1.parseEther)(amount);
        const maxFeePerGas = maxFeePerGasGwei ? (0, viem_1.parseGwei)(maxFeePerGasGwei) : undefined;
        const maxPriorityFeePerGas = maxPriorityFeePerGasGwei ? (0, viem_1.parseGwei)(maxPriorityFeePerGasGwei) : undefined;
        spinner.text = 'Sending ETH...';
        const hash = await walletClient.sendTransaction({
            to: toAddress,
            value,
            maxFeePerGas,
            maxPriorityFeePerGas,
            chain: chains_1.sepolia,
        });
        spinner.succeed(chalk_1.default.green('ETH Transaction sent!'));
        console.log(chalk_1.default.yellow('Tx Hash:'), hash);
        console.log(chalk_1.default.blue(`Explorer: https://sepolia.etherscan.io/tx/${hash}`));
    }
    catch (error) {
        spinner.fail('Transfer failed');
        console.error(error);
    }
}
// 4. Set Token Address
async function setTokenAddress(address) {
    if (!address.startsWith('0x') || address.length !== 42) {
        console.error(chalk_1.default.red('Invalid address format'));
        return;
    }
    (0, utils_1.saveTokenAddress)(address);
    console.log(chalk_1.default.green(`Token address set to: ${address}`));
}
