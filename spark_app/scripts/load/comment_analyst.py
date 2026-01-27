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
          # Lưu ý: Bỏ tiền tố 'spark.mongodb.' khi dùng trong .option() của DataFrameWriter
          .option("database", DATABASE_NAME)
          .option("collection", "live_comment_analysis")
          
          # 1. Kích hoạt chế độ ghi đè nếu trùng
          .option("operationType", "REPLACE") 
          
          # 2. Cực kỳ quan trọng: Chỉ định trường dùng để kiểm tra trùng lặp
          # Connector sẽ dựa vào 'comment_id' để thực hiện lệnh update thay vì insert mới
          .option("idFieldList", "comment_id") 
          
          .save()
    )
