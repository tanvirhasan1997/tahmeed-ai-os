"""Logger"""
import logging, sys
def setup_logger(name=None):
    logger = logging.getLogger(name or "tahmeed_ai_os")
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"))
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger
