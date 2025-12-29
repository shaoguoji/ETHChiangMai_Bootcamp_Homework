// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {
    EIP712
} from "openzeppelin-contracts/contracts/utils/cryptography/EIP712.sol";
import {
    ECDSA
} from "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";

contract Permit2 is EIP712 {
    using ECDSA for bytes32;

    struct TokenPermissions {
        address token;
        uint256 amount;
    }

    struct PermitTransferFrom {
        TokenPermissions permitted;
        uint256 nonce;
        uint256 deadline;
    }

    struct TransferDetails {
        address to;
        uint256 requestedAmount;
    }

    bytes32 public constant TOKEN_PERMISSIONS_TYPEHASH =
        keccak256("TokenPermissions(address token,uint256 amount)");

    bytes32 public constant PERMIT_TRANSFER_FROM_TYPEHASH =
        keccak256(
            "PermitTransferFrom(TokenPermissions permitted,address spender,uint256 nonce,uint256 deadline)TokenPermissions(address token,uint256 amount)"
        );

    // Map of nonces to prevent replay
    mapping(address => mapping(uint256 => bool)) public usedNonces;

    constructor() EIP712("Permit2", "1") {}

    function permitTransferFrom(
        PermitTransferFrom memory permit,
        TransferDetails calldata transferDetails,
        address owner,
        bytes calldata signature
    ) external {
        require(block.timestamp <= permit.deadline, "Permit2: expired");
        require(
            transferDetails.requestedAmount <= permit.permitted.amount,
            "Permit2: amount exceeds permitted"
        );
        require(!usedNonces[owner][permit.nonce], "Permit2: nonce used");

        usedNonces[owner][permit.nonce] = true;

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                PERMIT_TRANSFER_FROM_TYPEHASH,
                keccak256(
                    abi.encode(
                        TOKEN_PERMISSIONS_TYPEHASH,
                        permit.permitted.token,
                        permit.permitted.amount
                    )
                ),
                msg.sender,
                permit.nonce,
                permit.deadline
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);

        address signer = ECDSA.recover(hash, signature);
        require(signer == owner, "Permit2: invalid signature");

        // Transfer tokens
        IERC20(permit.permitted.token).transferFrom(
            owner,
            transferDetails.to,
            transferDetails.requestedAmount
        );
    }
}
