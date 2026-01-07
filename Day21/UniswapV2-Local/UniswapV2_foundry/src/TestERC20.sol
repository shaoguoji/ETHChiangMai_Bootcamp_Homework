// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TestERC20 (TERC)
 * @notice A simple ERC20 token for testing Uniswap V2 locally
 * @dev Mints initial supply to deployer, supports standard ERC20 operations
 */
contract TestERC20 {
    string public constant name = "Test ERC20";
    string public constant symbol = "TERC";
    uint8 public constant decimals = 18;
    
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    /**
     * @notice Constructor mints initial supply to msg.sender
     * @param initialSupply The initial token supply (in whole tokens, will be multiplied by 10^18)
     */
    constructor(uint256 initialSupply) {
        uint256 supply = initialSupply * 10 ** decimals;
        totalSupply = supply;
        balanceOf[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
    }
    
    /**
     * @notice Transfer tokens to a recipient
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success True if transfer succeeded
     */
    function transfer(address to, uint256 amount) external returns (bool success) {
        require(balanceOf[msg.sender] >= amount, "TERC: insufficient balance");
        require(to != address(0), "TERC: transfer to zero address");
        
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @notice Approve spender to spend tokens on behalf of msg.sender
     * @param spender Address to approve
     * @param amount Amount to approve
     * @return success True if approval succeeded
     */
    function approve(address spender, uint256 amount) external returns (bool success) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @notice Transfer tokens from one address to another (requires approval)
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     * @return success True if transfer succeeded
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool success) {
        require(balanceOf[from] >= amount, "TERC: insufficient balance");
        require(allowance[from][msg.sender] >= amount, "TERC: insufficient allowance");
        require(to != address(0), "TERC: transfer to zero address");
        
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        
        if (allowance[from][msg.sender] != type(uint256).max) {
            allowance[from][msg.sender] -= amount;
        }
        
        emit Transfer(from, to, amount);
        return true;
    }
    
    /**
     * @notice Mint new tokens (for testing purposes)
     * @param to Address to mint to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external {
        require(to != address(0), "TERC: mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
