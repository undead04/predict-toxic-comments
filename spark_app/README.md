# Spark App - Toxic Comment Analysis

Đây là module xử lý dữ liệu trung tâm của dự án, được xây dựng bằng **PySpark Structured Streaming**. Ứng dụng này đọc dữ liệu realtime từ Kafka, thực hiện phân tích độ độc hại (toxic analysis) bằng Deep Learning model, và lưu kết quả vào nhiều đích khác nhau.

## Luồng xử lý (Pipeline)

1.  **Extract**: Đọc dữ liệu comment dạng JSON từ Kafka topic `comment`.
2.  **Transform**:
    -   Làm sạch và chuẩn hóa text.
    -   Sử dụng mô hình AI (DistilBERT/RoBERTa) để chấm điểm độc hại (`toxic_score`).
    -   *Lưu ý*: Model chạy trực tiếp trên CPU của Spark Executor (nhờ bản Torch optimized).
3.  **Load**: Ghi dữ liệu đồng thời vào:
    -   **MongoDB**: Lưu trữ lịch sử vĩnh viễn (Batch processing).
    -   **Redis**: Lưu trữ dữ liệu nóng (Real-time dashboard).
    -   **S3 (MinIO)**: Checkpoint để đảm bảo tính chịu lỗi (Fault-tolerance).

## Yêu cầu tiên quyết

-   **Docker Engine**: Để chạy container Spark.
-   **Kafka**: Source dữ liệu.
-   **Redis & MongoDB**: Sink dữ liệu.

## Cài đặt & Phát triển

### 1. Cấu trúc thư mục

-   `scripts/extract`: Logic đọc từ Kafka.
-   `scripts/transform`: Logic tiền xử lý và gọi model.
-   `scripts/load`: Logic ghi xuống DB.
-   `models`: Chứa file model Deep Learning (nếu load local) hoặc logic tải model.
-   `utils`: Các hàm tiện ích (Logger, Config).

### 2. Cấu hình

Tạo file `.env` trong thư mục `spark_app` (dựa trên `.env copy`):

```env
# AWS S3 / MinIO (cho Checkpoint)
AWS_ACCESS_KEY=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
BUCKET=elt-weather-bucket
AWS_DEFAULT_REGION=us-east-1

# Database Connections
HOST_REDIS=redis
PORT_REDIS=6379
URL_MONGO=mongodb://mongo:27017/toxic-comment

# Kafka
BOOTSTRAP_SERVERS=kafka-1:29092
```

### 3. Build & Run

Ứng dụng được đóng gói và chạy thông qua Docker Compose ở thư mục gốc.

Để build image riêng lẻ (nếu cần):

```bash
docker build -t toxic-project-spark-base:latest .
```

### 4. Dependencies chính

File `requirements.txt`:
-   `pyspark==3.5.7`: Core framework.
-   `torch` (CPU version): Deep Learning framework (nhẹ hơn bản GPU).
-   `transformers`: Hugging Face library để load NLP models.
-   `pymongo`, `redis`: Driver kết nối DB.

## Lưu ý kỹ thuật

-   **Checkpointing**: Checkpoint được lưu trên S3 để đảm bảo khi Spark crash và restart, nó sẽ tiếp tục xử lý từ offset cuối cùng, tránh mất dữ liệu (Ensure Exactly-Once Semantics).
-   **Resource Optimization**: Image sử dụng base `apache/spark` và cài bản Torch CPU để tối ưu kích thước và tài nguyên cho môi trường không có GPU.
