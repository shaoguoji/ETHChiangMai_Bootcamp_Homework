// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract RobbingThePoorToTheRich {
    mapping (address => uint256) public userBlance;
    address public awardUser; 
    uint256 public txCount;
    uint256 public awardTurn = 5;
    address[] private users;
    
    event logAward(uint256 indexed count, address indexed nextAwardUser);

    receive() external payable {
        if (msg.value == 0) return;

        if (userBlance[msg.sender] == 0) {
            users.push(msg.sender);
        }

        userBlance[msg.sender] += msg.value;
        CalAwardUser(msg.sender);
        txCount++;

        if (txCount % awardTurn == 0) {
            awardToUser();
        }
        emit logAward(txCount, awardUser);
    }

    function awardToUser() private {     
        address winner = awardUser;

        // Reset for next round
        for (uint i = 0; i < users.length; i++) {
            userBlance[users[i]] = 0;
        }
        delete users;
        awardUser = address(0);

        if (address(this).balance > 0 && winner != address(0)) {
            payable(winner).transfer(address(this).balance);
        }
    }
    
    function CalAwardUser(address userAddr) private {
        if (userBlance[userAddr] == 0) return;

        if (awardUser == address(0) || userBlance[userAddr] > userBlance[awardUser]) {
            awardUser = userAddr;
        }
    }
}