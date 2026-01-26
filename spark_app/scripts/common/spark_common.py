from pyspark.sql import SparkSession
from utils.config import AWS_ACCESS_KEY, AWS_SECRET_ACCESS_KEY, URL_MONGO


def spark_session() -> SparkSession:
    spark = (
        SparkSession.builder
        .appName("KafkaStreaming")

        # =========================
        # RESOURCE (OK để trong code)
        # =========================
        .config("spark.executor.instances", "2")
        .config("spark.executor.cores", "1")
        .config("spark.executor.memory", "1g")
        .config("spark.executor.memoryOverhead", "512m")

        # =========================
        # PERFORMANCE
        # =========================
        .config("spark.sql.shuffle.partitions", "4")
        .config("spark.default.parallelism", "4")
        .config("spark.sql.execution.arrow.pyspark.enabled", "true")
        .config("spark.python.worker.reuse", "true")

        # =========================
        # S3
        # =========================
        .config("spark.hadoop.fs.s3a.access.key", AWS_ACCESS_KEY)
        .config("spark.hadoop.fs.s3a.secret.key", AWS_SECRET_ACCESS_KEY)
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        # =========================
        # MONGODB
        # =========================
        .config(
            "spark.mongodb.connection.uri",
            URL_MONGO
        )
        # =========================
        # TIMEZONE
        # =========================
        .config("spark.sql.session.timeZone", "Asia/Ho_Chi_Minh")
        # =========================
        # ADAPTIVE
        # =========================
        .config("spark.sql.adaptive.enabled", "false")
        .getOrCreate()
    )

    return spark
