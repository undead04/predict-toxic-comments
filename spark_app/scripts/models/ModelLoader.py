import os
import boto3
import torch
from botocore.exceptions import ClientError
from tenacity import retry, stop_after_attempt, wait_exponential
from utils.config import CACHE_DIR

os.makedirs(CACHE_DIR, exist_ok=True)


class ModelLoader:
    def __init__(self, bucket: str, device: str = "cpu"):
        self.s3 = boto3.client("s3")
        self.bucket = bucket
        self.device = device

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True,
    )
    def fetch_to_local(self, s3_key: str, local_path: str):
        """Download có retry logic để chống chập chờn mạng"""
        print(f"Downloading {s3_key} from S3...")
        try:
            self.s3.download_file(self.bucket, s3_key, local_path)
        except ClientError as e:
            print(f"S3 Download Error: {e}")
            raise

    def load(self, s3_key: str):
        # Dùng /tmp hoặc một folder cache xác định
        local_path = os.path.join(CACHE_DIR, s3_key)

        # Cache check: Tránh download lại nếu file đã tồn tại
        if not os.path.exists(local_path):
            self.fetch_to_local(s3_key, local_path)
        # Tạo folder cha nếu chưa có (tránh lỗi FileNotFoundError)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        # Load state_dict
        print(f"Loading model into {self.device}...")

        state_dict = torch.load(local_path, map_location=self.device)

        # Option: Xóa sau khi load nếu dung lượng disk hạn chế
        # os.remove(local_path)

        return state_dict


# Cách dùng
# loader = ModelLoader(bucket="my-weights-bucket", device="cuda:0")
# model.load_state_dict(loader.load("checkpoints/v1/model.pth"))
