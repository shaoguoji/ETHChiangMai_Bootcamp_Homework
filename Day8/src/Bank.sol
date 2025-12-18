// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

contract Bank {
    mapping (address => uint256) public userBlance;
    address[3] public blanceTop3User;
    address private admin;

    constructor() {
        admin = msg.sender;
    }

    receive() external payable {
        userBlance[msg.sender] += msg.value;
        calTop3(msg.sender);
    }

    function withDraw(uint256 value) public {
        if ((msg.sender == admin) && (address(this).balance >= value)) {
            payable(msg.sender).transfer(value);
        } 
    }

    function calTop3(address userAddr) private {
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

    // function getTop3Balance() external view returns(uint256[3] memory) {
    //     uint256[3] memory top3Balance;

    //     for (uint i = 0; i < 3; i++) {
    //         top3Balance[i] = userBlance[blanceTop3User[i]];
    //     }
    //     return top3Balance;
    // }

}