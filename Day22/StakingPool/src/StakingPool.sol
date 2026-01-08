// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IStaking.sol";
import "./interfaces/IToken.sol";
import "./KKToken.sol";

/**
 * @title StakingPool - Stake ETH to earn KK Token rewards
 * @notice Uses MasterChef-style accTokenPerStake and rewardDebt pattern
 * @dev Rewards are distributed at 10 KK tokens per block, fairly split among stakers
 */
contract StakingPool is IStaking {
    /// @notice Reward rate: 10 KK tokens per block (in wei)
    uint256 public constant REWARD_PER_BLOCK = 10 ether;

    /// @notice Precision factor for accumulated token calculation (1e12 like MasterChef)
    uint256 private constant ACC_TOKEN_PRECISION = 1e12;

    /// @notice The KK Token reward token
    IToken public immutable kkToken;

    /// @notice Total ETH staked in the pool
    uint256 public totalStaked;

    /// @notice Accumulated KK tokens per stake, times ACC_TOKEN_PRECISION
    uint256 public accTokenPerStake;

    /// @notice Last block number when rewards were calculated
    uint256 public lastRewardBlock;

    /// @notice User info struct (MasterChef style)
    struct UserInfo {
        uint256 amount;      // How much ETH the user has staked
        uint256 rewardDebt;  // Reward debt: amount * accTokenPerStake at last interaction
    }

    /// @notice User staking info
    mapping(address => UserInfo) public userInfo;

    /// @notice Emitted when a user stakes ETH
    event Staked(address indexed user, uint256 amount);

    /// @notice Emitted when a user unstakes ETH
    event Unstaked(address indexed user, uint256 amount);

    /// @notice Emitted when a user claims rewards
    event RewardClaimed(address indexed user, uint256 reward);

    constructor() {
        KKToken token = new KKToken();
        kkToken = IToken(address(token));
        lastRewardBlock = block.number;
    }

    /**
     * @notice Update pool's accTokenPerStake to current block
     * @dev Called before any stake/unstake/claim operation
     */
    function updatePool() public {
        if (block.number <= lastRewardBlock) {
            return;
        }

        if (totalStaked == 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 blocksPassed = block.number - lastRewardBlock;
        uint256 reward = blocksPassed * REWARD_PER_BLOCK;

        // accTokenPerStake += (reward * ACC_TOKEN_PRECISION) / totalStaked
        accTokenPerStake += (reward * ACC_TOKEN_PRECISION) / totalStaked;
        lastRewardBlock = block.number;
    }

    /**
     * @notice Calculate pending rewards for an account
     * @param account The staker's address
     * @return Pending reward amount
     * @dev pending = (user.amount * accTokenPerStake / ACC_TOKEN_PRECISION) - user.rewardDebt
     */
    function earned(address account) public view returns (uint256) {
        UserInfo storage user = userInfo[account];
        uint256 _accTokenPerStake = accTokenPerStake;

        // Calculate current accTokenPerStake if pool hasn't been updated
        if (block.number > lastRewardBlock && totalStaked != 0) {
            uint256 blocksPassed = block.number - lastRewardBlock;
            uint256 reward = blocksPassed * REWARD_PER_BLOCK;
            _accTokenPerStake += (reward * ACC_TOKEN_PRECISION) / totalStaked;
        }

        // pending = (amount * accTokenPerStake / precision) - rewardDebt
        return (user.amount * _accTokenPerStake) / ACC_TOKEN_PRECISION - user.rewardDebt;
    }

    /**
     * @notice Stake ETH to earn KK Token rewards
     */
    function stake() external payable {
        require(msg.value > 0, "Cannot stake 0");

        UserInfo storage user = userInfo[msg.sender];

        updatePool();

        // If user already has staked amount, claim pending rewards first
        if (user.amount > 0) {
            uint256 pending = (user.amount * accTokenPerStake) / ACC_TOKEN_PRECISION - user.rewardDebt;
            if (pending > 0) {
                kkToken.mint(msg.sender, pending);
                emit RewardClaimed(msg.sender, pending);
            }
        }

        // Update user amount
        user.amount += msg.value;
        totalStaked += msg.value;

        // Update rewardDebt: user.rewardDebt = user.amount * accTokenPerStake / precision
        user.rewardDebt = (user.amount * accTokenPerStake) / ACC_TOKEN_PRECISION;

        emit Staked(msg.sender, msg.value);
    }

    /**
     * @notice Unstake ETH and claim pending rewards
     * @param amount Amount of ETH to unstake
     */
    function unstake(uint256 amount) external {
        UserInfo storage user = userInfo[msg.sender];

        require(amount > 0, "Cannot unstake 0");
        require(user.amount >= amount, "Insufficient balance");

        updatePool();

        // Calculate and transfer pending rewards
        uint256 pending = (user.amount * accTokenPerStake) / ACC_TOKEN_PRECISION - user.rewardDebt;
        if (pending > 0) {
            kkToken.mint(msg.sender, pending);
            emit RewardClaimed(msg.sender, pending);
        }

        // Update user amount
        user.amount -= amount;
        totalStaked -= amount;

        // Update rewardDebt for remaining stake
        user.rewardDebt = (user.amount * accTokenPerStake) / ACC_TOKEN_PRECISION;

        // Transfer ETH back to user
        (bool success,) = payable(msg.sender).call{value: amount}("");
        require(success, "ETH transfer failed");

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim pending KK Token rewards without changing stake
     */
    function claim() external {
        UserInfo storage user = userInfo[msg.sender];

        updatePool();

        // Calculate pending rewards
        uint256 pending = (user.amount * accTokenPerStake) / ACC_TOKEN_PRECISION - user.rewardDebt;

        if (pending > 0) {
            // Update rewardDebt to current state
            user.rewardDebt = (user.amount * accTokenPerStake) / ACC_TOKEN_PRECISION;

            kkToken.mint(msg.sender, pending);
            emit RewardClaimed(msg.sender, pending);
        }
    }

    /**
     * @notice Get staked ETH balance for an account
     * @param account The staker's address
     * @return Staked ETH amount
     */
    function balanceOf(address account) external view returns (uint256) {
        return userInfo[account].amount;
    }
}
