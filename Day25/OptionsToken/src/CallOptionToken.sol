// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CallOptionToken
 * @dev 看涨期权 ERC20 代币
 * 
 * 功能说明：
 * 1. 创建期权时确定行权价格和行权日期
 * 2. 项目方可以存入 ETH 发行期权 Token（1 ETH = 1 期权 Token）
 * 3. 用户在行权日当天可以用 USDT 按行权价格兑换 ETH
 * 4. 过期后项目方可以销毁所有期权 Token 并赎回资产
 */
contract CallOptionToken is ERC20 {
    using SafeERC20 for IERC20;

    // ============ 状态变量 ============
    
    /// @notice 项目方/发行人地址
    address public issuer;
    
    /// @notice 行权价格（USDT per ETH，18 decimals）
    /// @dev 例如：2000 * 10^18 表示 1 ETH = 2000 USDT
    uint256 public strikePrice;
    
    /// @notice 行权日期（Unix 时间戳）
    uint256 public expirationDate;
    
    /// @notice USDT 合约地址
    IERC20 public usdt;
    
    /// @notice 合约持有的 ETH 数量
    uint256 public totalEthDeposited;
    
    /// @notice 合约收到的 USDT 数量（来自用户行权）
    uint256 public totalUsdtReceived;

    // ============ 事件 ============
    
    event Issued(address indexed issuer, uint256 ethAmount, uint256 optionTokensMinted);
    event Exercised(address indexed user, uint256 optionAmount, uint256 ethReceived, uint256 usdtPaid);
    event ExpiredRedeemed(address indexed issuer, uint256 ethRedeemed, uint256 usdtRedeemed, uint256 tokensBurned);

    // ============ 错误 ============
    
    error OnlyIssuer();
    error NotExpirationDay();
    error AlreadyExpired();
    error NotExpiredYet();
    error InsufficientBalance();
    error TransferFailed();

    // ============ 修饰器 ============
    
    modifier onlyIssuer() {
        if (msg.sender != issuer) revert OnlyIssuer();
        _;
    }

    // ============ 构造函数 ============
    
    /**
     * @dev 创建期权 Token
     * @param _name 期权 Token 名称
     * @param _symbol 期权 Token 符号
     * @param _strikePrice 行权价格（USDT per ETH，18 decimals）
     * @param _expirationDate 行权日期（Unix 时间戳）
     * @param _usdt USDT 合约地址
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _strikePrice,
        uint256 _expirationDate,
        address _usdt
    ) ERC20(_name, _symbol) {
        issuer = msg.sender;
        strikePrice = _strikePrice;
        expirationDate = _expirationDate;
        usdt = IERC20(_usdt);
    }

    // ============ 项目方功能 ============
    
    /**
     * @notice 发行期权 Token（项目方角色）
     * @dev 根据转入的 ETH 发行期权 Token，1 ETH = 1 期权 Token
     */
    function issue() external payable onlyIssuer {
        // 过期后不能再发行
        if (block.timestamp > expirationDate) revert AlreadyExpired();
        
        uint256 ethAmount = msg.value;
        require(ethAmount > 0, "Must send ETH");
        
        // 记录存入的 ETH
        totalEthDeposited += ethAmount;
        
        // 铸造相同数量的期权 Token 给项目方
        _mint(issuer, ethAmount);
        
        emit Issued(issuer, ethAmount, ethAmount);
    }

    /**
     * @notice 过期销毁（项目方角色）
     * @dev 过期后，销毁所有期权 Token，赎回所有 ETH 和 USDT
     */
    function expireRedeem() external onlyIssuer {
        // 必须在过期后才能赎回
        if (block.timestamp <= expirationDate) revert NotExpiredYet();
        
        uint256 ethToRedeem = totalEthDeposited;
        uint256 usdtToRedeem = totalUsdtReceived;
        uint256 tokensToBurn = totalSupply();
        
        // 更新状态
        totalEthDeposited = 0;
        totalUsdtReceived = 0;
        
        // 销毁所有剩余的期权 Token（从所有持有者处销毁）
        // 注意：这里我们只销毁项目方持有的 Token，其他用户持有的 Token 变成无价值
        // 因为过期后无法行权
        uint256 issuerBalance = balanceOf(issuer);
        if (issuerBalance > 0) {
            _burn(issuer, issuerBalance);
        }
        
        // 转移 ETH 给项目方
        if (ethToRedeem > 0) {
            (bool success, ) = issuer.call{value: ethToRedeem}("");
            if (!success) revert TransferFailed();
        }
        
        // 转移 USDT 给项目方
        if (usdtToRedeem > 0) {
            usdt.safeTransfer(issuer, usdtToRedeem);
        }
        
        emit ExpiredRedeemed(issuer, ethToRedeem, usdtToRedeem, tokensToBurn);
    }

    // ============ 用户功能 ============
    
    /**
     * @notice 行权（用户角色）
     * @dev 在到期日当天，用 USDT 按行权价格兑换 ETH，并销毁期权 Token
     * @param amount 要行权的期权 Token 数量
     */
    function exercise(uint256 amount) external {
        // 检查是否是行权日当天
        // 行权日当天：expirationDate 当天的 00:00:00 到 23:59:59
        uint256 expirationDayStart = (expirationDate / 1 days) * 1 days;
        uint256 expirationDayEnd = expirationDayStart + 1 days;
        
        if (block.timestamp < expirationDayStart || block.timestamp >= expirationDayEnd) {
            revert NotExpirationDay();
        }
        
        // 检查用户余额
        if (balanceOf(msg.sender) < amount) revert InsufficientBalance();
        
        // 计算需要支付的 USDT 数量
        // amount 是期权 Token 数量（18 decimals，等于 ETH 数量）
        // strikePrice 是每 ETH 的 USDT 价格（18 decimals）
        // usdtAmount = amount * strikePrice / 10^18
        uint256 usdtAmount = (amount * strikePrice) / 1e18;
        
        // 检查合约是否有足够的 ETH
        if (totalEthDeposited < amount) revert InsufficientBalance();
        
        // 销毁用户的期权 Token
        _burn(msg.sender, amount);
        
        // 更新状态
        totalEthDeposited -= amount;
        totalUsdtReceived += usdtAmount;
        
        // 从用户转入 USDT
        usdt.safeTransferFrom(msg.sender, address(this), usdtAmount);
        
        // 转移 ETH 给用户
        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit Exercised(msg.sender, amount, amount, usdtAmount);
    }

    // ============ 视图函数 ============
    
    /**
     * @notice 获取期权信息
     */
    function getOptionInfo() external view returns (
        address _issuer,
        uint256 _strikePrice,
        uint256 _expirationDate,
        address _usdt,
        uint256 _totalEthDeposited,
        uint256 _totalUsdtReceived,
        uint256 _totalSupply
    ) {
        return (
            issuer,
            strikePrice,
            expirationDate,
            address(usdt),
            totalEthDeposited,
            totalUsdtReceived,
            totalSupply()
        );
    }

    /**
     * @notice 检查是否是行权日
     */
    function isExpirationDay() external view returns (bool) {
        uint256 expirationDayStart = (expirationDate / 1 days) * 1 days;
        uint256 expirationDayEnd = expirationDayStart + 1 days;
        return block.timestamp >= expirationDayStart && block.timestamp < expirationDayEnd;
    }

    /**
     * @notice 检查是否已过期
     */
    function isExpired() external view returns (bool) {
        return block.timestamp > expirationDate;
    }

    /**
     * @notice 接收 ETH
     */
    receive() external payable {}
}
