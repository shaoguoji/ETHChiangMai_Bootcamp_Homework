// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Bank {
    mapping (address => uint256) userBlance;
    address[3] blanceTop3User;
    address private admin;

    constructor() {
        admin = msg.sender;
    }

    receive() external payable {
        userBlance[msg.sender] += msg.value;
        calTop3(msg.sender);
    }

    function calTop3(address userAddr) private {
        uint256 bal = userBlance[userAddr];
        if (bal == 0) { return; }
        if (bal > userBlance[blanceTop3User[0]]) {
            if (userAddr == blanceTop3User[0]) { return; } // same user
            blanceTop3User[2] = blanceTop3User[1];
            blanceTop3User[1] = blanceTop3User[0];
            blanceTop3User[0] = userAddr;
        } else if (bal > userBlance[blanceTop3User[1]]) {
            if (userAddr == blanceTop3User[1]) { return; }
            blanceTop3User[2] = blanceTop3User[1];
            blanceTop3User[1] = userAddr;
        } else if (bal > userBlance[blanceTop3User[2]]) {
            if (userAddr == blanceTop3User[2]) { return; }
            blanceTop3User[2] = userAddr;
        }
    }

    function withDraw(uint256 value) public {
        if ((msg.sender == admin) && (address(this).balance >= value)) {
            payable(msg.sender).transfer(value);
        } 
    }

    function getTop3Balance() external view returns(uint256[3] memory) {
        uint256[3] memory top3Balance;

        for (uint i = 0; i < 3; i++) {
            top3Balance[i] = userBlance[blanceTop3User[i]];
        }
        return top3Balance;
    }

}