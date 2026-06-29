"""Memory Manager - Unified interface"""
from memory.short_term import ShortTermMemory
from memory.long_term import LongTermMemory

class MemoryManager:
    def __init__(self, db):
        self.short_term = ShortTermMemory()
        self.long_term = LongTermMemory(db)
