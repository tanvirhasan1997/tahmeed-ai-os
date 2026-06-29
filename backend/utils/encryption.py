"""Encryption - Fernet token encryption"""
from cryptography.fernet import Fernet
from config import settings

_fernet = None
def _get_fernet():
    global _fernet
    if not _fernet:
        key = settings.ENCRYPTION_KEY or Fernet.generate_key().decode()
        _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet

def encrypt_token(token: str) -> str:
    return _get_fernet().encrypt(token.encode()).decode() if token else ""

def decrypt_token(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode() if encrypted else ""
