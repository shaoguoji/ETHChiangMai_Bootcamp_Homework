import { useState, useMemo } from 'react';
import { CONTRACTS } from '../config/contracts';
import { WHITELIST_ADDRESSES } from '../config/whitelist';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useSignTypedData, useChainId } from 'wagmi';
import { parseEther, keccak256, encodePacked, parseSignature, encodeFunctionData } from 'viem';
import { MerkleTree } from 'merkletreejs';

interface NFTCardProps {
    tokenId: bigint;
    price: bigint; // 0 if not listed
    owner: string;
    isOwner: boolean;
    refetch: () => void;
}

export function NFTCard({ tokenId, price, owner, isOwner, refetch }: NFTCardProps) {
    const { address } = useAccount();
    const chainId = useChainId();
    const { writeContractAsync, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
    const { signTypedDataAsync } = useSignTypedData();

    const [customError, setCustomError] = useState<string>('');

    // --- Data Fetching ---
    const { data: isApproved, refetch: refetchApproval } = useReadContract({
        address: CONTRACTS.BaseERC721.address,
        abi: CONTRACTS.BaseERC721.abi,
        functionName: 'isApprovedForAll',
        args: address && isOwner ? [address, CONTRACTS.NFTMarket.address] : undefined,
    });

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: CONTRACTS.HookERC20.address,
        abi: CONTRACTS.HookERC20.abi,
        functionName: 'allowance',
        args: address ? [address, CONTRACTS.NFTMarket.address] : undefined,
    });

    const { data: tokenNonce } = useReadContract({
        address: CONTRACTS.HookERC20.address,
        abi: CONTRACTS.HookERC20.abi,
        functionName: 'nonces',
        args: address ? [address] : undefined,
    });
    
    const { data: tokenName } = useReadContract({
        address: CONTRACTS.HookERC20.address,
        abi: CONTRACTS.HookERC20.abi,
        functionName: 'name',
    });

    // --- Merkle Tree Logic ---
    const { isWhitelisted, proof, root } = useMemo(() => {
        if (!address) return { isWhitelisted: false, proof: [], root: '' };

        const leaves = WHITELIST_ADDRESSES.map((addr) => keccak256(encodePacked(['address'], [addr as `0x${string}`])));
        const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        const leaf = keccak256(encodePacked(['address'], [address]));
        const proof = tree.getHexProof(leaf);
        const root = tree.getHexRoot();
        const verify = tree.verify(proof, leaf, root);

        return { isWhitelisted: verify, proof, root };
    }, [address]);


    // --- Actions ---

    const handleApproveMarket = () => {
        writeContractAsync({
            address: CONTRACTS.BaseERC721.address,
            abi: CONTRACTS.BaseERC721.abi,
            functionName: 'setApprovalForAll',
            args: [CONTRACTS.NFTMarket.address, true]
        });
    };

    const handleList = () => {
        const listPrice = prompt("Enter price in Tokens:");
        if (!listPrice) return;

        writeContractAsync({
            address: CONTRACTS.NFTMarket.address,
            abi: CONTRACTS.NFTMarket.abi,
            functionName: 'list',
            args: [tokenId, parseEther(listPrice)],
        }).catch((err) => setCustomError(err.message));
    };

    const handleBuyNormal = async () => {
         if (!address) return;
         if (allowance !== undefined && allowance < price) {
             // Approve first
             try {
                await writeContractAsync({
                    address: CONTRACTS.HookERC20.address,
                    abi: CONTRACTS.HookERC20.abi,
                    functionName: 'approve',
                    args: [CONTRACTS.NFTMarket.address, price]
                });
             } catch(e: any) { setCustomError(e.message); return; }
         } else {
             // Buy
             try {
                await writeContractAsync({
                    address: CONTRACTS.NFTMarket.address,
                    abi: CONTRACTS.NFTMarket.abi,
                    functionName: 'buyNFT',
                    args: [tokenId]
                });
             } catch(e: any) { setCustomError(e.message); }
         }
    };

    const handleClaim = async () => {
        if (!address || !tokenNonce || !tokenName) return;
        setCustomError('');

        try {
            const value = price / 2n; // 50% discount
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

            // 1. Sign Permit
            const signature = await signTypedDataAsync({
                domain: {
                    name: tokenName as string,
                    version: '1',
                    chainId: chainId,
                    verifyingContract: CONTRACTS.HookERC20.address,
                },
                types: {
                    Permit: [
                        { name: 'owner', type: 'address' },
                        { name: 'spender', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'nonce', type: 'uint256' },
                        { name: 'deadline', type: 'uint256' },
                    ],
                },
                primaryType: 'Permit',
                message: {
                    owner: address,
                    spender: CONTRACTS.NFTMarket.address,
                    value: value,
                    nonce: tokenNonce,
                    deadline: deadline,
                },
            });

            const { v, r, s } = parseSignature(signature);

             // 2. Prepare Multicall Data // BUG: encodeFunctionData is better from viem, but here we can rely on wagmi/viem internals or constructing manually if ABI is known.
             // However, writeContractAsync takes function name and args. To use multicall, we need validation.
             // Actually, implementing 'permitPrePay' transaction via multicall is tricky with `writeContract` if we don't construct calldata manually.
             // But wait, `multicall` takes `bytes[]`. We need to encode the calls. `viem` `encodeFunctionData` is needed.

             // We need to import encodeFunctionData and the ABI objects.
             // For now, let's assume we can import them or access them.
             // Since I can't easily import `encodeFunctionData` without importing ABI const, I will use `encodeFunctionData` from 'viem'.
             
             /* 
                We need to dynamically import encodeFunctionData or use it if available.
                It is available in 'viem'.
             */
        } catch (error: any) {
             console.error(error);
             setCustomError(error.message);
        }
    };

    // Since handleClaim requires encoding, I will separate it out to a clearer implementation below in a replacement step if needed, 
    // but I'll try to include it here properly.
    
    // START REPLACEMENT (Complete Function)

    // ... Imports as above ...

// (Re-rendering logic for clarity in this thought block, actual replacement will be precise)
// I need `encodeFunctionData` from `viem`.
// I need `CONTRACTS` access.

    return (
        <div className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
             <div className="aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-8 group-hover:scale-105 transition-transform duration-500">
                <div className="text-center">
                    <div className="text-4xl mb-2">🎨</div>
                    <div className="text-gray-400 font-semibold text-lg">NFT #{tokenId.toString()}</div>
                </div>
            </div>

            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                     <div>
                        <h3 className="font-bold text-gray-900 text-lg">Abstract Art #{tokenId.toString()}</h3>
                        <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                            {owner.slice(0, 6)}...{owner.slice(-4)}
                        </p>
                    </div>
                    {price > 0n && (
                        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                            Listed
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-50">
                    <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500">Price</span>
                         <span className="text-indigo-600 font-bold text-lg">{Number(price) / 1e18} Token</span>
                    </div>

                    {!isOwner && price > 0n && (
                        <div className="flex flex-col gap-2 mt-2">
                             {/* Whitelist Option */}
                             {isWhitelisted ? (
                                 <div className="p-2 bg-yellow-50 rounded border border-yellow-100">
                                     <div className="text-xs text-yellow-700 font-bold mb-1">🎉 Whitelist Discount (50% Off)</div>
                                     <div className="text-lg font-bold text-indigo-700 mb-2">{(Number(price) / 2 / 1e18).toFixed(2)} Token</div>
                                     <button
                                         onClick={handleClaimWithMulticall}
                                         disabled={isPending || isConfirming}
                                         className="w-full py-2 text-xs font-bold text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 shadow-md transition-all disabled:opacity-50"
                                     >
                                         {isPending || isConfirming ? 'Processing...' : 'Sign Permit & Claim'}
                                     </button>
                                 </div>
                             ) : (
                                  <div className="p-2 bg-gray-50 rounded text-center text-xs text-gray-500">
                                      Not Whitelisted
                                  </div>
                             )}

                             {/* Normal Buy Option */}
                             <button
                                 onClick={handleBuyNormal}
                                 disabled={isPending || isConfirming}
                                 className="w-full py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                             >
                                 {allowance !== undefined && allowance < price ? 'Approve Token & Buy' : 'Buy Normal (Full Price)'}
                             </button>
                        </div>
                    )}

                    {isOwner && price === 0n && (
                         <button
                            onClick={!isApproved ? handleApproveMarket : handleList}
                            disabled={isPending || isConfirming || (isApproved && false)}
                            className="w-full py-2 text-xs font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                        >
                            {!isApproved ? 'Approve Market' : 'List for Sale'}
                        </button>
                    )}
                </div>

                {customError && (
                    <div className="mt-2 text-xs text-red-500 break-words bg-red-50 p-2 rounded">
                        {customError}
                    </div>
                )}
            </div>
        </div>
    );

    // Helper for Multicall
    async function handleClaimWithMulticall() {
        if (!address) {
            console.error("Missing address");
            return;
        }
        if (tokenNonce === undefined) {
             console.error("Missing tokenNonce");
             return;
        }
        if (!tokenName) {
             console.error("Missing tokenName");
             return;
        }
        setCustomError('');

        try {
            const value = price / 2n; // 50% discount
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

            // 1. Sign Permit
            const signature = await signTypedDataAsync({
                domain: {
                    name: tokenName as string,
                    version: '1',
                    chainId: chainId,
                    verifyingContract: CONTRACTS.HookERC20.address,
                },
                types: {
                    Permit: [
                        { name: 'owner', type: 'address' },
                        { name: 'spender', type: 'address' },
                        { name: 'value', type: 'uint256' },
                        { name: 'nonce', type: 'uint256' },
                        { name: 'deadline', type: 'uint256' },
                    ],
                },
                primaryType: 'Permit',
                message: {
                    owner: address,
                    spender: CONTRACTS.NFTMarket.address,
                    value: value,
                    nonce: tokenNonce,
                    deadline: deadline,
                },
            });

            const { v, r, s } = parseSignature(signature);

            // 2. Encode Calls
            
            const call1 = encodeFunctionData({
                abi: CONTRACTS.NFTMarket.abi,
                functionName: 'permitPrePay',
                args: [address, CONTRACTS.NFTMarket.address, value, deadline, Number(v), r, s]
            });

            const call2 = encodeFunctionData({
                abi: CONTRACTS.NFTMarket.abi,
                functionName: 'claimNFT',
                args: [tokenId, proof as `0x${string}`[]]
            });

            // 3. Multicall
             await writeContractAsync({
                address: CONTRACTS.NFTMarket.address,
                abi: CONTRACTS.NFTMarket.abi,
                functionName: 'multicall',
                args: [[call1, call2]]
            });

        } catch (error: any) {
             console.error(error);
             setCustomError(error.message);
        }
    }
}
