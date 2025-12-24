#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const actions_1 = require("./actions");
const store_1 = require("./store");
const walletManager_1 = require("./walletManager");
// ... imports
// ... imports
const utils_1 = require("./utils");
const program = new commander_1.Command();
const ui = new inquirer_1.default.ui.BottomBar();
function updateStatus() {
    let wInfo = chalk_1.default.red('No Wallet');
    let aInfo = chalk_1.default.red('No Account');
    let net = chalk_1.default.green('Sepolia');
    try {
        const wallet = (0, walletManager_1.getActiveWallet)();
        const account = (0, walletManager_1.getActiveAccount)();
        if (wallet)
            wInfo = chalk_1.default.cyan(wallet.name) + chalk_1.default.gray(` (${wallet.type})`);
        if (account) {
            const addrShort = `${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 4)}`;
            aInfo = chalk_1.default.cyan(account.name) + chalk_1.default.gray(` (${addrShort})`);
        }
    }
    catch (e) {
        if (e.message && e.message.includes('locked')) {
            wInfo = chalk_1.default.yellow('🔒 Locked');
            aInfo = chalk_1.default.yellow('🔒 Locked');
        }
        else {
            wInfo = chalk_1.default.gray('Initializing...');
            aInfo = chalk_1.default.gray('...');
        }
    }
    const hints = chalk_1.default.gray('[ESC] Back/Cancel  [⬆/⬇] Navigate  [Enter] Select');
    const line = ` 💼 ${wInfo}  👤 ${aInfo}  🌐 ${net}  |  ${hints} `;
    // Force write to bottom bar
    ui.updateBottomBar(line);
}
program
    .name('cliwallet')
    .description('A simple CLI wallet for Sepolia')
    .version('2.0.0');
// Helper to ignore cancel error
async function safeRun(fn) {
    try {
        await fn();
    }
    catch (error) {
        if (error instanceof utils_1.CancelError) {
            console.log(chalk_1.default.gray('\nOperation cancelled.'));
            return;
        }
        throw error; // Re-throw real errors
    }
}
// Startup Flow
async function startup() {
    console.clear();
    console.log(chalk_1.default.magenta.bold('\nWelcome to CLI Wallet! 🚀\n'));
    updateStatus();
    try {
        if (!(0, store_1.isStoreInitialized)()) {
            console.log(chalk_1.default.yellow('No existing wallet found. Initializing secure storage...'));
            try {
                const { password } = await (0, utils_1.cancellablePrompt)([{
                        type: 'password',
                        name: 'password',
                        message: 'Create a password for your wallet:',
                        mask: '*'
                    }]);
                const { confirm } = await (0, utils_1.cancellablePrompt)([{
                        type: 'password',
                        name: 'confirm',
                        message: 'Confirm password:',
                        mask: '*'
                    }]);
                if (password !== confirm) {
                    console.log(chalk_1.default.red('Passwords do not match. Exiting.'));
                    process.exit(1);
                }
                (0, store_1.unlockStore)(password);
                console.log(chalk_1.default.green('Wallet initialized securely.'));
                await (0, utils_1.waitForKeypress)();
            }
            catch (e) {
                if (e instanceof utils_1.CancelError)
                    process.exit(0);
                throw e;
            }
        }
        else if ((0, store_1.isStoreEncrypted)()) {
            let unlocked = false;
            while (!unlocked) {
                try {
                    const { password } = await (0, utils_1.cancellablePrompt)([{
                            type: 'password',
                            name: 'password',
                            message: 'Enter your wallet password:',
                            mask: '*'
                        }]);
                    try {
                        (0, store_1.unlockStore)(password);
                        unlocked = true;
                        console.log(chalk_1.default.green('Unlocked successfully.'));
                    }
                    catch (e) {
                        console.log(chalk_1.default.red('Incorrect password. Try again.'));
                    }
                }
                catch (e) {
                    if (e instanceof utils_1.CancelError)
                        process.exit(0);
                    throw e;
                }
            }
        }
        else {
            console.log(chalk_1.default.red.bold('WARNING: Unsecured plaintext wallet found!'));
            console.log(chalk_1.default.yellow('You must set a password to encrypt your data now.'));
            try {
                const { password } = await (0, utils_1.cancellablePrompt)([{
                        type: 'password',
                        name: 'password',
                        message: 'Create a password to encrypt your wallet:',
                        mask: '*'
                    }]);
                const { confirm } = await (0, utils_1.cancellablePrompt)([{
                        type: 'password',
                        name: 'confirm',
                        message: 'Confirm password:',
                        mask: '*'
                    }]);
                if (password !== confirm) {
                    console.log(chalk_1.default.red('Passwords do not match. Exiting.'));
                    process.exit(1);
                }
                (0, store_1.unlockStore)(password);
                console.log(chalk_1.default.green('Wallet encrypted and upgraded!.'));
                await (0, utils_1.waitForKeypress)();
            }
            catch (e) {
                if (e instanceof utils_1.CancelError)
                    process.exit(0);
                throw e;
            }
        }
        mainMenu();
    }
    catch (error) {
        console.error(chalk_1.default.red('Startup failed:'), error);
        process.exit(1);
    }
}
// Main Menu
async function mainMenu() {
    console.clear();
    console.log(chalk_1.default.magenta.bold('\nWelcome to CLI Wallet! 🚀\n'));
    // Status moved to bottom bar
    updateStatus();
    try {
        const { action } = await (0, utils_1.cancellablePrompt)([
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
                await safeRun(async () => { await (0, actions_1.getBalance)(); await (0, utils_1.waitForKeypress)(); });
                break;
            case 'Transfer ETH':
                await safeRun(async () => { await handleTransferETH(); await (0, utils_1.waitForKeypress)(); });
                break;
            case 'Transfer ERC20':
                await safeRun(async () => { await handleTransfer(); await (0, utils_1.waitForKeypress)(); });
                break;
            case 'Set ERC20 Contract Address':
                await safeRun(async () => { await handleSetToken(); });
                break;
            case 'Exit':
                console.log('Bye!');
                process.exit(0);
        }
    }
    catch (error) {
        if (error instanceof utils_1.CancelError) {
            console.log(chalk_1.default.gray('\nExiting...'));
            process.exit(0);
        }
        else
            console.error(chalk_1.default.red('Error:'), error);
    }
    mainMenu();
}
async function walletMenu() {
    console.clear();
    console.log(chalk_1.default.bold('❯ Wallet And Account\n'));
    updateStatus();
    try {
        const { action } = await (0, utils_1.cancellablePrompt)([
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
                await safeRun(handleGenerateWallet);
                break;
            case 'Generate New Account':
                await safeRun(handleGenerateAccount);
                break;
            case 'Switch Wallet':
                await safeRun(handleSwitchWallet);
                break;
            case 'Switch Account':
                await safeRun(handleSwitchAccount);
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
            // Submenus usually handle their own wait or return logic.
            // If safeRun caught cancel, we just loop.
            // If action completed, we also loop.
            // We generally want to stay in walletMenu unless 'Back' is pressed.
            if (action !== 'Import' && action !== 'Export Account' && action !== 'Export Wallet') {
                // The handlers above (Switch, Gen) finish quickly.
                await (0, utils_1.waitForKeypress)();
            }
            await walletMenu();
        }
    }
    catch (error) {
        if (error instanceof utils_1.CancelError)
            return; // Go back to Main Menu
        throw error;
    }
}
async function importMenu() {
    console.clear();
    console.log(chalk_1.default.bold('❯ Import\n'));
    try {
        const { action } = await (0, utils_1.cancellablePrompt)([{
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
                await safeRun(handleImportPrivateKey);
                break;
            case 'Account Keystore File':
                await safeRun(handleImportKeystore);
                break;
            case 'Wallet Seed phrase':
                await safeRun(handleImportMnemonic);
                break;
            case 'Back':
                return;
        }
        if (action !== 'Back')
            await (0, utils_1.waitForKeypress)();
        await importMenu(); // Loop
    }
    catch (e) {
        if (e instanceof utils_1.CancelError)
            return;
        throw e;
    }
}
async function exportAccountMenu() {
    console.clear();
    console.log(chalk_1.default.bold('❯ Export Account\n'));
    try {
        const { action } = await (0, utils_1.cancellablePrompt)([{
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
                await safeRun(handleExportPK);
                break;
            case 'Export Public Key':
                console.log(chalk_1.default.yellow('Feature not implemented yet (requires derive)'));
                break;
            case 'Export Address':
                const acc = (0, walletManager_1.getActiveAccount)();
                if (acc)
                    console.log(chalk_1.default.green(acc.address));
                break;
        }
        if (action !== 'Back')
            await (0, utils_1.waitForKeypress)();
        await exportAccountMenu();
    }
    catch (e) {
        if (e instanceof utils_1.CancelError)
            return;
        throw e;
    }
}
async function exportWalletMenu() {
    console.clear();
    console.log(chalk_1.default.bold('❯ Export Wallet\n'));
    try {
        const { action } = await (0, utils_1.cancellablePrompt)([{
                type: 'list',
                name: 'action',
                message: 'Option:',
                choices: [
                    'Seed phrase',
                    'Back'
                ]
            }]);
        if (action === 'Seed phrase') {
            const wallet = (0, walletManager_1.getActiveWallet)();
            if (wallet?.mnemonic) {
                console.log(chalk_1.default.green('Seed Phrase:'), wallet.mnemonic);
            }
            else {
                console.log(chalk_1.default.red('Current wallet is not an HD wallet or has no seed.'));
            }
            await (0, utils_1.waitForKeypress)();
        }
        await exportWalletMenu(); // Loop
    }
    catch (e) {
        if (e instanceof utils_1.CancelError)
            return;
        throw e;
    }
}
// --- Handlers (Unwrapped, they propagate CancelError usually) ---
async function handleGenerateWallet() {
    const { name } = await (0, utils_1.cancellablePrompt)([{ type: 'input', name: 'name', message: 'Wallet Name:' }]);
    const { mnemonic, address } = await (0, walletManager_1.createHDWallet)(name);
    console.log(chalk_1.default.green('Wallet Created!'));
    console.log('Mnemonic:', mnemonic);
    console.log('First Account:', address);
}
async function handleGenerateAccount() {
    const wallet = (0, walletManager_1.getActiveWallet)();
    if (!wallet)
        return console.log(chalk_1.default.red('No active wallet.'));
    if (wallet.type === 'hd') {
        const acc = (0, walletManager_1.deriveNewAccount)(wallet.id);
        console.log(chalk_1.default.green('New Account Derived:'), acc.address);
    }
    else {
        console.log(chalk_1.default.red('Start a new wallet or Import a Private Key to add to this bag (Simple Interface limitation).'));
    }
}
async function handleSwitchWallet() {
    const store = (0, store_1.loadStore)();
    const choices = store.wallets.map(w => ({ name: `${w.name} (${w.accounts.length} accs)`, value: w.id }));
    if (choices.length === 0)
        return console.log(chalk_1.default.yellow('No wallets found.'));
    const { id } = await (0, utils_1.cancellablePrompt)([{
            type: 'list',
            name: 'id',
            message: 'Select Wallet:',
            choices
        }]);
    store.activeWalletId = id;
    const w = store.wallets.find(x => x.id === id);
    if (w && w.accounts.length > 0)
        store.activeAccountAddress = w.accounts[0].address;
    const { saveStore } = require('./store');
    saveStore(store);
    console.log(chalk_1.default.green('Switched Wallet.'));
    updateStatus();
}
async function handleSwitchAccount() {
    const wallet = (0, walletManager_1.getActiveWallet)();
    if (!wallet)
        return console.log(chalk_1.default.red('No active wallet.'));
    // This prompt needs cancel too.
    if (wallet.accounts.length === 0)
        return console.log(chalk_1.default.red('No accounts in wallet.'));
    const choices = wallet.accounts.map(a => ({ name: `${a.name} - ${a.address}`, value: a.address }));
    const { address } = await (0, utils_1.cancellablePrompt)([{
            type: 'list',
            name: 'address',
            message: 'Select Account:',
            choices
        }]);
    const store = (0, store_1.loadStore)();
    store.activeAccountAddress = address;
    const { saveStore } = require('./store');
    saveStore(store);
    console.log(chalk_1.default.green('Switched Account.'));
    updateStatus();
}
async function handleImportMnemonic() {
    const { name, mnemonic } = await (0, utils_1.cancellablePrompt)([
        { type: 'input', name: 'name', message: 'Wallet Name:' },
        { type: 'input', name: 'mnemonic', message: 'Seed Phrase:' }
    ]);
    try {
        (0, walletManager_1.importMnemonic)(name, mnemonic);
        console.log(chalk_1.default.green('Wallet Imported!'));
    }
    catch (e) {
        console.log(chalk_1.default.red('Error:'), e.message);
    }
}
async function handleImportPrivateKey() {
    const wallet = (0, walletManager_1.getActiveWallet)();
    if (!wallet)
        return console.log(chalk_1.default.red('Create a wallet container first (or we can auto-create one).'));
    const { name, key } = await (0, utils_1.cancellablePrompt)([
        { type: 'input', name: 'name', message: 'Account Name:' },
        { type: 'input', name: 'key', message: 'Private Key:' }
    ]);
    try {
        (0, walletManager_1.importPrivateKey)(name, key, wallet.id);
        console.log(chalk_1.default.green('Account Imported!'));
    }
    catch (e) {
        console.log(chalk_1.default.red('Error:'), e.message);
    }
}
async function handleImportKeystore() {
    const wallet = (0, walletManager_1.getActiveWallet)();
    if (!wallet)
        return console.log(chalk_1.default.red('Create a wallet container first.'));
    const { path: fpath, pass } = await (0, utils_1.cancellablePrompt)([
        { type: 'input', name: 'path', message: 'Keystore File Path:' },
        { type: 'password', name: 'pass', message: 'Password:' }
    ]);
    try {
        const addr = await (0, walletManager_1.importKeystore)(fpath, pass, wallet.id);
        console.log(chalk_1.default.green('Account Imported:'), addr);
    }
    catch (e) {
        console.log(chalk_1.default.red('Error:'), e.message);
    }
}
async function handleExportPK() {
    const wallet = (0, walletManager_1.getActiveWallet)();
    const account = (0, walletManager_1.getActiveAccount)();
    if (!wallet || !account)
        return console.log(chalk_1.default.red('No active account.'));
    if (account.privateKey) {
        console.log(chalk_1.default.yellow('Private Key:'), account.privateKey);
    }
    else if (wallet.type === 'hd' && wallet.mnemonic && account.path) {
        console.log(chalk_1.default.yellow('HD Account Private Key export is strictly protected. Please check "Export Wallet" for Seed Phrase to recover elsewhere.'));
    }
}
async function handleTransfer() {
    const answers = await (0, utils_1.cancellablePrompt)([
        {
            type: 'input',
            name: 'token',
            message: 'Token Contract Address:',
            default: (0, utils_1.loadTokenAddress)() || '0xb8119Af65964BF83b0c44E8DD07e4bEbD3432d5c'
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
    // If we are here, we finished prompt. 
    // If user cancelled in prompt, it threw, and safeRun catches it.
    await (0, actions_1.transferERC20)(answers.token, answers.to, answers.amount, answers.maxFeePerGas, answers.maxPriorityFeePerGas);
}
async function handleTransferETH() {
    const answers = await (0, utils_1.cancellablePrompt)([
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
    await (0, actions_1.transferETH)(answers.to, answers.amount, answers.maxFeePerGas, answers.maxPriorityFeePerGas);
}
async function handleSetToken() {
    const { tokenAddress } = await (0, utils_1.cancellablePrompt)([{
            type: 'input',
            name: 'tokenAddress',
            message: 'Enter ERC20 Token Contract Address:',
            validate: input => input.startsWith('0x') && input.length === 42 || 'Invalid address format'
        }]);
    await (0, actions_1.setTokenAddress)(tokenAddress);
}
// Start
if (!process.argv.slice(2).length) {
    startup().catch(e => { console.error('Unhandled Rejection:', e); process.exit(1); });
}
else {
    program.parse(process.argv);
}
