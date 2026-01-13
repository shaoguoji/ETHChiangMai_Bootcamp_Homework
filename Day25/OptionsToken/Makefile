-include .env

.PHONY: all test clean deploy upgrade help build anvil local sepolia

# Network and account configuration
# Usage: make deploy local  (uses anviltest account)
#        make deploy sepolia (uses shaoguoji account, with verify)
IS_SEPOLIA := $(filter sepolia,$(MAKECMDGOALS))
NETWORK := $(if $(IS_SEPOLIA),sepolia,local)
ACCOUNT := $(if $(IS_SEPOLIA),shaoguoji,anviltest)
VERIFY_FLAG := $(if $(IS_SEPOLIA),--verify,)

# Dummy targets to allow 'make deploy local' without error
local:; @:
sepolia:; @:

help:
	@echo "Usage:"
	@echo "  make deploy [local|sepolia]   - Deploy a contract"
	@echo "  make test                     - Run all tests"
	@echo "  make anvil                    - Start local anvil chain"
	@echo ""
	@echo "Networks:"
	@echo "  local   - Anvil (http://127.0.0.1:8545), account: anviltest"
	@echo "  sepolia - Sepolia testnet, account: shaoguoji (auto verify)"

all: build test

# Build contracts
build:
	forge clean && forge build

# Run tests
test:
	forge test -vvv

# Clean build artifacts
clean:
	forge clean

# Start local anvil chain
anvil:
	anvil -m 'test test test test test test test test test test test junk' --steps-tracing --block-time 1

# Deploy AutoBank
deploy:
	@echo "================================================"
	@echo "Deploying contract to $(NETWORK)"
	@echo "Account: $(ACCOUNT)"
	@echo "Verify: $(if $(IS_SEPOLIA),Yes,No)"
	@echo "================================================"
	forge script script/Deploy.s.sol \
		--rpc-url $(NETWORK) \
		--account $(ACCOUNT) \
		--broadcast \
		$(VERIFY_FLAG)
