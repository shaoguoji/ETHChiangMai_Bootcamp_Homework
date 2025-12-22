-include .env

.PHONY: all test clean deploy fund help install snapshot format anvil scopefile local sepolia

# Default deploy script (can be overridden by script=ScriptName)
script ?= DeployNFTMarket
DEPLOY_SCRIPT_PATH := script/$(script).s.sol

# Determine network and account based on make goals
IS_SEPOLIA := $(filter sepolia,$(MAKECMDGOALS))

# Set variables based on the target check
NETWORK := $(if $(IS_SEPOLIA),sepolia,local)
ACCOUNT := $(if $(IS_SEPOLIA),shaoguoji,anviltest)

# Dummy targets to allow 'make deploy local' without error
local:; @:
sepolia:; @:

help:
	@echo "Usage:"
	@echo "  make deploy [local|sepolia] [script=ScriptName]"
	@echo ""
	@echo "  network: local (default) -> uses account 'anviltest'"
	@echo "           sepolia         -> uses account 'shaoguoji'"
	@echo "  script : Name of the script in script/ folder (default: DeployTokenBankV2)"
	@echo "           Example: make deploy local script=MyOtherScript"

all: remove install build

# Clean the repo
clean  :; forge clean

# Remove modules
remove :; rm -rf .gitmodules && rm -rf .git/modules/* && rm -rf lib && touch .gitmodules && git add . && git commit -m "modules"

install :; forge install cyfrin/foundry-devops@0.0.11 --no-commit && forge install smartcontractkit/chainlink-brownie-contracts@0.6.1 --no-commit && forge install foundry-rs/forge-std@v1.5.3 --no-commit
update:; forge update
build:; forge build
test :; forge script script/InteractNFTMarket.s.sol:InteractNFTMarket --rpc-url $(NETWORK) --account $(ACCOUNT) --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --broadcast 
snapshot :; forge snapshot
format :; forge fmt

# Start local anvil chain
anvil :; anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

deploy:
	@echo "Deploying $(script) to $(NETWORK) with account $(ACCOUNT)..."
	forge script $(DEPLOY_SCRIPT_PATH) --rpc-url $(NETWORK) --account $(ACCOUNT) --broadcast