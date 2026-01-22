#!/bin/bash

# CCIP跨链状态监控脚本
# 用途: 定期检查Base Sepolia上的余额，确认跨链是否完成

source .env

echo "========================================="
echo "CCIP跨链状态监控"
echo "========================================="
echo ""
echo "Token地址 (Base Sepolia): 0x2be47261554ce80f6f2cC7490B072506eE20ca46"
echo "接收地址: 0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd"
echo "预期接收: 0.1 CCT (100000000000000000 wei)"
echo ""
echo "开始监控... (每30秒检查一次)"
echo "========================================="
echo ""

# 目标余额 (0.1 CCT = 100000000000000000 wei)
TARGET_BALANCE=100000000000000000

# 最大等待时间 (20分钟 = 40次检查)
MAX_CHECKS=40
CHECK_COUNT=0

while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    CHECK_COUNT=$((CHECK_COUNT + 1))

    # 获取当前时间
    TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

    # 查询余额
    BALANCE=$(cast call 0x2be47261554ce80f6f2cC7490B072506eE20ca46 \
        "balanceOf(address)(uint256)" \
        0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd \
        --rpc-url $BASE_SEPOLIA_RPC_URL 2>/dev/null)

    # 转换为人类可读格式 (除以 10^18)
    BALANCE_HUMAN=$(echo "scale=4; $BALANCE / 1000000000000000000" | bc 2>/dev/null)

    echo "[$TIMESTAMP] 检查 #$CHECK_COUNT - Base Sepolia余额: $BALANCE_HUMAN CCT"

    # 检查是否达到目标余额
    if [ "$BALANCE" -ge "$TARGET_BALANCE" ]; then
        echo ""
        echo "========================================="
        echo "✅ 跨链成功完成！"
        echo "========================================="
        echo "Base Sepolia余额: $BALANCE_HUMAN CCT"
        echo "接收金额: $(echo "scale=4; $BALANCE / 1000000000000000000" | bc) CCT"
        echo ""

        # 同时检查Sepolia余额
        SEPOLIA_BALANCE=$(cast call 0xAF8E5D63c45925a201bDd824c3452CF77D92bFF8 \
            "balanceOf(address)(uint256)" \
            0xBF2A4454226E8296825d3eC06d08D6c0b41dcebd \
            --rpc-url $SEPOLIA_RPC_URL 2>/dev/null)
        SEPOLIA_HUMAN=$(echo "scale=4; $SEPOLIA_BALANCE / 1000000000000000000" | bc 2>/dev/null)

        echo "Sepolia余额: $SEPOLIA_HUMAN CCT (已burn 0.1 CCT)"
        echo ""
        echo "Message ID: 0x12158e8a873e0666f1f37ccd5050562213398e4deb7c7ab9b9fe912364014902"
        echo "CCIP Explorer: https://ccip.chain.link/msg/12158e8a873e0666f1f37ccd5050562213398e4deb7c7ab9b9fe912364014902"
        echo "========================================="

        # 保存结果到文件
        echo "跨链完成时间: $TIMESTAMP" > ./script/ccip/output/crosschain_result.txt
        echo "Base Sepolia余额: $BALANCE_HUMAN CCT" >> ./script/ccip/output/crosschain_result.txt
        echo "Sepolia余额: $SEPOLIA_HUMAN CCT" >> ./script/ccip/output/crosschain_result.txt

        exit 0
    fi

    # 等待30秒后再次检查
    if [ $CHECK_COUNT -lt $MAX_CHECKS ]; then
        sleep 30
    fi
done

echo ""
echo "========================================="
echo "⚠️  超时：20分钟内未检测到跨链完成"
echo "========================================="
echo "请手动检查CCIP Explorer:"
echo "https://ccip.chain.link/msg/12158e8a873e0666f1f37ccd5050562213398e4deb7c7ab9b9fe912364014902"
echo ""
echo "或手动查询余额:"
echo "cast call 0x431306040c181E768C4301a7bfD4fC6a770E833F \"balanceOf(address)(uint256)\" 0x0b332c99Fd6511Ca9FAf9654DfcF18C575941094 --rpc-url \$BASE_SEPOLIA_RPC_URL"
echo "========================================="
exit 1
