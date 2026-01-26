import pandas as pd
from pyspark.sql import DataFrame
from utils.utils import unicode_normalize_udf, get_tokenizer
import torch
from scripts.models.ToxicClassifier import ToxicClassifier
from pyspark.sql.functions import (
    trim,
    lower,
    col,
    regexp_replace,
    when,
    greatest,
    lit,
    coalesce,
    abs as spark_abs
)
from pyspark.sql.types import StructType, FloatType, StructField
from pyspark.sql.pandas.functions import pandas_udf
from utils.logger import get_logger
import os
import threading

logger = get_logger("TransformComment")

_TARGET_NAMES = ['toxic', 'severe_toxic', 'threat', 'insult', 'identity_hate']
# ===== Global singleton (per Python worker) =====
_model = None
_tokenizer = None
_device = None
_lock = threading.Lock()   # phòng trường hợp multi-thread trong 1 worker


def get_model_resources():
    """
    Load model + tokenizer đúng 1 lần cho mỗi Python worker.
    An toàn, tiết kiệm RAM, phù hợp Spark Streaming / Batch.
    """
    global _model, _tokenizer, _device

    # Fast path: đã load rồi thì return ngay
    if _model is not None:
        return _model, _tokenizer, _device

    # Slow path: chưa load → lock lại cho chắc
    with _lock:
        if _model is None:  # double-check
            logger.info("🔹 Initializing model & tokenizer (singleton per worker)")

            # -------- Device --------
            _device = torch.device(
                "cuda" if torch.cuda.is_available() else "cpu"
            )

            # -------- Model --------
            model = ToxicClassifier()

            try:
                model = torch.quantization.quantize_dynamic(
                    model,
                    {torch.nn.Linear},
                    dtype=torch.qint8
                )
                state_dict = torch.load(
                    "/opt/model/visobert_toxic.pt",
                    map_location=_device
                )
                model.load_state_dict(state_dict)
                
            except Exception as e:
                logger.exception("❌ Failed to load model weights")
                raise RuntimeError(f"Model load failed: {e}")

            model.to(_device)
            model.eval()

            # 🔒 Tắt gradient toàn cục cho inference
            for p in model.parameters():
                p.requires_grad_(False)

            # -------- Tokenizer --------
            tokenizer = get_tokenizer()

            # -------- Assign global --------
            _model = model
            _tokenizer = tokenizer

            logger.info(
                f"✅ Model loaded successfully on {_device} | "
                f"PID={os.getpid()}"
            )

    return _model, _tokenizer, _device



def get_top_label(df, struct_col, labels):
    score_cols = [col(f"{struct_col}.{l}") for l in labels]
    max_val = greatest(*score_cols)

    label_selector = coalesce(
        *[
            when(spark_abs(col(f"{struct_col}.{l}") - max_val) < 1e-6, lit(l))
            for l in labels
        ]
    )

    return (
        df
        .withColumn("toxic_score", max_val)
        .withColumn("toxic_category", label_selector)
        .withColumn(
            "toxic_label",
            when(col("toxic_score") >= 0.7, "Toxic").otherwise("Not Toxic")
        )
        .withColumn(
            "recommended_action",
            when(col("toxic_score") >= 0.9, "Ban")
            .when(col("toxic_score") >= 0.7, "Hide")
            .when(col("toxic_score") >= 0.5, "Pending")
            .otherwise("Safe")
        )
    )


prediction_schema = StructType(
        [
            StructField("toxic", FloatType()),
            StructField("severe_toxic", FloatType()),
            StructField("threat", FloatType()),
            StructField("insult", FloatType()),
            StructField("identity_hate", FloatType()),
        ]
    )
@pandas_udf(prediction_schema)
def predict_udf(messages: pd.Series) -> pd.DataFrame:
    model, tokenizer, device = get_model_resources()

    encoding = tokenizer(
        messages.tolist(),
        truncation=True,
        padding=True,          # ✅ dynamic padding
        max_length=128,
        return_tensors="pt"
    )
    encoding = {k: v.to(device) for k, v in encoding.items()}

    with torch.no_grad():
        outputs = model(**encoding)
        logits = outputs.logits if hasattr(outputs, "logits") else outputs
        probs = torch.sigmoid(logits).cpu().numpy()

    return pd.DataFrame(probs, columns=_TARGET_NAMES)




def transform_comment(final_raw_df: DataFrame) -> DataFrame:
    url_pattern = r"https?://\S+|www\.\S+"
    email_pattern = r"\S+@\S+"

    df_comment_cleaned = (
        final_raw_df.dropna(subset=["message"])
        .withColumn("published_at", col("published_at").cast("timestamp"))
        .withColumn("message_clean", unicode_normalize_udf(col("message")))
        .withColumn(
            "message_clean",
            trim(
                regexp_replace(
                    regexp_replace(
                        regexp_replace(lower(col("message_clean")), url_pattern, ""),
                        email_pattern,
                        "",
                    ),
                    r"\s+",
                    " ",
                )
            ),
        )
    )


    df_prediction = df_comment_cleaned.withColumn(
        "predictions", predict_udf(col("message_clean"))
    )

    df_final = get_top_label(df_prediction, "predictions", labels=_TARGET_NAMES)

    df_final = df_final.drop("message_clean")
    return df_final
