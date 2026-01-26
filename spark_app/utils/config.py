import os

from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
BUCKET = os.getenv("BUCKET")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION")


URL_MONGO = os.getenv("URL_MONGO")
BOOTSTRAP_SERVERS = os.getenv("BOOTSTRAP_SERVERS", "localhost:9094")
DATABASE_NAME = os.getenv("DATABASE_NAME")
MODEL_PATH = os.getenv("MODEL_PATH")
CACHE_DIR = os.getenv("MODEL_CACHE_DIR", "/tmp/models")
__all__ = [
    "CACHE_DIR",
    "AWS_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY",
    "BUCKET",
    "AWS_DEFAULT_REGION",
    "URL_MONGO",
    "BOOTSTRAP_SERVERS",
    "DATABASE_NAME",
]
