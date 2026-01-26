from pyspark.sql.types import StructType, StringType
from pyspark.sql.functions import col, from_json, current_timestamp
from pyspark.sql import SparkSession
from utils.config import BOOTSTRAP_SERVERS
from utils.logger import get_logger


logger = get_logger("ExtractComment")

import re

def camel_to_snake(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    

def extract_comment(spark: SparkSession):
    logger.info("Starting Extract Comment Stream from Kafka...")

    schema = (
        StructType()
        .add("commentId", StringType(), True)
        .add("videoId", StringType(), True)
        .add("message", StringType(), True)
        .add("authorId", StringType(), True)
        .add("authorImage", StringType(), True)
        .add("authorName", StringType(), True)
        .add("publishedAt", StringType(), True)
    )

    streaming_df = (
        spark.readStream.format("kafka")
        .option("kafka.bootstrap.servers", BOOTSTRAP_SERVERS)
        .option("subscribe", "comment")
        .option("maxOffsetsPerTrigger", "100")
        .option("startingOffsets", "earliest")
        .option("failOnDataLoss", "false")
        .load()
    )

    # 1. Parse JSON và giữ lại các metadata quan trọng từ Kafka
    raw_df = streaming_df.select(
        from_json(col("value").cast("string"), schema).alias("data"),
        col("timestamp").alias("kafka_timestamp"),  # Thời gian tin nhắn vào Kafka
        col("offset"),
        col("partition"),
    )

    # 2. Flatten và xử lý lỗi
    processed_raw_df = raw_df.select(
        "data.*", "kafka_timestamp", "offset", "partition"
    ).filter("commentId IS NOT NULL")  # Ví dụ: Loại bỏ các bản ghi không parse được (rác)
    for col_name in processed_raw_df.columns:
        new_col_name = camel_to_snake(col_name)
        if new_col_name != col_name:
            processed_raw_df = processed_raw_df.withColumnRenamed(col_name, new_col_name)
    # 3. Thêm Processing Timestamp (để đo độ trễ hệ thống - Observability)
    final_raw_df = processed_raw_df.withColumn("processing_time", current_timestamp())
    final_raw_df = final_raw_df.select(
        *[col(c).alias(camel_to_snake(c)) for c in final_raw_df.columns]
    )
    return final_raw_df
