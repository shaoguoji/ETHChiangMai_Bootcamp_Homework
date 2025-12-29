// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract MemeToken is ERC20, Initializable {
    string private _name;
    string private _symbol;
    address public factory;

    // Since this is used as an implementation for Clones, we use initialize instead of constructor
    function initialize(
        string memory name_,
        string memory symbol_,
        address factory_
    ) public initializer {
        _name = name_;
        _symbol = symbol_;
        factory = factory_;
    }

    // Required override to support dynamic name/symbol in proxy
    function name() public view override returns (string memory) {
        return _name;
    }

    // Required override to support dynamic name/symbol in proxy
    function symbol() public view override returns (string memory) {
        return _symbol;
    }

    // Only factory can mint tokens
    function mint(address to, uint256 amount) external {
        require(msg.sender == factory, "Only factory can mint");
        _mint(to, amount);
    }

    // Constructor to disable initializers on the implementation contract itself
    constructor() ERC20("", "") {
        _disableInitializers();
    }
}
