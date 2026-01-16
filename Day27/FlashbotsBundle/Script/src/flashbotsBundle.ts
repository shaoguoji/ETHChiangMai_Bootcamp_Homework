import MevShareClient from "@flashbots/mev-share-client";
import { ethers, Wallet, JsonRpcProvider } from "ethers";
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

async function main() {
  console.log("=".repeat(60));
  console.log("Flashbots Bundle - OpenspaceNFT Presale (MEV-Share / Ethers v6)");
  console.log("=".repeat(60));

  // Validate environment variables
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
  const buyerPrivateKey = process.env.BUYER_PRIVATE_KEY;
  const nftContractAddress = process.env.NFT_CONTRACT_ADDRESS;

  if (!rpcUrl || !ownerPrivateKey || !buyerPrivateKey || !nftContractAddress) {
    console.error("Missing environment variables. Please check .env file.");
    process.exit(1);
  }

  // Initialize provider and wallets (Ethers v6)
  const provider = new JsonRpcProvider(rpcUrl);
  const ownerWallet = new Wallet(ownerPrivateKey, provider);
  const buyerWallet = new Wallet(buyerPrivateKey, provider);

  console.log("\n📋 Configuration:");
  console.log(`   Owner Address: ${ownerWallet.address}`);
  console.log(`   Buyer Address: ${buyerWallet.address}`);
  console.log(`   NFT Contract: ${nftContractAddress}`);

  // Create auth signer for Flashbots
  // Use private key constructor to ensure it's a Wallet, not HDNodeWallet, to satisfy strict types if needed
  const randomWallet = Wallet.createRandom();
  const authSigner = new Wallet(randomWallet.privateKey, provider);
  console.log(`\n🔐 Flashbots Auth Signer: ${authSigner.address}`);

  // Initialize MEV-Share Client for Sepolia
  // This automatically sets the correct relay URL: https://mev-share-sepolia.flashbots.net
  const mevShare = MevShareClient.useEthereumSepolia(authSigner);
  console.log("✅ MEV-Share Client Initialized");

  // Initialize NFT contract
  const nftContract = new ethers.Contract(nftContractAddress, NFT_ABI, provider);

  // Get current state
  const isPresaleActive = await nftContract.isPresaleActive();
  const nextTokenId = await nftContract.nextTokenId();
  
  console.log("\n📊 Contract State:");
  console.log(`   isPresaleActive: ${isPresaleActive}`);
  console.log(`   nextTokenId: ${nextTokenId.toString()}`);

  // -------------------------------------------------------------
  // Prepare Transactions
  // -------------------------------------------------------------
  
  // Get latest nonce
  const ownerNonce = await provider.getTransactionCount(ownerWallet.address);
  const buyerNonce = await provider.getTransactionCount(buyerWallet.address);

  // Get fee data (Ethers v6 returns BigInts)
  const feeData = await provider.getFeeData();
  // Safe default: 50 gwei maxFee, 2 gwei priority
  const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits("50", "gwei");
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("3", "gwei");

  // Tx 1: Enable Presale (Owner) changes state
  const tx1Request = {
    to: nftContractAddress,
    data: nftContract.interface.encodeFunctionData("enablePresale", []),
    nonce: ownerNonce,
    gasLimit: 150000,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: 11155111,
    type: 2,
  };

  // Tx 2: Buy NFT (Buyer)
  const presaleAmount = 1;
  const presaleValue = ethers.parseEther((presaleAmount * 0.01).toString());
  const tx2Request = {
    to: nftContractAddress,
    data: nftContract.interface.encodeFunctionData("presale", [presaleAmount]),
    value: presaleValue,
    nonce: buyerNonce,
    gasLimit: 250000,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: 11155111,
    type: 2,
  };

  console.log("\n🖋️  Signing Transactions...");
  const signedTx1 = await ownerWallet.signTransaction(tx1Request);
  const signedTx2 = await buyerWallet.signTransaction(tx2Request);
  console.log("   Signed Tx 1 (Enable)");
  console.log("   Signed Tx 2 (Buy)");

  // -------------------------------------------------------------
  // Send Bundle
  // -------------------------------------------------------------

  const currentBlock = await provider.getBlockNumber();
  const targetBlock = currentBlock + 1;
  
  console.log(`\n📤 Sending bundle to block ${targetBlock} (and next 5)...`);

  const bundleParams = {
      inclusion: {
          block: targetBlock,
          maxBlock: targetBlock + 5,
      },
      body: [
          { tx: signedTx1, canRevert: false },
          { tx: signedTx2, canRevert: false },
      ],
      privacy: {
          builders: ["flashbots"], // Send to Flashbots builders
          // hints removed to avoid type issues
      }
  };

  try {
      const sendResult = await mevShare.sendBundle(bundleParams);
      console.log(`   ✅ Bundle sent! Bundle Hash: ${sendResult.bundleHash}`);
      
      // We can't easily wait for inclusion with mev-share-client in the same way as the old provider
      // checking logic would need to be manual (monitoring blocks).
      // For now, getting a Bundle Hash confirms the RELAY accepted it.
      
      console.log("\n   Monitor the following Transaction Hashes on Etherscan/Sepolia:");
      console.log(`   Tx1: ${ethers.keccak256(signedTx1)}`);
      console.log(`   Tx2: ${ethers.keccak256(signedTx2)}`);

  } catch (e: any) {
      console.error(`   ❌ Send Bundle Error:`, e);
      if (e.response) {
          console.error("   Response Data:", e.response.data);
      }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
