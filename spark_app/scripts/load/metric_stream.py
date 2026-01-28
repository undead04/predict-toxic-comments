from pyspark.sql import functions as F
import pandas as pd
from utils.pool_connect import DBProvider
from utils.logger import get_logger
from pymongo import UpdateOne
from utils.config import DATABASE_NAME

logger = get_logger("LoadMetricStream")


def get_batch_agg_metric(batch_df: pd.DataFrame):
    """Aggregates metrics for a static batch (not a stream)."""
    logger.info("Aggregating metrics for batch.")
    return (
        batch_df
        .groupBy(
            F.window(F.col("kafka_timestamp"), "1 minutes"), F.col("video_id")
        )
        .agg(
            F.count("comment_id").alias("total_comments"),
            F.sum((F.col("toxic_score") > 0.7).cast("long")).alias("toxic_count"),
            F.approx_count_distinct("author_id", 0.01).alias("unique_viewers"),
        )
        .withColumn(
            "toxic_ratio",
            F.when(
                F.col("total_comments") > 0,
                F.round(F.col("toxic_count") / F.col("total_comments"), 3),
            ).otherwise(0.0),
        )
        .withColumn("window_start",F.col("window.start"))
        .withColumn("window_end",F.col("window.end"))
        .drop("window")
    )


def write_to_mongo_metric_batch(batch_df, batch_id):

    mongo_client = DBProvider.get_mongo()
    db = mongo_client[DATABASE_NAME]
    
    # exactly-once
    if db.processed_batches.find_one({"batch_id": batch_id,"table_name":"live_stream_metric"}):
        return
    
    rows = batch_df.collect()
    if not rows:
        return
    
    ops = []
    
    for row in rows:
        r = row.asDict()
        
        query = {
            "video_id": r["video_id"],
            "window_start": r["window_start"],
            }
        # Use aggregation pipeline for atomic increment and ratio calculation
        pipeline = [
            {
                "$set": {
                    "toxic_count": {"$add": [{"$ifNull": ["$toxic_count", 0]}, r["toxic_count"]]},
                    "total_comments": {"$add": [{"$ifNull": ["$total_comments", 0]}, r["total_comments"]]},
                    "unique_viewers": {"$add": [{"$ifNull": ["$unique_viewers", 0]}, r["unique_viewers"]]},
                    "window_end": r["window_end"],
                    "_version": {"$add": [{"$ifNull": ["$_version", 0]}, 1]}
                }
            },
            {
                "$set": {
                    "toxic_ratio": {
                        "$cond": [
                            {"$gt": ["$total_comments", 0]},
                            {"$round": [{"$divide": ["$toxic_count", "$total_comments"]}, 3]},
                            0.0
                        ]
                    }
                }
            }
        ]
        ops.append(UpdateOne(query, pipeline, upsert=True))

    if not ops:
        return

    try:
        with mongo_client.start_session() as session:
            with session.start_transaction():
                db.live_stream_metric.bulk_write(ops, ordered=False, session=session)
                db.processed_batches.insert_one(
                    {"batch_id": batch_id,"table_name":"live_stream_metric"},
                    session=session
                )
        logger.info("Writing metrics to MongoDB.")
    except Exception as e:
        logger.error(f"Error writing metrics to Mongo: {e}")

