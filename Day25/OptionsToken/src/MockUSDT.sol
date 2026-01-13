// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @dev 测试用 USDT 模拟合约
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock USDT", "USDT") {}

    /**
     * @dev 铸造代币（仅用于测试）
     * @param to 接收地址
     * @param amount 铸造数量
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev 返回代币精度，USDT 通常是 6 位，这里为简化使用 18 位
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
