// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard.
 */
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

/**
 * @dev Interface for the optional metadata functions from the ERC-20 standard.
 */
interface IERC20Metadata is IERC20 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
}

/**
 * @title DeflationaryToken
 * @dev 通缩的 Rebase Token，每年供应量在上一年的基础上下降 1%
 * 
 * 核心设计原理：
 * - 内部使用 shares（份额）记录用户持有量
 * - 外部 balance = shares * rebaseRatio / PRECISION
 * - rebase() 调用时更新 rebaseRatio，使所有用户余额同时变化
 */
contract DeflationaryToken is IERC20, IERC20Metadata {
    
    string private _name;
    string private _symbol;
    
    // 精度：1e18
    uint256 public constant PRECISION = 1e18;
    
    // 用户持有的内部份额
    mapping(address => uint256) private _shares;
    
    // 授权额度（基于 shares）
    mapping(address => mapping(address => uint256)) private _allowances;
    
    // 总份额
    uint256 private _totalShares;
    
    // 换算比例 (初始为 1e18，即 1:1)
    uint256 public rebaseRatio;
    
    // 部署时间戳
    uint256 public deployTime;
    
    // 上次 rebase 的年份 (从部署开始计算)
    uint256 public lastRebaseYear;
    
    // 事件
    event Rebase(uint256 indexed year, uint256 newRatio, uint256 oldRatio);
    
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        _name = name_;
        _symbol = symbol_;
        
        // 初始 ratio 为 1:1
        rebaseRatio = PRECISION;
        deployTime = block.timestamp;
        lastRebaseYear = 0;
        
        // 给部署者 mint 初始供应量
        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply);
        }
    }
    
    // ============ ERC20 Metadata ============
    
    function name() public view override returns (string memory) {
        return _name;
    }
    
    function symbol() public view override returns (string memory) {
        return _symbol;
    }
    
    function decimals() public pure override returns (uint8) {
        return 18;
    }
    
    // ============ ERC20 Core Functions ============
    
    /**
     * @dev 返回通缩后的总供应量
     */
    function totalSupply() public view override returns (uint256) {
        return (_totalShares * rebaseRatio) / PRECISION;
    }
    
    /**
     * @dev 返回通缩后的用户余额
     * balance = shares * rebaseRatio / PRECISION
     */
    function balanceOf(address account) public view override returns (uint256) {
        return (_shares[account] * rebaseRatio) / PRECISION;
    }
    
    /**
     * @dev 获取用户的原始份额（内部记账单位）
     */
    function sharesOf(address account) public view returns (uint256) {
        return _shares[account];
    }
    
    /**
     * @dev 获取总份额
     */
    function totalShares() public view returns (uint256) {
        return _totalShares;
    }
    
    function transfer(address to, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }
    
    function allowance(address owner, address spender) public view override returns (uint256) {
        // 返回基于当前 ratio 换算后的授权额度
        return (_allowances[owner][spender] * rebaseRatio) / PRECISION;
    }
    
    function approve(address spender, uint256 amount) public override returns (bool) {
        // 存储 shares 形式的授权
        uint256 sharesAmount = (amount * PRECISION) / rebaseRatio;
        _allowances[msg.sender][spender] = sharesAmount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        uint256 sharesAmount = (amount * PRECISION) / rebaseRatio;
        uint256 currentAllowance = _allowances[from][msg.sender];
        
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= sharesAmount, "ERC20: insufficient allowance");
            unchecked {
                _allowances[from][msg.sender] = currentAllowance - sharesAmount;
            }
        }
        
        _transfer(from, to, amount);
        return true;
    }
    
    // ============ Rebase Function ============
    
    /**
     * @dev 执行通缩 rebase
     * 每年供应量下降 1%：newRatio = oldRatio * 99 / 100
     */
    function rebase() external {
        uint256 currentYear = (block.timestamp - deployTime) / 365 days;
        require(currentYear > lastRebaseYear, "Already rebased this year");
        
        uint256 oldRatio = rebaseRatio;
        uint256 yearsToRebase = currentYear - lastRebaseYear;
        
        // 复合通缩：每年 ratio * 99 / 100
        for (uint256 i = 0; i < yearsToRebase; i++) {
            rebaseRatio = (rebaseRatio * 99) / 100;
        }
        
        lastRebaseYear = currentYear;
        
        emit Rebase(currentYear, rebaseRatio, oldRatio);
    }
    
    /**
     * @dev 获取当前年份（从部署开始计算）
     */
    function getCurrentYear() public view returns (uint256) {
        return (block.timestamp - deployTime) / 365 days;
    }
    
    /**
     * @dev 检查是否可以 rebase
     */
    function canRebase() public view returns (bool) {
        return getCurrentYear() > lastRebaseYear;
    }
    
    // ============ Internal Functions ============
    
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        
        // 将 amount 转换为 shares
        uint256 sharesAmount = (amount * PRECISION) / rebaseRatio;
        
        uint256 fromShares = _shares[from];
        require(fromShares >= sharesAmount, "ERC20: transfer amount exceeds balance");
        
        unchecked {
            _shares[from] = fromShares - sharesAmount;
            _shares[to] += sharesAmount;
        }
        
        emit Transfer(from, to, amount);
    }
    
    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "ERC20: mint to the zero address");
        
        // 将 amount 转换为 shares
        uint256 sharesAmount = (amount * PRECISION) / rebaseRatio;
        
        _totalShares += sharesAmount;
        _shares[account] += sharesAmount;
        
        emit Transfer(address(0), account, amount);
    }
}
