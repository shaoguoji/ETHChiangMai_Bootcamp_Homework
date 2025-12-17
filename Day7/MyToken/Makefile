# include . env

# build:
# 	forge clean && forge build

# test: build
# 	forge test

# simulate-deploy: build
# 	forge script script/DeployMyERC20.s.sol:DeployMyERC20Script \
# •		--fork-url sepolia

# deploy: build
# 	forge script script/DeployMyERC20.s.sol:DeployMyERC20Script \
# 		--rpc-url sepolia \
# 		--broadcast \
# 		--verify

# simulate-upgrade: build
# 	forge script script/UpgradeMyERC20.s.sol:UpgradeMyERC20Script \
# 		--fork-url sepolia

# upgrade: build
# 	forge script script/UpgradeMyERC20.s.sol:UpgradeMyERC20Script \
# 		--rpc-url sepolia \
# 		--broadcast \
# 		--verify


SHELL := /bin/bash

# 读取 .env（如果存在）
-include .env
export

# Foundry 项目根目录（用于“源文件合集/子目录”）
# 用法：make build ROOT=contracts/foundry
ROOT ?= .

# 网络参数：在 .env 里配置
# LOCAL_RPC_URL=http://127.0.0.1:8545
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/xxx
LOCAL_RPC_URL ?= http://127.0.0.1:8545
SEPOLIA_RPC_URL ?=

# 钱包：二选一（推荐 keystore）
# PRIVATE_KEY=0x...
# KEYSTORE=keys/deployer.json
PRIVATE_KEY ?=
KEYSTORE ?=

# 选择部署/升级脚本（按你项目改）
SCRIPT_DEPLOY ?= script/DeployMyERC20.s.sol:DeployMyERC20Script
SCRIPT_UPGRADE ?= script/UpgradeMyERC20.s.sol:UpgradeMyERC20Script

# 组装 wallet 参数（优先 keystore）
WALLET :=
ifneq ($(strip $(KEYSTORE)),)
	WALLET := --keystores $(KEYSTORE)
else ifneq ($(strip $(PRIVATE_KEY)),)
	WALLET := --private-key $(PRIVATE_KEY)
endif

.PHONY: build test simulate-deploy deploy simulate-upgrade upgrade

build:
	cd $(ROOT) && forge clean && forge build

test: build
	cd $(ROOT) && forge test

# ========== Deploy ==========
simulate-deploy: build
	cd $(ROOT) && forge script $(SCRIPT_DEPLOY) --fork-url $(SEPOLIA_RPC_URL) -vv

# 用法：make deploy local  或  make deploy sepolia
deploy: build
	@echo "Usage: make deploy local|sepolia"
	@exit 1

deploy-local: build
	@if [ -z "$(WALLET)" ]; then echo "Missing wallet: set KEYSTORE or PRIVATE_KEY in .env"; exit 1; fi
	cd $(ROOT) && forge script $(SCRIPT_DEPLOY) --rpc-url $(LOCAL_RPC_URL) $(WALLET) --broadcast -vv

deploy-sepolia: build
	@if [ -z "$(SEPOLIA_RPC_URL)" ]; then echo "Missing SEPOLIA_RPC_URL in .env"; exit 1; fi
	@if [ -z "$(WALLET)" ]; then echo "Missing wallet: set KEYSTORE or PRIVATE_KEY in .env"; exit 1; fi
	cd $(ROOT) && forge script $(SCRIPT_DEPLOY) --rpc-url $(SEPOLIA_RPC_URL) $(WALLET) --broadcast --verify -vv

# 让 make deploy local/sepolia 生效（把第二个参数映射到目标）
deploy-%: build
	@$(MAKE) deploy-$*

# ========== Upgrade ==========
simulate-upgrade: build
	cd $(ROOT) && forge script $(SCRIPT_UPGRADE) --fork-url $(SEPOLIA_RPC_URL) -vv

# 用法：make upgrade local  或  make upgrade sepolia
upgrade: build
	@echo "Usage: make upgrade local|sepolia"
	@exit 1

upgrade-local: build
	@if [ -z "$(WALLET)" ]; then echo "Missing wallet: set KEYSTORE or PRIVATE_KEY in .env"; exit 1; fi
	cd $(ROOT) && forge script $(SCRIPT_UPGRADE) --rpc-url $(LOCAL_RPC_URL) $(WALLET) --broadcast -vv

upgrade-sepolia: build
	@if [ -z "$(SEPOLIA_RPC_URL)" ]; then echo "Missing SEPOLIA_RPC_URL in .env"; exit 1; fi
	@if [ -z "$(WALLET)" ]; then echo "Missing wallet: set KEYSTORE or PRIVATE_KEY in .env"; exit 1; fi
	cd $(ROOT) && forge script $(SCRIPT_UPGRADE) --rpc-url $(SEPOLIA_RPC_URL) $(WALLET) --broadcast --verify -vv

upgrade-%: build
	@$(MAKE) upgrade-$*