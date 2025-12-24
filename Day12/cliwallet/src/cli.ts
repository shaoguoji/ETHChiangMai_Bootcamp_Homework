#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateWallet, getBalance, transferERC20, setTokenAddress } from './actions';
import { loadPrivateKey, loadTokenAddress, waitForKeypress } from './utils';
import { privateKeyToAccount } from 'viem/accounts';

const program = new Command();

program
    .name('cliwallet')
    .description('A simple CLI wallet for Sepolia')
    .version('1.0.0');

// 1. Generate Command
program
    .command('generate')
    .description('Generate a new random private key')
    .action(async () => {
        await generateWallet();
    });

// 2. Balance Command
program
    .command('balance')
    .argument('[address]', 'Address to check balance for (defaults to loaded wallet)')
    .description('Check ETH balance on Sepolia')
    .action(async (address) => {
        await getBalance(address);
    });

// 3. Transfer Command
program
    .command('transfer')
    .requiredOption('-t, --token <address>', 'ERC20 Token Address')
    .requiredOption('-to, --to <address>', 'Recipient Address')
    .requiredOption('-a, --amount <number>', 'Amount to transfer')
    .description('Transfer ERC20 tokens')
    .action(async (options) => {
        await transferERC20(options.token, options.to, options.amount);
    });

// Interactive Mode (Default)
async function interact() {
    console.clear();
    console.log(chalk.magenta.bold('\nWelcome to CLI Wallet! 🚀\n'));

    // Check if wallet is loaded
    const pk = loadPrivateKey();
    if (pk) {
        const account = privateKeyToAccount(pk as `0x${string}`);
        console.log(chalk.cyan(`Current Wallet: ${account.address}\n`));
    } else {
        console.log(chalk.yellow('No wallet loaded. Please generate one first.\n'));
    }

    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'Generate New Wallet',
                'Check Balance',
                'Transfer ERC20',
                'Set ERC20 Contract Address',
                'Exit'
            ]
        }
    ]);

    switch (action) {
        case 'Generate New Wallet':
            await generateWallet();
            break;
        case 'Check Balance':
            if (pk) {
                // Check own balance by default in interactive
                await getBalance();
            } else {
                // Ask for address
                const { address } = await inquirer.prompt([{
                    type: 'input',
                    name: 'address',
                    message: 'Enter address to check:',
                    validate: input => input.startsWith('0x') || 'Invalid address'
                }]);
                await getBalance(address);
            }
            break;
        case 'Transfer ERC20':
            const answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'token',
                    message: 'Token Contract Address:',
                    default: loadTokenAddress() || '0xb8119Af65964BF83b0c44E8DD07e4bEbD3432d5c' // Default to stored or USDC on Sepolia
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
                }
            ]);
            await transferERC20(answers.token, answers.to, answers.amount);
            break;
        case 'Set ERC20 Contract Address':
            const { tokenAddress } = await inquirer.prompt([{
                type: 'input',
                name: 'tokenAddress',
                message: 'Enter ERC20 Token Contract Address:',
                validate: input => input.startsWith('0x') && input.length === 42 || 'Invalid address format'
            }]);
            await setTokenAddress(tokenAddress);
            break;
        case 'Exit':
            console.log('Bye!');
            process.exit(0);
    }

    await waitForKeypress();
    interact();
}

// Handle execution
if (!process.argv.slice(2).length) {
    interact();
} else {
    program.parse(process.argv);
}
