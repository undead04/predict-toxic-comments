import sys
import os

# Ensure script checks 'scripts' module correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scripts.common.spark_common import spark_session
from scripts.extract.extract_comment import extract_comment
from scripts.transform.transform_comment import transform_comment
from scripts.load.multiple_sink import write_multiple_sink
from utils.config import BUCKET
from utils.logger import get_logger

logger = get_logger("MainApp")

if __name__ == "__main__":
    logger.info("Starting Toxic Comment Spark App (Resource Optimized)...")

    spark = spark_session()
    spark.sparkContext.setLogLevel("WARN")

    df_raw = extract_comment(spark=spark)
    df_transform = transform_comment(df_raw)

    checkpoint_path = f"s3a://{BUCKET}/checkpoints/combined_stream"

    # SINGLE STREAM QUERY ORCHESTRATOR
    query = (
        df_transform.writeStream.foreachBatch(write_multiple_sink)
        .option("checkpointLocation", checkpoint_path)
        .trigger(processingTime="10 seconds")
        .start()
    )

    logger.info(f"Started Combined Stream Query. Checkpoint: {checkpoint_path}")

    spark.streams.awaitAnyTermination()
