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
      .mode("append")
      .option("database", DATABASE_NAME)
      .option("collection", "live_comment_analysis")
        
      # 1. Chuyển sang lowercase để tránh Spark CaseInsensitiveStringMap cảnh báo
      .option("operation.type", "replace") 
        
      # 2. Sử dụng dấu chấm để phân cấp cấu hình đúng chuẩn mới
      .option("id.field.list", "comment_id") 
        
      .save()
  )
