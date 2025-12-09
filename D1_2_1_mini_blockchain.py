# challenge:        https://decert.me/challenge/45779e03-7905-469e-822e-3ec3746d9ece
# finished time:    2025/12/09 16:00:21
# author:           ChatGPT
# github repo:      https://github.com/shaoguoji/ETHChiangMai_Bootcamp_Homework
# prerequisites:    python3

import hashlib
import json
import time

DIFFICULTY = 4

# 固定测试交易集
TEST_TRANSACTIONS = [
    {"sender": "alice", "recipient": "bob", "amount": 5},
    {"sender": "bob", "recipient": "carol", "amount": 2},
    {"sender": "carol", "recipient": "dave", "amount": 1},
]


def hash_block(block: dict) -> str:
    """计算区块哈希（用于 previous_hash 字段）"""
    block_string = json.dumps(block, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(block_string.encode("utf-8")).hexdigest()


def proof_of_work(previous_hash: str, transactions: list, difficulty: int = DIFFICULTY) -> tuple[int, str]:
    """简单 POW：找到使哈希前 difficulty 位为 0 的 nonce"""
    nonce = 0
    start = time.time()
    tx_payload = json.dumps(transactions, sort_keys=True, separators=(",", ":"))
    prefix = "0" * difficulty

    while True:
        guess = f"{previous_hash}{tx_payload}{nonce}"
        guess_hash = hashlib.sha256(guess.encode("utf-8")).hexdigest()
        if guess_hash.startswith(prefix):
            cost = time.time() - start
            print(f"找到符合难度的哈希: {guess_hash} (nonce={nonce}, 用时 {cost:.2f}s)")
            return nonce, guess_hash
        nonce += 1


def create_block(index: int, transactions: list, previous_hash: str) -> dict:
    """生成新区块并返回区块数据"""
    proof, _ = proof_of_work(previous_hash, transactions)
    block = {
        "index": index,
        "timestamp": int(time.time()),
        "transactions": transactions,
        "proof": proof,
        "previous_hash": previous_hash,
    }
    return block


def print_block(block: dict) -> None:
    print(json.dumps(block, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    # 创世区块（无交易）
    genesis_block = {
        "index": 0,
        "timestamp": int(time.time()),
        "transactions": [],
        "proof": 0,
        "previous_hash": "0" * 64,
    }
    genesis_hash = hash_block(genesis_block)

    chain = [genesis_block]
    prev_hash = genesis_hash

    # 连续生成 3 个新区块（总长度 4，包括创世块）
    for idx in range(1, 4):
        block = create_block(idx, TEST_TRANSACTIONS, prev_hash)
        chain.append(block)
        prev_hash = hash_block(block)

    print("当前链高度:", len(chain) - 1)  # 不含创世块的出块数量
    for blk in chain:
        print("\n区块：")
        print_block(blk)
