# challenge:        https://decert.me/challenge/45779e03-7905-469e-822e-3ec3746d9ece
# finished time:    2025/12/09 14:03:05
# author:           shaoguoji
# github repo:      https://github.com/shaoguoji/ETHChiangMai_Bootcamp_Homework

import hashlib
import sys
import time

def sha256_hex(text: str) -> str:
    """Return the SHA-256 hex digest of the given text."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def check_hash(hash: str, deficulty: int) -> bool:
    return hash[:deficulty] == "0" * deficulty

def mine(nickname: str, difficulty: int) -> str:
    """Mine a hash for the given nickname and nonce."""
    nonce = 0
    start_time = time.time()
    
    while True:
        text = f"{nickname}{nonce}"
        hash = sha256_hex(text)
        if check_hash(hash, difficulty):
            print(f'playload "{text}" found a hash: {hash}')
            print(f'time used: {time.time() - start_time:.2f}s\n')
            return text
        nonce += 1

if __name__ == "__main__":
    # print(sha256_hex(nickname)) # f63bf5da7337bedf27ab4d82b01d853ec63ea0def5df61ba9b58ce8da7fe0669

    # test_hash = "000f5da7337bedf27ab4d82b01d853ec63ea0def5df61ba9b58ce8da7fe0669"
    # print(check_hash(test_hash, 4))

    nickname = "shaoguoji"
    
    mine(nickname, 4)
    mine(nickname, 5)
