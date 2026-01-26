from utils.pool_connect import DBProvider
from utils.logger import get_logger
from utils.config import DATABASE_NAME
logger = get_logger("LoadCommentAnalyst")


def write_to_mongo_comment(batch_df, batch_id):
    logger.info(f"Writing Comment batch {batch_id} to MongoDB...")
    (
        batch_df
          .write
          .format("mongodb")
          .option("spark.mongodb.database", DATABASE_NAME)
          .option("spark.mongodb.collection", "live_comment_analysis")
          .mode("append")
          .save()
    )
