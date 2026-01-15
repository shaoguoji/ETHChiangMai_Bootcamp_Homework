import { ethers, Wallet, providers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

// OpenspaceNFT ABI (only the functions we need)
const NFT_ABI = [
  "function enablePresale() external",
  "function presale(uint256 amount) external payable",
  "function isPresaleActive() view returns (bool)",
  "function nextTokenId() view returns (uint256)",
  "function owner() view returns (address)",
  "function balanceOf(address owner) view returns (uint256)",
];

// Flashbots Sepolia relay URL
const FLASHBOTS_RELAY_SEPOLIA = "https://relay-sepolia.flashbots.net";

// Helper function to make signed Flashbots RPC calls
async function flashbotsRpc(
  authSigner: Wallet,
  method: string,
  params: any[]
): Promise<any> {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: method,
    params: params,
  });

  // Create the signature for X-Flashbots-Signature header
  // Sign keccak256 hash of body as per Flashbots docs
  const messageHash = ethers.utils.id(body);
  const signature = await authSigner.signMessage(messageHash);
  const flashbotsSignature = `${authSigner.address}:${signature}`;

  const response = await fetch(FLASHBOTS_RELAY_SEPOLIA, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Flashbots-Signature": flashbotsSignature,
    },
    body: body,
  });

  const json = await response.json();
  return json;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Flashbots Bundle - OpenspaceNFT Presale");
  console.log("=".repeat(60));

  // Validate environment variables
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
  const buyerPrivateKey = process.env.BUYER_PRIVATE_KEY;
  const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!rpcUrl || !ownerPrivateKey || !buyerPrivateKey || !nftContractAddress) {
    console.error("Missing environment variables. Please check .env file.");
    console.error("Required: SEPOLIA_RPC_URL, OWNER_PRIVATE_KEY, BUYER_PRIVATE_KEY, NFT_CONTRACT_ADDRESS");
    process.exit(1);
  }

  // Initialize provider and wallets
  const provider = new providers.JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPrivateKey, provider);
  const buyerWallet = new Wallet(buyerPrivateKey, provider);

  console.log("\n📋 Configuration:");
  console.log(`   Owner Address: ${ownerWallet.address}`);
  console.log(`   Buyer Address: ${buyerWallet.address}`);
  console.log(`   NFT Contract: ${nftContractAddress}`);

  // Check balances
  const ownerBalance = await provider.getBalance(ownerWallet.address);
  const buyerBalance = await provider.getBalance(buyerWallet.address);
  console.log(`   Owner Balance: ${ethers.utils.formatEther(ownerBalance)} ETH`);
  console.log(`   Buyer Balance: ${ethers.utils.formatEther(buyerBalance)} ETH`);

  // Initialize NFT contract
  const nftContract = new ethers.Contract(nftContractAddress, NFT_ABI, provider);

  // Check current presale status
  const isPresaleActive = await nftContract.isPresaleActive();
  const nextTokenId = await nftContract.nextTokenId();
  const contractOwner = await nftContract.owner();

  console.log("\n📊 Contract State:");
  console.log(`   isPresaleActive: ${isPresaleActive}`);
  console.log(`   nextTokenId: ${nextTokenId.toString()}`);
  console.log(`   Contract Owner: ${contractOwner}`);

  if (contractOwner.toLowerCase() !== ownerWallet.address.toLowerCase()) {
    console.error("\n❌ Error: Owner wallet does not match contract owner!");
    process.exit(1);
  }

  // Create auth signer for Flashbots
  const authSigner = Wallet.createRandom();
  console.log("\n🔐 Flashbots Auth Signer:", authSigner.address);

  // Get current block number and target block
  const blockNumber = await provider.getBlockNumber();
  const targetBlock = blockNumber + 2;

  console.log(`\n🎯 Current Block: ${blockNumber}`);
  console.log(`   Target Block: ${targetBlock}`);

  // Get gas price
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas || ethers.utils.parseUnits("50", "gwei");
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.utils.parseUnits("2", "gwei");

  console.log(`\n⛽ Gas Settings:`);
  console.log(`   Max Fee: ${ethers.utils.formatUnits(maxFeePerGas, "gwei")} gwei`);
  console.log(`   Priority Fee: ${ethers.utils.formatUnits(maxPriorityFeePerGas, "gwei")} gwei`);

  // Get nonces
  const ownerNonce = await provider.getTransactionCount(ownerWallet.address, "latest");
  const buyerNonce = await provider.getTransactionCount(buyerWallet.address, "latest");

  console.log(`\n🔢 Nonces:`);
  console.log(`   Owner Nonce: ${ownerNonce}`);
  console.log(`   Buyer Nonce: ${buyerNonce}`);

  // Build bundle transactions
  const presaleAmount = 1;
  const presaleValue = ethers.utils.parseEther((presaleAmount * 0.01).toString());

  console.log(`\n📦 Building Bundle...`);
  console.log(`   TX1: enablePresale() from Owner`);
  console.log(`   TX2: presale(${presaleAmount}) from Buyer with ${ethers.utils.formatEther(presaleValue)} ETH`);

  // Transaction 1: enablePresale (from owner)
  const enablePresaleTx = {
    to: nftContractAddress,
    data: nftContract.interface.encodeFunctionData("enablePresale"),
    gasLimit: 100000,
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
    nonce: ownerNonce,
    type: 2,
    chainId: 11155111,
  };

  // Transaction 2: presale (from buyer)
  const presaleTx = {
    to: nftContractAddress,
    data: nftContract.interface.encodeFunctionData("presale", [presaleAmount]),
    value: presaleValue,
    gasLimit: 200000,
    maxFeePerGas: maxFeePerGas,
    maxPriorityFeePerGas: maxPriorityFeePerGas,
    nonce: buyerNonce,
    type: 2,
    chainId: 11155111,
  };

  // Sign transactions
  const signedEnablePresaleTx = await ownerWallet.signTransaction(enablePresaleTx);
  const signedPresaleTx = await buyerWallet.signTransaction(presaleTx);

  const tx1Hash = ethers.utils.keccak256(signedEnablePresaleTx);
  const tx2Hash = ethers.utils.keccak256(signedPresaleTx);

  console.log("\n✅ Transactions signed successfully");
  console.log(`   TX1 Hash: ${tx1Hash}`);
  console.log(`   TX2 Hash: ${tx2Hash}`);

  // Send bundle using mev_sendBundle (new format for Sepolia)
  console.log("\n📤 Sending bundle to Flashbots relay using mev_sendBundle...\n");

  let bundleIncluded = false;
  let bundleHash = "";
  let bundleStats: any = null;

  for (let i = 0; i < 10; i++) {
    const block = targetBlock + i;
    const blockHex = `0x${block.toString(16)}`;

    console.log(`   Submitting to block ${block} (${blockHex})...`);

    // Use mev_sendBundle format
    const bundleParams = {
      version: "v0.1",
      inclusion: {
        block: blockHex,
        maxBlock: `0x${(block + 5).toString(16)}`,
      },
      body: [
        { tx: signedEnablePresaleTx, canRevert: false },
        { tx: signedPresaleTx, canRevert: false },
      ],
    };

    try {
      const response = await flashbotsRpc(authSigner, "mev_sendBundle", [bundleParams]);

      if (response.error) {
        console.log(`   ❌ Error: ${response.error.message}`);
        
        // If it's a backend health issue, wait and retry
        if (response.error.message.includes("no backend")) {
          console.log("      Waiting 12s for next block...");
          await new Promise(r => setTimeout(r, 12000));
          continue;
        }
      } else if (response.result) {
        bundleHash = response.result.bundleHash;
        console.log(`   ✅ Bundle submitted! Hash: ${bundleHash}`);
        
        // Wait for the target block
        console.log(`\n⏳ Waiting for block ${block} to be mined...`);
        
        // Wait for target block
        let currentBlock = await provider.getBlockNumber();
        while (currentBlock < block) {
          await new Promise(r => setTimeout(r, 3000));
          currentBlock = await provider.getBlockNumber();
          console.log(`   Current block: ${currentBlock}, waiting for ${block}...`);
        }

        // Check if transactions were included
        console.log(`\n   Checking inclusion in block ${block}...`);
        
        try {
          const tx1Receipt = await provider.getTransactionReceipt(tx1Hash);
          const tx2Receipt = await provider.getTransactionReceipt(tx2Hash);

          if (tx1Receipt && tx2Receipt) {
            if (tx1Receipt.blockNumber === tx2Receipt.blockNumber) {
              console.log(`\n   🎉 Bundle INCLUDED in block ${tx1Receipt.blockNumber}!`);
              bundleIncluded = true;

              console.log("\n   📜 Transaction Receipts:");
              console.log(`      TX1 (enablePresale):`);
              console.log(`         Hash: ${tx1Receipt.transactionHash}`);
              console.log(`         Block: ${tx1Receipt.blockNumber}`);
              console.log(`         Gas Used: ${tx1Receipt.gasUsed.toString()}`);
              console.log(`         Status: ${tx1Receipt.status === 1 ? "Success" : "Failed"}`);

              console.log(`      TX2 (presale):`);
              console.log(`         Hash: ${tx2Receipt.transactionHash}`);
              console.log(`         Block: ${tx2Receipt.blockNumber}`);
              console.log(`         Gas Used: ${tx2Receipt.gasUsed.toString()}`);
              console.log(`         Status: ${tx2Receipt.status === 1 ? "Success" : "Failed"}`);

              // Try to get bundle stats
              try {
                const statsResponse = await flashbotsRpc(authSigner, "flashbots_getBundleStatsV2", [
                  { bundleHash: bundleHash, blockNumber: blockHex }
                ]);
                if (statsResponse.result) {
                  bundleStats = statsResponse.result;
                }
              } catch (e) {
                console.log("   ⚠️ Could not retrieve bundle stats");
              }

              break;
            }
          }
        } catch (e) {
          // Transactions not found
        }

        console.log(`   ⏭️ Block ${block} passed without inclusion, trying next block...`);
      }
    } catch (error: any) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }

  // Final summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 FINAL SUMMARY");
  console.log("=".repeat(60));

  if (bundleIncluded) {
    console.log("\n✅ Bundle successfully included!");
    console.log("\n📝 Transaction Hashes:");
    console.log(`   TX1 (enablePresale): ${tx1Hash}`);
    console.log(`   Explorer: https://sepolia.etherscan.io/tx/${tx1Hash}`);
    console.log(`   TX2 (presale): ${tx2Hash}`);
    console.log(`   Explorer: https://sepolia.etherscan.io/tx/${tx2Hash}`);

    if (bundleStats) {
      console.log("\n📊 Bundle Stats (flashbots_getBundleStatsV2):");
      console.log(JSON.stringify(bundleStats, null, 2));
    }

    // Verify final state
    const finalPresaleActive = await nftContract.isPresaleActive();
    const finalNextTokenId = await nftContract.nextTokenId();
    const buyerNFTBalance = await nftContract.balanceOf(buyerWallet.address);

    console.log("\n✅ Final Contract State:");
    console.log(`   isPresaleActive: ${finalPresaleActive}`);
    console.log(`   nextTokenId: ${finalNextTokenId.toString()}`);
    console.log(`   Buyer NFT Balance: ${buyerNFTBalance.toString()}`);
  } else {
    console.log("\n❌ Bundle was not included in any of the target blocks.");
    console.log("   This can happen due to network congestion or backend issues.");
    console.log("\n   Computed transaction hashes for reference:");
    console.log(`   TX1: ${tx1Hash}`);
    console.log(`   TX2: ${tx2Hash}`);
    console.log("\n   You can try running the script again.");
  }

  console.log("\n" + "=".repeat(60));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
