from pymongo import MongoClient
from utils.config import URL_MONGO
from utils.logger import get_logger

logger = get_logger("PoolConnect")
class DBProvider:
    # Các biến static để giữ connection pool trong RAM của Executor
    _mongo_client = None

    @classmethod
    def get_mongo(cls):
        if cls._mongo_client is None:
            logger.info("--- Khởi tạo MongoDB Pool mới trên Executor ---")
            # maxPoolSize=5 là đủ cho máy 1 core của bạn
            cls._mongo_client = MongoClient(
                URL_MONGO, maxPoolSize=5, connectTimeoutMS=5000
            )
        return cls._mongo_client

