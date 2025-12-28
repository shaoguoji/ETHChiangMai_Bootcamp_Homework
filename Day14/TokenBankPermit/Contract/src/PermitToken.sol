// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract PermitToken is ERC20, ERC20Permit {
    constructor() ERC20("PermitToken", "PTOKEN") ERC20Permit("PermitToken") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}
