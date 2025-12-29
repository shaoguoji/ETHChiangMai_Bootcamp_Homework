// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {TokenBankV2} from "../src/TokenBankV2.sol";
import {HookERC20} from "../src/HookERC20.sol";
import {Permit2} from "../src/Permit2.sol";

contract TokenBankPermit2Test is Test {
    TokenBankV2 bank;
    HookERC20 token;
    Permit2 permit2;

    uint256 ownerPrivateKey;
    address owner;

    bytes32 public constant TOKEN_PERMISSIONS_TYPEHASH =
        keccak256("TokenPermissions(address token,uint256 amount)");

    bytes32 public constant PERMIT_TRANSFER_FROM_TYPEHASH =
        keccak256(
            "PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"
        );

    function setUp() public {
        ownerPrivateKey = 0xA11CE;
        owner = vm.addr(ownerPrivateKey);

        token = new HookERC20();
        permit2 = new Permit2();
        bank = new TokenBankV2(address(token), address(permit2));

        // Mint tokens to owner
        token.transfer(owner, 1000 ether);
    }

    function testDepositWithPermit2() public {
        vm.startPrank(owner);
        uint256 amount = 100 ether;
        uint256 nonce = 0;
        uint256 deadline = block.timestamp + 1 hours;

        // 1. Approve Permit2
        token.approve(address(permit2), type(uint256).max);

        // 2. Sign Permit2 message
        // StructHash
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TRANSFER_FROM_TYPEHASH,
                keccak256(
                    abi.encode(
                        TOKEN_PERMISSIONS_TYPEHASH,
                        address(token),
                        amount
                    )
                ),
                address(bank), // spender is TokenBank
                nonce,
                deadline
            )
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes("Permit2")),
                keccak256(bytes("1")),
                block.chainid,
                address(permit2)
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", domainSeparator, structHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 3. Call depositWithPermit2
        bank.depositWithPermit2(amount, nonce, deadline, signature);

        vm.stopPrank();

        assertEq(bank.amountsOf(owner), amount);
        assertEq(token.balanceOf(address(bank)), amount);
    }
}
