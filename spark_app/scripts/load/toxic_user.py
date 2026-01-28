from pyspark.sql import functions as F
from utils.pool_connect import DBProvider
from utils.logger import get_logger
import pandas as pd
from pymongo import UpdateOne
from utils.config import DATABASE_NAME


logger = get_logger("LoadToxicUser")


def get_batch_user_toxic(batch_df: pd.DataFrame):
    """Aggregates user metrics for a static batch."""
    logger.info("Aggregating user metrics for a static batch.")
    return (
        batch_df
        .groupBy(
            F.window(F.col("kafka_timestamp"), "1 minutes"),
            F.col("video_id"),
            F.col("author_id"),
        )
        .agg(
            # Giữ lại metadata mà không cần groupBy
            F.max("author_name").alias("author_name"),
            F.max("author_image").alias("author_image"),
            F.count("comment_id").alias("total_comments"),
            F.sum((F.col("toxic_score") >= 0.7).cast("long")).alias("toxic_count"),
            F.max(F.when(F.col("toxic_score") >= 0.7, F.col("published_at"))).alias(
                "last_violation_time"
            ),
        )
        .filter(F.col("toxic_count") > 0)
        .withColumn("toxic_ratio", F.when(
            F.col("total_comments") > 0,
            F.round(F.col("toxic_count") / F.col("total_comments"), 3),
        ).otherwise(0.0))
        .select(
            "video_id",
            "author_id",
            "author_name",
            "author_image",
            "total_comments",
            "toxic_count",
            "last_violation_time",
            "toxic_ratio",
            F.col("window.start").alias("window_start"),
            F.col("window.end").alias("window_end"),
        )
    )


def write_to_mongo_user_toxic_batch(batch_df, batch_id):
    """Writes batch-aggregated user stats to MongoDB using $INC."""
    mongo_client = DBProvider.get_mongo()
    db = mongo_client[DATABASE_NAME]
    # exactly-once
    if db.processed_batches.find_one(
        {"batch_id": batch_id, "table_name": "toxic_user_metric"}
    ):
        return

    rows = batch_df.collect()
    if not rows:
        return

    ops = []
    for row in rows:
        r = row.asDict()
        query = {
            "video_id": r["video_id"],
            "author_id": r["author_id"],
            "window_start": r["window_start"],
        }
        # Use aggregation pipeline for atomic increment, ratio calculation, and last violation tracking
        pipeline = [
            {
                "$set": {
                    "toxic_count": {"$add": [{"$ifNull": ["$toxic_count", 0]}, r["toxic_count"]]},
                    "total_comments": {"$add": [{"$ifNull": ["$total_comments", 0]}, r["total_comments"]]},
                    "window_end": r["window_end"],
                    "author_name": r["author_name"],
                    "author_image": r["author_image"],
                    "last_violation_time": {
                        "$cond": [
                            {"$gt": [r["last_violation_time"], {"$ifNull": ["$last_violation_time", "0001-01-01T00:00:00Z"]}]},
                            r["last_violation_time"],
                            "$last_violation_time"
                        ]
                    },
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
                db.toxic_user_metric.bulk_write(ops, ordered=False, session=session)
                db.processed_batches.insert_one(
                    {"batch_id": batch_id, "table_name": "toxic_user_metric"},
                    session=session,
                )
        logger.info("Writing user toxic to MongoDB.")
    except Exception as e:
        logger.error(f"Error writing user toxic to Mongo: {e}")
