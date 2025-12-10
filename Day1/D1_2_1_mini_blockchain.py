import hashlib
import json
import time
from typing import List, Dict, Tuple, Any

# 固定测试交易集
TEST_TRANSACTIONS = [
    {"sender": "alice", "recipient": "bob", "amount": 5},
    {"sender": "bob", "recipient": "carol", "amount": 2},
    {"sender": "carol", "recipient": "dave", "amount": 1},
]

class Blockchain:
    def __init__(self, difficulty: int = 4):
        self.chain: List[Dict[str, Any]] = []
        self.difficulty = difficulty
        self.create_genesis_block()

    def create_genesis_block(self):
        """生成创世区块"""
        genesis_block = {
            "index": 0,
            "timestamp": int(time.time()),
            "transactions": [],
            "proof": 0,
            "previous_hash": "0" * 64,
        }
        self.proof_of_work(genesis_block)
        self.chain.append(genesis_block)

    @staticmethod
    def hash_block(block: Dict[str, Any]) -> str:
        """计算区块哈希"""
        # 确保字典排序以保证哈希一致性
        block_string = json.dumps(block, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(block_string.encode("utf-8")).hexdigest()

    def proof_of_work(self, block: Dict[str, Any]) -> Tuple[int, str]:
        """
        POW：直接修改 block['proof']，并计算整个 block 的哈希。
        这符合“区块头哈希”的概念（这里整个区块数据量小，可视作一个大区块头）。
        """
        block['proof'] = 0
        start = time.time()
        prefix = "0" * self.difficulty
        
        print(f"开始挖矿... 难度: {self.difficulty}")
        while True:
            # 每次循环都序列化整个区块并计算哈希
            # 注意：这在数据量大时会有性能问题，但逻辑上最直观
            guess_hash = self.hash_block(block)
            
            if guess_hash.startswith(prefix):
                cost = time.time() - start
                hash_rate = block['proof'] / cost if cost > 0 else 0
                print(f"找到符合难度的哈希: {guess_hash}")
                print(f"  - Nonce: {block['proof']}")
                print(f"  - 用时: {cost:.4f}s")
                print(f"  - 算力: {hash_rate:.2f} hashes/s")
                return block['proof'], guess_hash
            
            block['proof'] += 1

    def create_block(self, transactions: List[Dict]) -> Dict[str, Any]:
        """生成新区块并添加到链上"""
        previous_block = self.chain[-1]
        previous_hash = self.hash_block(previous_block)
        
        index = len(self.chain)
        timestamp = int(time.time())
        
        # 先构建完整的区块结构，proof 初始为 0
        block = {
            "index": index,
            "timestamp": timestamp,
            "transactions": transactions,
            "proof": 0,
            "previous_hash": previous_hash,
        }
        
        # 计算 POW，直接在 block 对象上修改 proof
        self.proof_of_work(block)
        
        self.chain.append(block)
        return block

    def verify_chain(self) -> bool:
        """验证区块链的有效性"""
        for i in range(1, len(self.chain)):
            current = self.chain[i]
            previous = self.chain[i - 1]
            
            print(f"正在验证区块 {current['index']}...")

            # 1. 验证 previous_hash 是否正确链接
            if current["previous_hash"] != self.hash_block(previous):
                print(f"❌ 区块 {current['index']} 的 previous_hash 不匹配！")
                return False

            # 2. 验证 POW (工作量证明)
            # 直接计算当前区块的哈希，看是否满足难度
            block_hash = self.hash_block(current)
            if not block_hash.startswith("0" * self.difficulty):
                print(f"❌ 区块 {current['index']} 的 POW 验证失败！Hash: {block_hash}")
                return False

        print("✅ 区块链验证通过！")
        return True

    def print_chain(self):
        for block in self.chain:
            print(f"\n区块 #{block['index']} [Hash: {self.hash_block(block)[:10]}...]")
            print(json.dumps(block, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    # 初始化区块链
    blockchain = Blockchain(difficulty=4)
    
    # 连续生成 3 个新区块
    print("=== 开始挖矿 ===")
    for _ in range(3):
        blockchain.create_block(TEST_TRANSACTIONS)
    
    print(f"\n当前链高度: {len(blockchain.chain)}")
    blockchain.print_chain()

    print("\n=== 验证区块链 ===")
    blockchain.verify_chain()

    print("\n=== 篡改测试 ===")
    # 尝试篡改第二个区块的交易金额
    if len(blockchain.chain) > 1:
        original_amount = blockchain.chain[1]["transactions"][0]["amount"]
        print(f"篡改区块 1: 将交易金额 {original_amount} 改为 9999")
        blockchain.chain[1]["transactions"][0]["amount"] = 9999
        
        if not blockchain.verify_chain():
            print(">> 篡改被成功检测到！")
        else:
            print(">> 警告：篡改未被检测到！")
