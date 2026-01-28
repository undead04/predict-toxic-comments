import pandas as pd
import unicodedata
from pyspark.sql.types import StringType
from pyspark.sql.pandas.functions import pandas_udf
from transformers import AutoTokenizer
import os
# Định nghĩa hàm chuẩn hóa bằng Python (chạy trên Worker)
@pandas_udf(StringType())
def unicode_normalize_udf(s: pd.Series) -> pd.Series:
    return s.apply(lambda x: unicodedata.normalize("NFC", x) if x else x)

def get_tokenizer():
    # Nạp đúng tokenizer của ViSoBERT
    model_name = "uitnlp/visobert" # Hoặc đường dẫn đến folder model của bạn
    model_path = "./scripts/models/tokenzier"
    if os.path.exists(model_path):
        tokenizer = AutoTokenizer.from_pretrained(model_path)
    else:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
    return tokenizer

