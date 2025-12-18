// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Bank} from "../src/Bank.sol";

import {console} from "forge-std/console.sol";

contract BankTest is Test {
    Bank public bank;
    address public admin;

    function setUp() public {
        vm.startPrank(admin);
        bank = new Bank();
        vm.stopPrank();
    }

    function test_Deposit() public {
        address account = makeAddr("account");
        uint256 initBalance = 100;
        uint256 amount = 10;
        
        vm.deal(account, initBalance);

        vm.startPrank(account);

        uint256 balanceBefore = bank.userBlance(account);
        (bool success,) = address(bank).call{value: amount}("");
        vm.assume(success);
        console.log("account send %d to bank", amount);
        uint256 balanceAfter = bank.userBlance(account);

        vm.stopPrank();

        assertEq(balanceAfter, balanceBefore+amount);
    }

    function test_balanceTop3() public {
        address account1 = makeAddr("account1");
        address account2 = makeAddr("account2");
        address account3 = makeAddr("account3");
        address account4 = makeAddr("account4");

        uint256 initBalance = 200;
        
        vm.deal(account1, initBalance);
        vm.deal(account2, initBalance);
        vm.deal(account3, initBalance);
        vm.deal(account4, initBalance);

        console.log("test 1 account...");
        vm.prank(account1);
        (bool success,) = address(bank).call{value: 30}("");
        vm.assume(success);
        console.log("account1 send 30 to bank");
        assertEq(bank.blanceTop3User(0), account1);
        assertEq(bank.blanceTop3User(1), address(0));
        assertEq(bank.blanceTop3User(2), address(0));
        console.log(unicode"✅ 1 account test success!"); // [1(30), 0, 0]

        console.log("test 2 account...");
        vm.prank(account2);
        (success,) = address(bank).call{value: 10}("");
        vm.assume(success);
        console.log("account2 send 10 to bank");
        assertEq(bank.blanceTop3User(0), account1);
        assertEq(bank.blanceTop3User(1), account2);
        assertEq(bank.blanceTop3User(2), address(0));
        console.log(unicode"✅ 2 account test success!"); // [1(30), 2(10), 0]

        console.log("test 3 account...");
        vm.prank(account3);
        (success,) = address(bank).call{value: 50}("");
        vm.assume(success);
        console.log("account3 send 50 to bank");
        assertEq(bank.blanceTop3User(0), account3);
        assertEq(bank.blanceTop3User(1), account1);
        assertEq(bank.blanceTop3User(2), account2);
        console.log(unicode"✅ 3 account test success!"); // [3(50), 1(30), 2(10)]

        console.log("test 4 account...");
        vm.prank(account4);
        (success,) = address(bank).call{value: 40}("");
        vm.assume(success);
        console.log("account3 send 40 to bank");
        assertEq(bank.blanceTop3User(0), account3);
        assertEq(bank.blanceTop3User(1), account4);
        assertEq(bank.blanceTop3User(2), account1);
        console.log(unicode"✅ 4 account test success!"); // [3(50), 4(40), 1(30)]

        console.log("test repeat deposit...");
        vm.prank(account2);
        (success,) = address(bank).call{value: 60}("");
        vm.assume(success);
        console.log("account2 send 30 to bank");  
        assertEq(bank.blanceTop3User(0), account2);
        assertEq(bank.blanceTop3User(1), account3);
        assertEq(bank.blanceTop3User(2), account4);  // [2(70), 3(50), 4(40)]
    }

    function test_withdraw() public {
        address account1 = makeAddr("account1");

        vm.deal(address(bank), 100);

        vm.startPrank(account1);
        vm.deal(account1, 0);
        bank.withDraw(20);
        assertEq(address(bank).balance, 100);
        vm.stopPrank();

        vm.startPrank(admin);
        vm.deal(admin, 0);
        bank.withDraw(20);
        assertEq(address(bank).balance, 80);
        vm.stopPrank();

        console.log(unicode"✅ withdraw test success!");
    }
}
