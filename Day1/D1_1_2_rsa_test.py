# challenge:        https://decert.me/challenge/45779e03-7905-469e-822e-3ec3746d9ece
# finished time:    2025/12/09 15:29:22
# author:           shaoguoji
# github repo:      https://github.com/shaoguoji/ETHChiangMai_Bootcamp_Homework
# prerequisites:    python3, ecdsa
#                   - pip install ecdsa

import hashlib
import sys
import time
from ecdsa import SigningKey, SECP256k1

find_nonce = None

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
    # step1: generate key
    sk = SigningKey.generate(curve=SECP256k1) # generate private key（secp256k1）
    vk = sk.get_verifying_key() # get public key
    priv_hex = sk.to_string().hex() # export hex
    pub_hex = vk.to_string().hex()
    print(f'private key:" {priv_hex}')
    print(f'public key:" {pub_hex}\n')

    # step2: mine and sign
    nickname = "shaoguoji"
    message = mine(nickname, 4)
    message_bytes = message.encode("utf-8")
    signature = sk.sign_deterministic(message_bytes, hashfunc=hashlib.sha256)
    print("sig hex:", signature.hex())

    # step3: verify
    try:
        vk.verify(signature, message_bytes, hashfunc=hashlib.sha256)
        print("\nverify success!!!")
    except:
        print("\nverify failed!!!")
