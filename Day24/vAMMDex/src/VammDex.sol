// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VammDex
 * @notice A simple leveraged DEX based on vAMM (virtual AMM) mechanism
 * @dev Uses constant product formula (x * y = k) with virtual reserves for price discovery
 *      PnL calculation is based on actual swap output, not spot price
 */
contract VammDex {
    using SafeERC20 for IERC20;

    // ============ Structs ============

    struct Position {
        uint256 margin;        // User deposited collateral
        uint256 size;          // Position size in base asset (vETH)
        uint256 openNotional;  // Notional value at open (margin * leverage)
        bool isLong;           // Long or short position
        bool isOpen;           // Position status
    }

    // ============ Constants ============

    uint256 public constant PRICE_PRECISION = 1e18;
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80% loss triggers liquidation
    uint256 public constant MAX_LEVERAGE = 10;

    // ============ State Variables ============

    IERC20 public immutable collateralToken;

    // Virtual AMM reserves
    uint256 public vQuoteReserve; // Virtual quote reserve (e.g., vUSD)
    uint256 public vBaseReserve;  // Virtual base reserve (e.g., vETH)
    uint256 public immutable k;   // Constant product k = vQuote * vBase

    // User positions
    mapping(address => Position) public positions;

    // ============ Events ============

    event PositionOpened(
        address indexed user,
        uint256 margin,
        uint256 level,
        bool isLong,
        uint256 size,
        uint256 openNotional
    );

    event PositionClosed(
        address indexed user,
        uint256 margin,
        int256 pnl,
        uint256 closeNotional
    );

    event PositionLiquidated(
        address indexed user,
        address indexed liquidator,
        uint256 margin,
        int256 pnl
    );

    // ============ Errors ============

    error PositionAlreadyExists();
    error NoPositionExists();
    error InvalidMargin();
    error InvalidLeverage();
    error PositionNotLiquidatable();
    error InsufficientCollateral();

    // ============ Constructor ============

    /**
     * @param _collateralToken The ERC20 token used as collateral (e.g., USDC)
     * @param _vQuoteReserve Initial virtual quote reserve
     * @param _vBaseReserve Initial virtual base reserve
     */
    constructor(
        address _collateralToken,
        uint256 _vQuoteReserve,
        uint256 _vBaseReserve
    ) {
        collateralToken = IERC20(_collateralToken);
        vQuoteReserve = _vQuoteReserve;
        vBaseReserve = _vBaseReserve;
        k = _vQuoteReserve * _vBaseReserve;
    }

    // ============ External Functions ============

    /**
     * @notice Open a leveraged position
     * @param _margin Amount of collateral to deposit
     * @param level Leverage level (1-10x)
     * @param long True for long, false for short
     */
    function openPosition(uint256 _margin, uint256 level, bool long) external {
        if (positions[msg.sender].isOpen) revert PositionAlreadyExists();
        if (_margin == 0) revert InvalidMargin();
        if (level == 0 || level > MAX_LEVERAGE) revert InvalidLeverage();

        // Transfer collateral from user
        collateralToken.safeTransferFrom(msg.sender, address(this), _margin);

        // Calculate notional value (margin * leverage)
        uint256 notionalValue = _margin * level;

        // Calculate position size and update virtual reserves
        uint256 size;

        if (long) {
            // Long: Add quote to pool, remove base from pool
            // New vBase = k / (vQuote + notionalValue)
            uint256 newVBase = k / (vQuoteReserve + notionalValue);
            size = vBaseReserve - newVBase;

            vQuoteReserve += notionalValue;
            vBaseReserve = newVBase;
        } else {
            // Short: Remove quote from pool, add base to pool
            // newVQuote = vQuoteReserve - notionalValue
            // newVBase = k / newVQuote
            if (notionalValue >= vQuoteReserve) revert InsufficientCollateral();

            uint256 newVQuote = vQuoteReserve - notionalValue;
            uint256 newVBase = k / newVQuote;
            size = newVBase - vBaseReserve;

            vQuoteReserve = newVQuote;
            vBaseReserve = newVBase;
        }

        // Store position with openNotional instead of entryPrice
        positions[msg.sender] = Position({
            margin: _margin,
            size: size,
            openNotional: notionalValue,
            isLong: long,
            isOpen: true
        });

        emit PositionOpened(msg.sender, _margin, level, long, size, notionalValue);
    }

    /**
     * @notice Close the caller's position and settle PnL
     * @dev PnL is calculated based on actual swap output, not spot price
     */
    function closePosition() external {
        Position storage pos = positions[msg.sender];
        if (!pos.isOpen) revert NoPositionExists();

        uint256 closeNotional;
        int256 pnl;

        if (pos.isLong) {
            // Long close: Sell base back to pool, receive quote
            // New vBase = vBaseReserve + size
            // New vQuote = k / newVBase
            // closeNotional = vQuoteReserve - newVQuote (quote received)
            uint256 newVBase = vBaseReserve + pos.size;
            uint256 newVQuote = k / newVBase;
            closeNotional = vQuoteReserve - newVQuote;

            vBaseReserve = newVBase;
            vQuoteReserve = newVQuote;

            // PnL = quote received - quote spent at open
            pnl = int256(closeNotional) - int256(pos.openNotional);
        } else {
            // Short close: Buy back base from pool, spend quote
            // New vBase = vBaseReserve - size
            // New vQuote = k / newVBase
            // closeNotional = newVQuote - vQuoteReserve (quote spent)
            uint256 newVBase = vBaseReserve - pos.size;
            uint256 newVQuote = k / newVBase;
            closeNotional = newVQuote - vQuoteReserve;

            vBaseReserve = newVBase;
            vQuoteReserve = newVQuote;

            // PnL = quote received at open - quote spent to close
            pnl = int256(pos.openNotional) - int256(closeNotional);
        }

        // Calculate payout (margin + pnl, not considering protocol loss)
        uint256 payout;
        if (pnl >= 0) {
            payout = pos.margin + uint256(pnl);
        } else {
            uint256 loss = uint256(-pnl);
            payout = loss >= pos.margin ? 0 : pos.margin - loss;
        }

        uint256 margin = pos.margin;

        // Clear position
        delete positions[msg.sender];

        // Transfer payout to user
        if (payout > 0) {
            collateralToken.safeTransfer(msg.sender, payout);
        }

        emit PositionClosed(msg.sender, margin, pnl, closeNotional);
    }

    /**
     * @notice Liquidate an underwater position
     * @param _user Address of the position holder to liquidate
     * @dev Uses actual swap calculation for PnL, same as closePosition
     */
    function liquidatePosition(address _user) external {
        Position storage pos = positions[_user];
        if (!pos.isOpen) revert NoPositionExists();

        // Calculate actual PnL based on swap output (without executing)
        int256 pnl = _calculateActualPnL(pos);

        // Check if position is liquidatable (loss >= 80% of margin)
        if (pnl >= 0) revert PositionNotLiquidatable();

        uint256 loss = uint256(-pnl);
        uint256 lossThreshold = (pos.margin * LIQUIDATION_THRESHOLD) / 100;

        if (loss < lossThreshold) revert PositionNotLiquidatable();

        // Reverse the virtual reserve changes
        if (pos.isLong) {
            uint256 newVBase = vBaseReserve + pos.size;
            uint256 newVQuote = k / newVBase;

            vBaseReserve = newVBase;
            vQuoteReserve = newVQuote;
        } else {
            uint256 newVBase = vBaseReserve - pos.size;
            uint256 newVQuote = k / newVBase;

            vBaseReserve = newVBase;
            vQuoteReserve = newVQuote;
        }

        uint256 margin = pos.margin;

        // Clear position
        delete positions[_user];

        // Remaining margin goes to liquidator
        uint256 remainingMargin = loss >= margin ? 0 : margin - loss;
        if (remainingMargin > 0) {
            collateralToken.safeTransfer(msg.sender, remainingMargin);
        }

        emit PositionLiquidated(_user, msg.sender, margin, pnl);
    }

    // ============ View Functions ============

    /**
     * @notice Get current vAMM spot price
     * @return price Current price (quote per base, scaled by 1e18)
     */
    function getPrice() public view returns (uint256) {
        return (vQuoteReserve * PRICE_PRECISION) / vBaseReserve;
    }

    /**
     * @notice Get position value for a user (based on actual swap output)
     * @param _user Address of the position holder
     * @return value Current position close value in quote terms
     */
    function getPositionValue(address _user) external view returns (uint256) {
        Position storage pos = positions[_user];
        if (!pos.isOpen) return 0;

        if (pos.isLong) {
            // Value = quote received when selling base
            uint256 newVBase = vBaseReserve + pos.size;
            uint256 newVQuote = k / newVBase;
            return vQuoteReserve - newVQuote;
        } else {
            // Value = quote needed to buy back base (negative value in a sense)
            // But for display, return the openNotional - cost to close
            uint256 newVBase = vBaseReserve - pos.size;
            uint256 newVQuote = k / newVBase;
            return newVQuote - vQuoteReserve;
        }
    }

    /**
     * @notice Check if a position is liquidatable
     * @param _user Address of the position holder
     * @return True if position can be liquidated
     */
    function isLiquidatable(address _user) external view returns (bool) {
        Position storage pos = positions[_user];
        if (!pos.isOpen) return false;

        int256 pnl = _calculateActualPnL(pos);

        if (pnl >= 0) return false;

        uint256 loss = uint256(-pnl);
        uint256 lossThreshold = (pos.margin * LIQUIDATION_THRESHOLD) / 100;

        return loss >= lossThreshold;
    }

    /**
     * @notice Get PnL for a position (based on actual swap output)
     * @param _user Address of the position holder
     * @return pnl Current PnL (positive = profit, negative = loss)
     */
    function getPositionPnL(address _user) external view returns (int256) {
        Position storage pos = positions[_user];
        if (!pos.isOpen) return 0;

        return _calculateActualPnL(pos);
    }

    // ============ Internal Functions ============

    /**
     * @notice Calculate actual PnL based on swap output (not spot price)
     * @param pos The position
     * @return pnl Profit/loss amount (can be negative)
     */
    function _calculateActualPnL(Position storage pos) internal view returns (int256) {
        uint256 closeNotional;

        if (pos.isLong) {
            // Long: quote received from selling base
            uint256 newVBase = vBaseReserve + pos.size;
            uint256 newVQuote = k / newVBase;
            closeNotional = vQuoteReserve - newVQuote;

            // PnL = quote received - quote spent
            return int256(closeNotional) - int256(pos.openNotional);
        } else {
            // Short: quote spent to buy back base
            uint256 newVBase = vBaseReserve - pos.size;
            uint256 newVQuote = k / newVBase;
            closeNotional = newVQuote - vQuoteReserve;

            // PnL = quote received at open - quote spent to close
            return int256(pos.openNotional) - int256(closeNotional);
        }
    }
}
