// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

struct Transaction {
    address to;
    uint256 value;
    bytes data;
    bool executed;
}

struct WalletInfo {
    bytes4 walletId;
    address owner;
    Transaction transaction;
    mapping(address => bool) signers;
    uint256 requiredSigners;
    uint256 signCount;
}

contract MultiSignWallet {
    mapping (bytes4 => WalletInfo) public wallets;

    modifier onlyOwner(bytes4 walletId) {
        require(msg.sender == wallets[walletId].owner, "Not owner");
        _;
    }

    modifier onlySigner(bytes4 walletId) {
        require(wallets[walletId].signers[msg.sender], "Not signer");
        _;
    }

    event logProposalCreated(address indexed creator, bytes4 indexed walletId, Transaction transaction);
    event logSignToConfirmProposal(address indexed signer, bytes4 indexed walletId);
    event logExecuteProposal(address indexed executor, bytes4 indexed walletId, address to, uint256 value, bytes data);

    function createWallet(address[] memory _signers, uint256 _requiredSigners) public returns(bytes4) {
        require(_requiredSigners > 0, "Invalid signers");
        require(_signers.length >= _requiredSigners, "Invalid signers");

        bytes4 wid = bytes4(keccak256(abi.encodePacked(msg.sender, block.timestamp, _signers)));

        WalletInfo storage wallet = wallets[wid];
        wallet.walletId = wid;
        wallet.owner = msg.sender;
        wallet.requiredSigners = _requiredSigners;
        wallet.signCount = 0;

        for (uint i = 0; i < _signers.length; i++) {
            wallet.signers[_signers[i]] = true;
        }
        return wid;
    }

    function submitProposal(bytes4 walletId, Transaction memory _transaction) public onlyOwner(walletId) {
        wallets[walletId].transaction = _transaction;
        emit logProposalCreated(msg.sender, walletId, _transaction);
    }

    function SignToConfirmProposal(bytes4 walletId) public onlySigner(walletId) {
        wallets[walletId].signCount++;
        emit logSignToConfirmProposal(msg.sender, walletId);
    }

    function executeProposal(bytes4 walletId) public {
        require(msg.sender == wallets[walletId].owner || wallets[walletId].signers[msg.sender], "Not owner or signer");
        require(wallets[walletId].signCount >= wallets[walletId].requiredSigners, "Not enough signers");

        address to = wallets[walletId].transaction.to;
        uint256 value = wallets[walletId].transaction.value;
        bytes memory data = wallets[walletId].transaction.data;

        wallets[walletId].transaction.executed = true;
        (bool success,) = payable(to).call{value: value}(data);
        require(success, "Transaction failed");
        emit logExecuteProposal(msg.sender, walletId, to, value, data);
    }
    receive() external payable {}
}
