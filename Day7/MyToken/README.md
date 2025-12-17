# Install dependences

```sh
forge install OpenZeppelin/openzeppelin-contracts
```

# rpc config

foundry.toml

```toml
[rpc_endpoints] 
local = "http://127.0.0.1:8545"
sepolia = "https://0xrpc.io/sep"
```

# key config

using keysotre import from private key and set password.

```sh
cast wallet import --private-key <PRIVATE_KEY> <ACCOUNT_NAME>
```

# Deploy

```sh
forge script ./script/DeployMyToken.s.sol --rpc-url sepolia --account <ACCOUNT_NAME> --broadcast
```

# Log

```sh
➜  MyToken git:(main) ✗ forge script ./script/DeployMyToken.s.sol --rpc-url sepolia --account shaoguoji --broadcast

[⠊] Compiling...
[⠘] Compiling 22 files with Solc 0.8.25
[⠃] Solc 0.8.25 finished in 768.84ms
Compiler run successful!
Enter keystore password:
Script ran successfully.

## Setting up 1 EVM.

==========================

Chain 11155111

Estimated gas price: 3.698797108 gwei

Estimated total gas used for script: 1232179

Estimated amount required: 0.004557580121738332 ETH

==========================

##### sepolia
✅  [Success] Hash: 0x8185b41ed3f793da9777e486e10b8ca01c0a6270fa0395c9eaef877206d789e0
Contract Address: 0x2478Ae70f42003F9777A118f2Fd37731aB4ce176
Block: 9860322
Paid: 0.00196955977249824 ETH (947830 gas * 2.077967328 gwei)

✅ Sequence #1 on sepolia | Total Paid: 0.00196955977249824 ETH (947830 gas * avg 2.077967328 gwei)
                                                                                                                                                                       

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day7/MyToken/broadcast/DeployMyToken.s.sol/11155111/run-latest.json

Sensitive values saved to: /Users/shaoguoji/ETHChiangMai_Bootcamp/Homework/Day7/MyToken/cache/DeployMyToken.s.sol/11155111/run-latest.json
```