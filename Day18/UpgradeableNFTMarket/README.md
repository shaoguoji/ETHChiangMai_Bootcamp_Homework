# Upgradeable NFT Market

可升级的 NFT 市场合约，使用 UUPS 代理模式实现合约升级。

## 部署日志

```
UpgradeableNFTMarket git:(main) ✗ make deploy sepolia

================================================
Deploying NFTMarketV1 to sepolia
Account: shaoguoji
Verify: Yes
================================================
forge script script/DeployUpgradeableNFTMarket.s.sol \
                --rpc-url sepolia \
                --account shaoguoji \
                --broadcast \
                --verify
[⠊] Compiling...
No files changed, compilation skipped
Enter keystore password:
Script ran successfully.

== Logs ==
  HookERC20 deployed at: 0x26AD57072bf92EC8545E21203c8bc8698df70Cd1
  UpgradeableNFT implementation: 0x129Ec3E5165897b55845c59AC8E872B5126c97d7
  UpgradeableNFT proxy: 0x461a78C2b2654784453E780839c6e4221E7d4676
  NFTMarketV1 implementation: 0xe685dEE8c44D09c8b86d2C3604baAbDa5D2859b6
  NFTMarket proxy: 0x96C202E3D202b304640D7b58c86c0469C8306fc3
  
=== Deployment Summary ===
  HookERC20: 0x26AD57072bf92EC8545E21203c8bc8698df70Cd1
  UpgradeableNFT (proxy): 0x461a78C2b2654784453E780839c6e4221E7d4676
  NFTMarket (proxy): 0x96C202E3D202b304640D7b58c86c0469C8306fc3
  NFTMarketV1 version: 1.0.0

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 0.001116558 gwei

Estimated total gas used for script: 9567493

Estimated amount required: 0.000010682660849094 ETH

==========================

##### sepolia
✅  [Success] Hash: 0xe0d7ae57abf3f0930876d347d9f69e4652bcc91620ccfc4d5cf0ba374b303f51
Contract Address: 0x26AD57072bf92EC8545E21203c8bc8698df70Cd1
Block: 9964588
Paid: 0.000001554028386862 ETH (1396946 gas * 0.001112447 gwei)


##### sepolia
✅  [Success] Hash: 0x2e02f0e30012df6ca1faacc0e1ac5b02216598a7ec540a0f770566dd5ca5fab0
Contract Address: 0x129Ec3E5165897b55845c59AC8E872B5126c97d7
Block: 9964590
Paid: 0.000003557195013057 ETH (3197631 gas * 0.001112447 gwei)


##### sepolia
✅  [Success] Hash: 0x75f86473ea20dc6d7bbd5984920227878101678850e99a5e164d8aae44cfae6b
Contract Address: 0x461a78C2b2654784453E780839c6e4221E7d4676
Block: 9964591
Paid: 0.000000324585335872 ETH (291776 gas * 0.001112447 gwei)


##### sepolia
✅  [Success] Hash: 0x6791d848873ee8fc07c82e476662046bd3535fa6903b696ffe82ccd478a8db0b
Contract Address: 0xe685dEE8c44D09c8b86d2C3604baAbDa5D2859b6
Block: 9964592
Paid: 0.000002481498812149 ETH (2230667 gas * 0.001112447 gwei)


##### sepolia
✅  [Success] Hash: 0x3a79cfb4f236d89ab175f5a5494a79d37db8d0420b6a720833a3af8e3e58af57
Contract Address: 0x96C202E3D202b304640D7b58c86c0469C8306fc3
Block: 9964593
Paid: 0.000000269870742624 ETH (242592 gas * 0.001112447 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.000008187178290564 ETH (7359612 gas * avg 0.001112447 gwei)
                                                                                                                              

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
##
Start verification for (5) contracts
Start verifying contract `0x26AD57072bf92EC8545E21203c8bc8698df70Cd1` deployed on sepolia
EVM version: cancun
Compiler version: 0.8.24

Submitting verification for [src/HookERC20.sol:HookERC20] 0x26AD57072bf92EC8545E21203c8bc8698df70Cd1.
Submitted contract for verification:
        Response: `OK`
        GUID: `zmpzbiidaeecdzpbgnqt1xknsfij3xeun3pgftksgsdygjzjww`
        URL: https://sepolia.etherscan.io/address/0x26ad57072bf92ec8545e21203c8bc8698df70cd1
Contract verification status:
Response: `NOTOK`
Details: `Pending in queue`
Warning: Verification is still pending...; waiting 15 seconds before trying again (7 tries remaining)
Contract verification status:
Response: `OK`
Details: `Pass - Verified`
Contract successfully verified
Start verifying contract `0x129Ec3E5165897b55845c59AC8E872B5126c97d7` deployed on sepolia
EVM version: cancun
Compiler version: 0.8.24

Submitting verification for [src/UpgradeableNFT.sol:UpgradeableNFT] 0x129Ec3E5165897b55845c59AC8E872B5126c97d7.
Submitted contract for verification:
        Response: `OK`
        GUID: `upamrztyj7qgtyeck4tgszmxwsa3evsambespthkrjvhpnkflg`
        URL: https://sepolia.etherscan.io/address/0x129ec3e5165897b55845c59ac8e872b5126c97d7
Contract verification status:
Response: `NOTOK`
Details: `Pending in queue`
Warning: Verification is still pending...; waiting 15 seconds before trying again (7 tries remaining)
Contract verification status:
Response: `OK`
Details: `Pass - Verified`
Contract successfully verified
Start verifying contract `0x461a78C2b2654784453E780839c6e4221E7d4676` deployed on sepolia
EVM version: cancun
Compiler version: 0.8.24
Constructor args: 000000000000000000000000129ec3e5165897b55845c59ac8e872b5126c97d700000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000124a6487c53000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000f5570677261646561626c65204e465400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004554e465400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001868747470733a2f2f6578616d706c652e636f6d2f6e66742f000000000000000000000000000000000000000000000000000000000000000000000000

Submitting verification for [lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy] 0x461a78C2b2654784453E780839c6e4221E7d4676.
Submitted contract for verification:
        Response: `OK`
        GUID: `xeg9evt3rzqqupffuiicnrn9qzuf987vgnzmwdwjyl38kbrh2i`
        URL: https://sepolia.etherscan.io/address/0x461a78c2b2654784453e780839c6e4221e7d4676
Contract verification status:
Response: `NOTOK`
Details: `Pending in queue`
Warning: Verification is still pending...; waiting 15 seconds before trying again (7 tries remaining)
Contract verification status:
Response: `OK`
Details: `Pass - Verified`
Contract successfully verified
Start verifying contract `0xe685dEE8c44D09c8b86d2C3604baAbDa5D2859b6` deployed on sepolia
EVM version: cancun
Compiler version: 0.8.24

Submitting verification for [src/NFTMarketV1.sol:NFTMarketV1] 0xe685dEE8c44D09c8b86d2C3604baAbDa5D2859b6.
Submitted contract for verification:
        Response: `OK`
        GUID: `ttnau6hxj5snujtwaxgtbhnzd3nepf9mdrfezhutwxursbrigq`
        URL: https://sepolia.etherscan.io/address/0xe685dee8c44d09c8b86d2c3604baabda5d2859b6
Contract verification status:
Response: `NOTOK`
Details: `Pending in queue`
Warning: Verification is still pending...; waiting 15 seconds before trying again (7 tries remaining)
Contract verification status:
Response: `OK`
Details: `Pass - Verified`
Contract successfully verified
Start verifying contract `0x96C202E3D202b304640D7b58c86c0469C8306fc3` deployed on sepolia
EVM version: cancun
Compiler version: 0.8.24
Constructor args: 000000000000000000000000e685dee8c44d09c8b86d2c3604baabda5d2859b600000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000044485cc95500000000000000000000000026ad57072bf92ec8545e21203c8bc8698df70cd1000000000000000000000000461a78c2b2654784453e780839c6e4221e7d467600000000000000000000000000000000000000000000000000000000

Submitting verification for [lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy] 0x96C202E3D202b304640D7b58c86c0469C8306fc3.
Submitted contract for verification:
        Response: `OK`
        GUID: `1tr8xl6nmri4i5wfau5nwtcpqemv73bvyyefmwutzbkuaseqvc`
        URL: https://sepolia.etherscan.io/address/0x96c202e3d202b304640d7b58c86c0469c8306fc3
Contract verification status:
Response: `NOTOK`
Details: `Pending in queue`
Warning: Verification is still pending...; waiting 15 seconds before trying again (7 tries remaining)
Contract verification status:
Response: `NOTOK`
Details: `Already Verified`
Contract source code already verified
All (5) contracts were verified!

Transactions saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day18/UpgradeableNFTMarket/broadcast/DeployUpgradeableNFTMarket.s.sol/11155111/run-latest.json

Sensitive values saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day18/UpgradeableNFTMarket/cache/DeployUpgradeableNFTMarket.s.sol/11155111/run-latest.json
```

## 升级日志

```
UpgradeableNFTMarket git:(main) ✗ make upgrade sepolia

================================================
Upgrading to NFTMarketV2 on sepolia
Account: shaoguoji
Verify: Yes
================================================
forge script script/UpgradeToV2.s.sol \
                --rpc-url sepolia \
                --account shaoguoji \
                --broadcast \
                --verify
[⠊] Compiling...
[⠆] Compiling 1 files with Solc 0.8.24
[⠰] Solc 0.8.24 finished in 1.25s
Compiler run successful!
Enter keystore password:
Script ran successfully.

== Logs ==
  NFTMarket proxy: 0x96C202E3D202b304640D7b58c86c0469C8306fc3
  Current version: 1.0.0
  NFTMarketV2 implementation deployed at: 0xcFe26cE03c2B327A55312Fb2bc8f91DbA1221B36
  New version: 2.0.0
  
=== Upgrade Summary ===
  Proxy address (unchanged): 0x96C202E3D202b304640D7b58c86c0469C8306fc3
  Old implementation: NFTMarketV1
  New implementation: 0xcFe26cE03c2B327A55312Fb2bc8f91DbA1221B36
  Version: 1.0.0 -> 2.0.0

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 0.001100193 gwei

Estimated total gas used for script: 4011103

Estimated amount required: 0.000004412987442879 ETH

==========================

##### sepolia
✅  [Success] Hash: 0x456865cc995e93ed263df2361487bfcbc098ef11382af25f07e20c5fd8537c88
Contract Address: 0xcFe26cE03c2B327A55312Fb2bc8f91DbA1221B36
Block: 9964620
Paid: 0.000003349630108056 ETH (3044609 gas * 0.001100184 gwei)


##### sepolia
✅  [Success] Hash: 0xc321d28964a9436a6576b953e1fe3d0f91a27b9e86f05af78427f9fb3eff9690
Block: 9964622
Paid: 0.000000042305375352 ETH (38453 gas * 0.001100184 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.000003391935483408 ETH (3083062 gas * avg 0.001100184 gwei)
                                                                                                                              

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
##
Start verification for (1) contracts
Start verifying contract `0xcFe26cE03c2B327A55312Fb2bc8f91DbA1221B36` deployed on sepolia
EVM version: cancun
Compiler version: 0.8.24

Submitting verification for [src/NFTMarketV2.sol:NFTMarketV2] 0xcFe26cE03c2B327A55312Fb2bc8f91DbA1221B36.
Submitted contract for verification:
        Response: `OK`
        GUID: `vwzetmn4f9a8xli2zkhrxrfjhauxgfqvti3vxm2g1c1vvrmzju`
        URL: https://sepolia.etherscan.io/address/0xcfe26ce03c2b327a55312fb2bc8f91dba1221b36
Contract verification status:
Response: `NOTOK`
Details: `Pending in queue`
Warning: Verification is still pending...; waiting 15 seconds before trying again (7 tries remaining)
Contract verification status:
Response: `OK`
Details: `Pass - Verified`
Contract successfully verified
All (1) contracts were verified!

Transactions saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day18/UpgradeableNFTMarket/broadcast/UpgradeToV2.s.sol/11155111/run-latest.json

Sensitive values saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day18/UpgradeableNFTMarket/cache/UpgradeToV2.s.sol/11155111/run-latest.json
```

## 项目结构

```
src/
├── UpgradeableNFT.sol    # 可升级的 ERC721 合约
├── NFTMarketV1.sol       # NFT 市场 V1 - UUPS 可升级
├── NFTMarketV2.sol       # NFT 市场 V2 - 新增离线签名上架功能
├── HookERC20.sol         # 带回调的 ERC20 代币
└── BaseERC20.sol         # ERC20 基础合约

script/
├── DeployUpgradeableNFTMarket.s.sol  # 部署代理和 V1 实现
└── UpgradeToV2.s.sol                  # 升级到 V2

test/
└── NFTMarketUpgradeable.t.sol        # 完整测试套件
```

## 功能特性

### NFTMarketV1
- `list()` - 上架 NFT
- `buyNFT()` - 购买 NFT
- `tokensReceived()` - 通过回调购买 NFT

### NFTMarketV2 (新增)
- `listWithSignature()` - 使用 EIP-712 离线签名上架 NFT
  - 用户只需一次 `setApprovalForAll` 授权给市场合约
  - 之后每次上架只需签名 `(tokenId, price, nonce)` 即可
  - 任何人可以提交签名完成上架

## 使用方法

### 构建

```bash
forge build
```

### 测试

```bash
forge test
```

### 部署 V1

```bash
forge script script/DeployUpgradeableNFTMarket.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --account <keystore_account>
```

### 升级到 V2

```bash
forge script script/UpgradeToV2.s.sol --rpc-url http://127.0.0.1:8545 --broadcast --account <keystore_account>
```

## 测试用例运行日志

```
$ forge test

Ran 14 tests for test/NFTMarketUpgradeable.t.sol:NFTMarketUpgradeableTest
[PASS] testFuzz_V2_ListWithSignature(uint256,uint256) (runs: 256, μ: 2994057, ~: 2994479)
[PASS] test_Upgrade_OnlyOwner() (gas: 2835705)
[PASS] test_Upgrade_StateConsistency() (gas: 3089022)
[PASS] test_Upgrade_ToV2() (gas: 2977995)
[PASS] test_V1_BuyNFT() (gas: 161148)
[PASS] test_V1_BuyNFT_RevertNotListed() (gas: 19525)
[PASS] test_V1_List() (gas: 92757)
[PASS] test_V1_List_RevertNotApproved() (gas: 35437)
[PASS] test_V1_List_RevertNotOwner() (gas: 63863)
[PASS] test_V1_Version() (gas: 15634)
[PASS] test_V2_ListWithSignature() (gas: 3019856)
[PASS] test_V2_ListWithSignature_RevertInvalidNonce() (gas: 2898708)
[PASS] test_V2_ListWithSignature_RevertInvalidSignature() (gas: 2908125)
[PASS] test_V2_ListWithSignature_RevertReplay() (gas: 2958397)
Suite result: ok. 14 passed; 0 failed; 0 skipped; finished in 98.28ms (131.93ms CPU time)

Ran 1 test suite in 164.72ms (98.28ms CPU time): 14 tests passed, 0 failed, 0 skipped (14 total tests)
```

### 测试用例说明

| 测试名称 | 说明 |
|---------|------|
| `test_V1_Version` | 验证 V1 版本号 |
| `test_V1_List` | 测试上架功能 |
| `test_V1_List_RevertNotOwner` | 非所有者上架失败 |
| `test_V1_List_RevertNotApproved` | 未授权上架失败 |
| `test_V1_BuyNFT` | 测试购买功能 |
| `test_V1_BuyNFT_RevertNotListed` | 购买未上架 NFT 失败 |
| `test_Upgrade_StateConsistency` | **升级前后状态一致性测试** |
| `test_Upgrade_ToV2` | 测试升级到 V2 |
| `test_Upgrade_OnlyOwner` | 仅 owner 可升级 |
| `test_V2_ListWithSignature` | V2 签名上架功能 |
| `test_V2_ListWithSignature_RevertInvalidNonce` | 无效 nonce 签名失败 |
| `test_V2_ListWithSignature_RevertInvalidSignature` | 无效签名失败 |
| `test_V2_ListWithSignature_RevertReplay` | 防重放攻击测试 |
| `testFuzz_V2_ListWithSignature` | 模糊测试签名上架 |

### 状态一致性测试详情

`test_Upgrade_StateConsistency` 验证升级前后以下状态保持一致：
- Owner 地址
- ERC20/ERC721 合约地址
- 所有 NFT 上架价格
- 用户代币余额
- NFT 所有权

## 技术栈

- Solidity ^0.8.24
- Foundry
- OpenZeppelin Contracts 5.x (Initializable, UUPSUpgradeable, ERC1967Proxy)
