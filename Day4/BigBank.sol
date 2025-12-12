// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IBank {
    function withDraw(uint256 value) external;
    function deposit(address user, uint256 amount) external;
}

contract Bank is IBank {
    mapping (address => uint256) userBlance;
    address[3] blanceTop3User;
    address internal owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {
        deposit(msg.sender, msg.value);
        calTop3(msg.sender);
    }

    function deposit(address user, uint256 amount) public override virtual {
        require(amount > 0, "Deposit amount must be greater than 0!");
        userBlance[user] += amount;
    }

    function withDraw(uint256 value) external override virtual {
        if ((msg.sender == owner) && (address(this).balance >= value)) {
            payable(msg.sender).transfer(value);
        } 
    }

    function calTop3(address userAddr) internal  {
        if (userBlance[userAddr] == 0) return;

        // 1. Check if user is already in the list
        for (uint i = 0; i < 3; i++) {
            if (blanceTop3User[i] == userAddr) {
                _bubbleUp(i);
                return;
            }
        }

        // 2. If not in list, check if eligible to enter
        if (userBlance[userAddr] > userBlance[blanceTop3User[2]]) {
            blanceTop3User[2] = userAddr;
            _bubbleUp(2);
        }
    }

    function _bubbleUp(uint256 index) private {
        while (index > 0) {
            if (userBlance[blanceTop3User[index]] > userBlance[blanceTop3User[index - 1]]) {
                address temp = blanceTop3User[index];
                blanceTop3User[index] = blanceTop3User[index - 1];
                blanceTop3User[index - 1] = temp;
                index--;
            } else {
                break;
            }
        }
    }
}

contract BigBank is Bank {
    modifier checkAmount(uint256 amount) {
        require(amount > 0.001 ether, "Deposit value must be greater than 0.001!");
        _;
    }

    function deposit(address user, uint256 amount) public override checkAmount(amount){
        super.deposit(user, amount);
    }

    function transferOwner(address newOwner) public{
        require(msg.sender == owner, "Only owner be allow to do this!");
        require(newOwner == address(0), "Invalid input address.");
        owner = newOwner;
    }
}

contract Admin {
    address private owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable { }

    function adminWithdraw(IBank bank) public {
        require(owner == msg.sender, "Only owner be allow to do this!");
        bank.withDraw(address(bank).balance);
    }
}
