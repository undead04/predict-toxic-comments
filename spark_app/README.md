# Spark App - Toxic Comment Analysis (Real-time)

Đây là module xử lý dữ liệu trung tâm của dự án, được xây dựng bằng **PySpark Structured Streaming**. Ứng dụng này đọc dữ liệu realtime từ Kafka, thực hiện phân tích độ độc hại (toxic analysis) bằng Deep Learning model, và lưu kết quả vào MongoDB.

## Luồng xử lý (Pipeline)

1.  **Extract**: Đọc dữ liệu comment dạng JSON từ Kafka topic `comment`.
2.  **Transform**:
    -   Làm sạch và chuẩn hóa text.
    -   Sử dụng mô hình AI **ViSobert** (`uitnlp/visobert`) để nhận diện 5 loại sắc thái (toxic, identity_hate, severe_toxic, threat, insult).
    -   *Lưu ý*: Model chạy trực tiếp trên CPU của Spark Executor để tối ưu hóa tài nguyên.
3.  **Load**: Ghi dữ liệu vào:
    -   **MongoDB**: Lưu trữ kết quả phân tích bình luận (`live_comment_analysis`), chỉ số stream (`live_stream_metric`) và thống kê người dùng độc hại (`toxic_user_metric`).
    -   **S3 (MinIO)**: Lưu trữ Checkpoint để đảm bảo tính chịu lỗi (Fault-tolerance).

> [!IMPORTANT]
> **Redis & Leaderboard:** Khác với thiết kế ban đầu, Spark hiện tại **không** ghi trực tiếp vào Redis. Thay vào đó, Backend service sẽ lắng nghe MongoDB Change Streams để cập nhật Redis và Leaderboard realtime.

## Yêu cầu tiên quyết

-   **Docker Engine**: Để chạy container Spark.
-   **Kafka**: Nguồn dữ liệu (Source).
-   **MongoDB**: Nơi lưu trữ (Sink).
-   **Model Weights**: Bạn cần tải file `visobert_toxic.pt` và đặt vào thư mục `/model` ở gốc dự án. Xem hướng dẫn tại [model/README.md](../model/README.md).

## Cài đặt & Phát triển

### 1. Cấu trúc thư mục

-   `scripts/extract`: Logic đọc từ Kafka.
-   `scripts/transform`: Logic tiền xử lý và gọi model.
-   `scripts/load/multiple_sink.py`: Logic điều phối ghi dữ liệu vào nhiều collection trong MongoDB.
-   `scripts/models`: Chứa định nghĩa kiến trúc mô hình (PyTorch).
-   `utils`: Các hàm tiện ích (Logger, Connection Pool, Config).

### 2. Cấu hình

Tạo file `.env` trong thư mục `spark_app` (dựa trên `.env copy`):

```env
# AWS S3 / MinIO (cho Checkpoint)
AWS_ACCESS_KEY=...
AWS_SECRET_ACCESS_KEY=...
BUCKET=toxic-comment-checkpoints

# Database Connections
URL_MONGO=mongodb+srv://...

# Kafka
BOOTSTRAP_SERVERS=kafka-1:29092
```

### 3. Chạy Ứng dụng

Ứng dụng được khởi chạy thông qua `docker-compose-local-all.yml` hoặc `docker-compose.yml` ở thư mục gốc.

Để chạy local thủ công (cần cài Spark & Dependencies):
```bash
python main.py
```

## Lưu ý kỹ thuật

-   **Exactly-Once**: Sử dụng `batch_id` và MongoDB `UpdateOne` với `upsert` để đảm bảo tính nhất quán của dữ liệu dù có xảy ra restart Job.
-   **Resource Optimization**: Image Spark sử dụng PyTorch bản CPU để tiết kiệm RAM, phù hợp cho việc chạy trên các máy có cấu hình trung bình (như Laptop 16GB RAM).
