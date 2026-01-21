## deploy L1 token

```sh
➜  crossToken git:(main) ✗ make deploy sepolia
================================================
Deploying contract to sepolia
Account: shaoguoji
Verify: Yes
================================================
forge script script/Deploy.s.sol \
                --rpc-url sepolia \
                --account shaoguoji \
                --broadcast \
                --verify
[⠊] Compiling...
No files changed, compilation skipped
Enter keystore password:
Script ran successfully.

== Logs ==
  ================================================
  Deploying MyToken (CRT)
  ================================================
  Chain ID: 11155111
  Deployer: 0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38
  ================================================
  MyToken deployed to: 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7
  Initial supply: 1000000000000000000000000
  Deployment saved to: deployments/MyToken_11155111.json
  ================================================

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 1.960254666 gwei

Estimated total gas used for script: 1293760

Estimated amount required: 0.00253609907668416 ETH

==========================

##### sepolia
✅  [Success] Hash: 0x60760ce2014ee1392739a91e0f6fa782702d3b8ff3448a1ef3d9c954de9e0861
Contract Address: 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7
Block: 10090010
Paid: 0.0011080397946176 ETH (995200 gas * 1.113384038 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.0011080397946176 ETH (995200 gas * avg 1.113384038 gwei)
                                                                                                                            

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
##
Start verification for (1) contracts
Start verifying contract `0xd0D74D3F48C888759ed40139082a593c2E1f1Af7` deployed on sepolia
EVM version: prague
Compiler version: 0.8.30
Constructor args: 00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000f43726f7373436861696e546f6b656e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034352540000000000000000000000000000000000000000000000000000000000

Submitting verification for [src/MyToken.sol:MyToken] 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7.
Warning: Could not detect deployment: Unable to locate ContractCode at 0xd0d74d3f48c888759ed40139082a593c2e1f1af7; waiting 5 seconds before trying again (4 tries remaining)

Submitting verification for [src/MyToken.sol:MyToken] 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7.
Warning: Could not detect deployment: Unable to locate ContractCode at 0xd0d74d3f48c888759ed40139082a593c2e1f1af7; waiting 5 seconds before trying again (3 tries remaining)

Submitting verification for [src/MyToken.sol:MyToken] 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7.
Warning: Could not detect deployment: Unable to locate ContractCode at 0xd0d74d3f48c888759ed40139082a593c2e1f1af7; waiting 5 seconds before trying again (2 tries remaining)

Submitting verification for [src/MyToken.sol:MyToken] 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7.
Warning: Could not detect deployment: Unable to locate ContractCode at 0xd0d74d3f48c888759ed40139082a593c2e1f1af7; waiting 5 seconds before trying again (1 tries remaining)

Submitting verification for [src/MyToken.sol:MyToken] 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7.
Warning: Could not detect deployment: Unable to locate ContractCode at 0xd0d74d3f48c888759ed40139082a593c2e1f1af7; waiting 5 seconds before trying again (0 tries remaining)

Submitting verification for [src/MyToken.sol:MyToken] 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7.
Submitted contract for verification:
        Response: `OK`
        GUID: `vfhcszskmjyj3apg32epwkr98dhqlbuqpy1cdftpexjhndgdwv`
        URL: https://sepolia.etherscan.io/address/0xd0d74d3f48c888759ed40139082a593c2e1f1af7
Contract verification status:
Response: `NOTOK`
Details: `Pending in queue`
Warning: Verification is still pending...; waiting 15 seconds before trying again (7 tries remaining)
Contract verification status:
Response: `OK`
Details: `Pass - Verified`
Contract successfully verified
All (1) contracts were verified!

Transactions saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day31/crossToken/broadcast/Deploy.s.sol/11155111/run-latest.json

Sensitive values saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day31/crossToken/cache/Deploy.s.sol/11155111/run-latest.json

➜
```

## deploy L2 token

```sh
➜  crossToken git:(main) ✗ forge script script/BridgeToken.s.sol --rpc-url base_sepolia --account shaoguoji --broadcast
[⠊] Compiling...
No files changed, compilation skipped
Enter keystore password:
Script ran successfully.

== Logs ==
  ================================================
  Cross-Chain Token Bridge Script
  ================================================
  Current Chain ID: 84532
  Deployer: 0x1804c8AB1F12E6bbf3894d4083f33e07309d1f38
  ================================================
  Phase: Deploy L2 Token on Base Sepolia
  ================================================
  L1 Token Address (from deployment file): 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7
  ================================================
  L2 Token deployed at: 0x7716C9C084439824Da368E49A3b4DEFE73d59a89
  Deployment saved to: deployments/MyTokenL2_84532.json
  ================================================

## Setting up 1 EVM.

==========================

Chain 84532

Estimated gas price: 0.0014 gwei

Estimated total gas used for script: 1785867

Estimated amount required: 0.0000025002138 ETH

==========================

##### base-sepolia
✅  [Success] Hash: 0x9ef8dcce38f1e24e4099eba9fbe9bd7ad3c9a3af94e69b9430c32dddcd928cd0
Block: 36604977
Paid: 0.0000015515232 ETH (1292936 gas * 0.0012 gwei)

✅ Sequence #1 on base-sepolia | Total Paid: 0.0000015515232 ETH (1292936 gas * avg 0.0012 gwei)
                                                                                                                            

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day31/crossToken/broadcast/BridgeToken.s.sol/84532/run-latest.json

Sensitive values saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day31/crossToken/cache/BridgeToken.s.sol/84532/run-latest.json
```

## cross bridge

```sh
➜  crossToken git:(main) ✗ forge script script/BridgeToken.s.sol --rpc-url sepolia --account shaoguoji --broadcast
[⠊] Compiling...
No files changed, compilation skipped
Enter keystore password:
Script ran successfully.

== Logs ==
  ================================================
  Cross-Chain Token Bridge Script
  ================================================
  Current Chain ID: 11155111
  Sender (env): 0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd
  ================================================
  Phase: Bridge Token from Sepolia to Base Sepolia
  ================================================
  L1 Token Address (from deployment file): 0xd0D74D3F48C888759ed40139082a593c2E1f1Af7
  L2 Token Address (from deployment file): 0x7716C9C084439824Da368E49A3b4DEFE73d59a89
  Bridge Amount: 100000000000000000000
  Current L1 Token Balance: 1000000000000000000000000
  Approving L1StandardBridge...
  Approved L1StandardBridge for amount: 100000000000000000000
  Calling bridgeERC20...
  ================================================
  Bridge transaction sent!
  Tokens will arrive on Base Sepolia after finalization.
  ================================================

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 1.824823204 gwei

Estimated total gas used for script: 992165

Estimated amount required: 0.00181052571419666 ETH

==========================

##### sepolia
✅  [Success] Hash: 0xaa85f0ccfe41611ee64312d3b2d5e13748677aed5105534ce68bed57a3d230cf
Block: 10090771
Paid: 0.0000484025982966 ETH (46940 gas * 1.03115889 gwei)


##### sepolia
✅  [Success] Hash: 0x4f5095fcfe511e4e2fa762dd8f7fb240161ba8748d6c6485e37fac44ca328791
Block: 10090773
Paid: 0.00069001808236272 ETH (634434 gas * 1.08761208 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.00073842068065932 ETH (681374 gas * avg 1.059385485 gwei)
                                                                                                                             

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day31/crossToken/broadcast/BridgeToken.s.sol/11155111/run-latest.json

Sensitive values saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day31/crossToken/cache/BridgeToken.s.sol/11155111/run-latest.json
```