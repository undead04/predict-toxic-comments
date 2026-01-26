from scripts.load.comment_analyst import write_to_mongo_comment
from scripts.load.metric_stream import (
    write_to_mongo_metric_batch,
    get_batch_agg_metric
)
from scripts.load.toxic_user import (
    write_to_mongo_user_toxic_batch,
    get_batch_user_toxic
)
from utils.logger import get_logger

logger = get_logger("MultipleSink")


def write_multiple_sink(batch_df, batch_id):
    logger.info(f"[Batch {batch_id}] START processing")

    # =========================
    # Phase 0: Prepare
    # =========================
    batch_df.persist()

    try:
        # =========================
        # Phase 1: Raw Event Sink
        # (append, best-effort)
        # =========================
        write_to_mongo_comment(batch_df, batch_id)

        # =========================
        # Phase 2: Stateful Metrics
        # (aggregation + $inc)
        # =========================
        metric_df = get_batch_agg_metric(batch_df)
        write_to_mongo_metric_batch(metric_df, batch_id)

        # =========================
        # Phase 3: User Stats / Leaderboard
        # (aggregation + upsert)
        # =========================
        user_toxic_df = get_batch_user_toxic(batch_df)
        write_to_mongo_user_toxic_batch(user_toxic_df, batch_id)

        logger.info(f"[Batch {batch_id}] SUCCESS")
    except Exception as e:
        logger.error(f"[Batch {batch_id}] FAILED: {e}")
        raise
    finally:
        # =========================
        # Phase 4: Cleanup
        # =========================
        batch_df.unpersist(blocking=True)
        logger.info(f"[Batch {batch_id}] CLEANUP done")



# def write_combined_batch(batch_df, batch_id):
#     # 1. Prepare data (Transformations) - Chưa tốn RAM vì đây là Lazy Evaluation
#     # Chúng ta tính toán sẵn các DataFrame cần thiết
#     raw_comment_df = batch_df 
#     metric_agg_df = get_batch_metrics(batch_df) # Hàm trả về DF đã groupBy
#     user_toxic_df = get_batch_user_toxic(batch_df) # Hàm trả về DF đã groupBy

#     # 2. Persist - Chỉ lưu kết quả cuối cùng của transform nếu cần
#     # Ở đây nếu dữ liệu không quá lớn, có thể không cần persist() 
#     # để tránh "căng" RAM vùng Storage

#     try:
#         # 3. Thực thi ghi dữ liệu (Actions)
#         # Các hàm này bây giờ chỉ làm nhiệm vụ ghi (Sink), không chứa logic groupBy nữa
#         save_to_mongo_comment(raw_comment_df, batch_id)
#         write_to_mongo_metric_batch(metric_agg_df, batch_id)
#         write_to_mongo_user_toxic_batch(user_toxic_df, batch_id)

#     finally:
#         # Dọn dẹp thủ công các biến Python
#         del raw_comment_df
#         del metric_agg_df
#         del user_toxic_df
#         # Ép buộc Python thu gom rác (nếu cần thiết)
#         import gc
#         gc.collect()