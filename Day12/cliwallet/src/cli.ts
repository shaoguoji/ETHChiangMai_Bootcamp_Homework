#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { getBalance, transferERC20, transferETH, setTokenAddress } from './actions';
import { loadStore } from './store';
import {
    createHDWallet,
    importMnemonic,
    deriveNewAccount,
    importPrivateKey,
    importKeystore,
    exportKeystore,
    getActiveWallet,
    getActiveAccount
} from './walletManager';
import { waitForKeypress } from './utils';
import { english } from 'viem/accounts';
import { loadTokenAddress } from './utils';

const program = new Command();

program
    .name('cliwallet')
    .description('A simple CLI wallet for Sepolia')
    .version('2.0.0');

// Main Menu
async function mainMenu() {
    console.clear();
    console.log(chalk.magenta.bold('\nWelcome to CLI Wallet! 🚀\n'));

    // Status Display
    const wallet = getActiveWallet();
    const account = getActiveAccount();

    if (wallet && account) {
        console.log(chalk.cyan(`Active Wallet: ${wallet.name} (${wallet.type})`));
        console.log(chalk.cyan(`Active Account: ${account.name} (${account.address})\n`));
    } else {
        console.log(chalk.yellow('No active wallet. Please create or import one.\n'));
    }

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'Wallet And Account',
                'Check Balance',
                'Transfer ETH',
                'Transfer ERC20',
                'Set ERC20 Contract Address',
                'Exit'
            ]
        }
    ]);

    switch (action) {
        case 'Wallet And Account':
            await walletMenu();
            break;
        case 'Check Balance':
            await getBalance();
            await waitForKeypress();
            break;
        case 'Transfer ETH':
            await handleTransferETH();
            await waitForKeypress();
            break;
        case 'Transfer ERC20':
            await handleTransfer();
            await waitForKeypress();
            break;
        case 'Set ERC20 Contract Address':
            await handleSetToken();
            break;
        case 'Exit':
            console.log('Bye!');
            process.exit(0);
    }

    mainMenu();
}

// Wallet Submenu
async function walletMenu() {
    console.clear();
    console.log(chalk.bold('❯ Wallet And Account\n'));

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'Select Option:',
            choices: [
                'Generate New Wallet',
                'Generate New Account',
                'Switch Wallet',
                'Switch Account',
                'Import',
                'Export Account',
                'Export Wallet',
                'Back'
            ]
        }
    ]);

    switch (action) {
        case 'Generate New Wallet':
            await handleGenerateWallet();
            break;
        case 'Generate New Account':
            await handleGenerateAccount();
            break;
        case 'Switch Wallet':
            await handleSwitchWallet();
            break;
        case 'Switch Account':
            await handleSwitchAccount();
            break;
        case 'Import':
            await importMenu();
            break;
        case 'Export Account':
            await exportAccountMenu();
            break;
        case 'Export Wallet':
            await exportWalletMenu();
            break;
        case 'Back':
            return;
    }

    if (action !== 'Back') {
        await waitForKeypress();
        await walletMenu();
    }
}

// Import Submenu
async function importMenu() {
    console.clear();
    console.log(chalk.bold('❯ Import\n'));
    const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'Import Type:',
        choices: [
            'Account Private Key',
            'Account Keystore File',
            'Wallet Seed phrase',
            'Back'
        ]
    }]);

    switch (action) {
        case 'Account Private Key':
            await handleImportPrivateKey();
            break;
        case 'Account Keystore File':
            await handleImportKeystore();
            break;
        case 'Wallet Seed phrase':
            await handleImportMnemonic();
            break;
        case 'Back':
            return;
    }
    if (action !== 'Back') await waitForKeypress();
}

// Export Account Submenu
async function exportAccountMenu() {
    console.clear();
    console.log(chalk.bold('❯ Export Account\n'));
    const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'Export Type:',
        choices: [
            'Export Private Key',
            'Export Public Key',
            'Export Address',
            'Back'
        ]
    }]);

    switch (action) {
        case 'Export Private Key':
            await handleExportPK();
            break;
        case 'Export Public Key':
            console.log(chalk.yellow('Feature not implemented yet (requires derive)'));
            break;
        case 'Export Address':
            const acc = getActiveAccount();
            if (acc) console.log(chalk.green(acc.address));
            break;
    }
    if (action !== 'Back') await waitForKeypress();
}

// Export Wallet Submenu
async function exportWalletMenu() {
    console.clear();
    console.log(chalk.bold('❯ Export Wallet\n'));
    const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'Option:',
        choices: [
            'Seed phrase',
            'Back'
        ]
    }]);

    if (action === 'Seed phrase') {
        const wallet = getActiveWallet();
        if (wallet?.mnemonic) {
            console.log(chalk.green('Seed Phrase:'), wallet.mnemonic);
        } else {
            console.log(chalk.red('Current wallet is not an HD wallet or has no seed.'));
        }
        await waitForKeypress();
    }
}

// --- Handlers ---

async function handleGenerateWallet() {
    const { name } = await inquirer.prompt([{ type: 'input', name: 'name', message: 'Wallet Name:' }]);
    const { mnemonic, address } = await createHDWallet(name);
    console.log(chalk.green('Wallet Created!'));
    console.log('Mnemonic:', mnemonic);
    console.log('First Account:', address);
}

async function handleGenerateAccount() {
    const wallet = getActiveWallet();
    if (!wallet) return console.log(chalk.red('No active wallet.'));

    if (wallet.type === 'hd') {
        const acc = deriveNewAccount(wallet.id);
        console.log(chalk.green('New Account Derived:'), acc.address);
    } else {
        console.log(chalk.red('Start a new wallet or Import a Private Key to add to this bag (Simple Interface limitation).'));
    }
}

async function handleSwitchWallet() {
    const store = loadStore();
    const choices = store.wallets.map(w => ({ name: `${w.name} (${w.accounts.length} accs)`, value: w.id }));
    if (choices.length === 0) return console.log(chalk.yellow('No wallets found.'));

    const { id } = await inquirer.prompt([{
        type: 'list',
        name: 'id',
        message: 'Select Wallet:',
        choices
    }]);

    store.activeWalletId = id;
    const w = store.wallets.find(x => x.id === id);
    if (w && w.accounts.length > 0) store.activeAccountAddress = w.accounts[0].address;

    const { saveStore } = require('./store');
    saveStore(store);
    console.log(chalk.green('Switched Wallet.'));
}

async function handleSwitchAccount() {
    const wallet = getActiveWallet();
    if (!wallet) return console.log(chalk.red('No active wallet.'));

    const choices = wallet.accounts.map(a => ({ name: `${a.name} - ${a.address}`, value: a.address }));
    const { address } = await inquirer.prompt([{
        type: 'list',
        name: 'address',
        message: 'Select Account:',
        choices
    }]);

    const store = loadStore();
    store.activeAccountAddress = address;
    const { saveStore } = require('./store');
    saveStore(store);
    console.log(chalk.green('Switched Account.'));
}

async function handleImportMnemonic() {
    const { name, mnemonic } = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Wallet Name:' },
        { type: 'input', name: 'mnemonic', message: 'Seed Phrase:' }
    ]);
    try {
        importMnemonic(name, mnemonic);
        console.log(chalk.green('Wallet Imported!'));
    } catch (e: any) {
        console.log(chalk.red('Error:'), e.message);
    }
}

async function handleImportPrivateKey() {
    const wallet = getActiveWallet();
    if (!wallet) return console.log(chalk.red('Create a wallet container first (or we can auto-create one).'));

    const { name, key } = await inquirer.prompt([
        { type: 'input', name: 'name', message: 'Account Name:' },
        { type: 'input', name: 'key', message: 'Private Key:' }
    ]);

    try {
        importPrivateKey(name, key, wallet.id);
        console.log(chalk.green('Account Imported!'));
    } catch (e: any) {
        console.log(chalk.red('Error:'), e.message);
    }
}

async function handleImportKeystore() {
    const wallet = getActiveWallet();
    if (!wallet) return console.log(chalk.red('Create a wallet container first.'));

    const { path: fpath, pass } = await inquirer.prompt([
        { type: 'input', name: 'path', message: 'Keystore File Path:' },
        { type: 'password', name: 'pass', message: 'Password:' }
    ]);

    try {
        const addr = await importKeystore(fpath, pass, wallet.id);
        console.log(chalk.green('Account Imported:'), addr);
    } catch (e: any) {
        console.log(chalk.red('Error:'), e.message);
    }
}

async function handleExportPK() {
    const wallet = getActiveWallet();
    const account = getActiveAccount();
    if (!wallet || !account) return console.log(chalk.red('No active account.'));

    if (account.privateKey) {
        console.log(chalk.yellow('Private Key:'), account.privateKey);
    } else if (wallet.type === 'hd' && wallet.mnemonic && account.path) {
        console.log(chalk.yellow('HD Account Private Key export is strictly protected. Please check "Export Wallet" for Seed Phrase to recover elsewhere.'));
    }
}

async function handleTransfer() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'token',
            message: 'Token Contract Address:',
            default: loadTokenAddress() || '0xb8119Af65964BF83b0c44E8DD07e4bEbD3432d5c'
        },
        {
            type: 'input',
            name: 'to',
            message: 'Recipient Address:'
        },
        {
            type: 'input',
            name: 'amount',
            message: 'Amount:'
        },
        {
            type: 'input',
            name: 'maxFeePerGas',
            message: 'Max Fee Per Gas (Gwei) [Optional]:',
        },
        {
            type: 'input',
            name: 'maxPriorityFeePerGas',
            message: 'Max Priority Fee Per Gas (Gwei) [Optional]:',
        }
    ]);
    await transferERC20(answers.token, answers.to, answers.amount, answers.maxFeePerGas, answers.maxPriorityFeePerGas);
}

async function handleTransferETH() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'to',
            message: 'Recipient Address:'
        },
        {
            type: 'input',
            name: 'amount',
            message: 'Amount (ETH):'
        },
        {
            type: 'input',
            name: 'maxFeePerGas',
            message: 'Max Fee Per Gas (Gwei) [Optional]:',
        },
        {
            type: 'input',
            name: 'maxPriorityFeePerGas',
            message: 'Max Priority Fee Per Gas (Gwei) [Optional]:',
        }
    ]);
    await transferETH(answers.to, answers.amount, answers.maxFeePerGas, answers.maxPriorityFeePerGas);
}

async function handleSetToken() {
    const { tokenAddress } = await inquirer.prompt([{
        type: 'input',
        name: 'tokenAddress',
        message: 'Enter ERC20 Token Contract Address:',
        validate: input => input.startsWith('0x') && input.length === 42 || 'Invalid address format'
    }]);
    await setTokenAddress(tokenAddress);
}

// Start
if (!process.argv.slice(2).length) {
    mainMenu();
} else {
    program.parse(process.argv);
}
