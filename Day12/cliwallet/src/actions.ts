import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { publicClient, savePrivateKey, loadPrivateKey, saveTokenAddress, loadTokenAddress } from './utils';
import { createWalletClient, http, parseEther, parseAbi, formatEther } from 'viem';
import { sepolia } from 'viem/chains';
import chalk from 'chalk';
import ora from 'ora';

// 1. Generate Wallet
export async function generateWallet() {
    const spinner = ora('Generating new wallet...').start();
    try {
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);

        savePrivateKey(privateKey);

        spinner.succeed(chalk.green('Wallet generated successfully!'));
        console.log(chalk.yellow('Address:'), account.address);
        console.log(chalk.yellow('Private Key:'), privateKey);
        console.log(chalk.gray('(Saved to .env file)'));

        return { address: account.address, privateKey };
    } catch (error) {
        spinner.fail('Failed to generate wallet');
        console.error(error);
        throw error;
    }
}

// 2. Get Balance
export async function getBalance(address?: string) {
    if (!address) {
        // Try to load from env if no address provided
        const pk = loadPrivateKey();
        if (pk) {
            const account = privateKeyToAccount(pk as `0x${string}`);
            address = account.address;
        } else {
            console.error(chalk.red('No address provided and no private key found in .env'));
            return;
        }
    }

    const spinner = ora(`Fetching balance for ${address}...`).start();
    try {
        const balance = await publicClient.getBalance({
            address: address as `0x${string}`,
        });

        spinner.stop();
        console.log(chalk.blue(`ETH Balance: ${formatEther(balance)} ETH`));

        // Check for ERC20
        const tokenAddress = loadTokenAddress();
        if (tokenAddress) {
            const tokenSpinner = ora(`Fetching ERC20 balance from ${tokenAddress}...`).start();
            try {
                const abi = parseAbi([
                    'function balanceOf(address) view returns (uint256)',
                    'function decimals() view returns (uint8)',
                    'function symbol() view returns (string)'
                ]);

                const [tokenBalance, decimals, symbol] = await Promise.all([
                    publicClient.readContract({
                        address: tokenAddress as `0x${string}`,
                        abi,
                        functionName: 'balanceOf',
                        args: [address as `0x${string}`]
                    }) as Promise<bigint>,
                    publicClient.readContract({
                        address: tokenAddress as `0x${string}`,
                        abi,
                        functionName: 'decimals'
                    }) as Promise<number>,
                    publicClient.readContract({
                        address: tokenAddress as `0x${string}`,
                        abi,
                        functionName: 'symbol'
                    }) as Promise<string>
                ]);

                tokenSpinner.stop();
                const formatted = Number(tokenBalance) / (10 ** decimals);
                console.log(chalk.cyan(`${symbol} Balance: ${formatted} ${symbol}`));
                console.log(chalk.gray(`(Contract: ${tokenAddress})`));

            } catch (e) {
                tokenSpinner.fail(chalk.red('Failed to fetch token balance (invalid contract?)'));
            }
        }

        return balance;
    } catch (error) {
        spinner.fail('Failed to fetch balance');
        console.error(error);
    }
}

// 3. Transfer ERC20
export async function transferERC20(tokenAddress: string, toAddress: string, amount: string) {
    const pk = loadPrivateKey();
    if (!pk) {
        console.error(chalk.red('No private key found. Please generate or import a wallet first.'));
        return;
    }

    const account = privateKeyToAccount(pk as `0x${string}`);
    const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'),
    });

    const spinner = ora('Preparing transaction...').start();

    try {
        // ERC20 Transfer ABI
        const abi = parseAbi(['function transfer(address to, uint256 value) returns (bool)']);

        // Fetch decimals
        const decimals = await publicClient.readContract({
            address: tokenAddress as `0x${string}`,
            abi: parseAbi(['function decimals() view returns (uint8)']),
            functionName: 'decimals',
        }) as number;

        const value = BigInt(parseFloat(amount) * (10 ** decimals));

        spinner.text = 'Sending transaction...';

        const hash = await walletClient.writeContract({
            address: tokenAddress as `0x${string}`,
            abi,
            functionName: 'transfer',
            args: [toAddress as `0x${string}`, value],
            chain: sepolia,
            // EIP-1559 is default in viem for chains that support it
        });

        spinner.succeed(chalk.green('Transaction sent!'));
        console.log(chalk.yellow('Tx Hash:'), hash);
        console.log(chalk.blue(`Explorer: https://sepolia.etherscan.io/tx/${hash}`));

    } catch (error) {
        spinner.fail('Transfer failed');
        console.error(error);
    }
}

// 4. Set Token Address
export async function setTokenAddress(address: string) {
    if (!address.startsWith('0x') || address.length !== 42) {
        console.error(chalk.red('Invalid address format'));
        return;
    }
    saveTokenAddress(address);
    console.log(chalk.green(`Token address set to: ${address}`));
}
