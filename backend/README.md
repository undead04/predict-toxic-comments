# Backend - Toxic Comment

Đây là backend service cho dự án Toxic Comment. Đây là một ứng dụng Node.js thực hiện nhiệm vụ crawl bình luận trực tiếp (live chat) từ YouTube và đẩy chúng vào Kafka topic để xử lý tiếp theo.

## Yêu cầu tiên quyết (Prerequisites)

Trước khi chạy dự án này, hãy đảm bảo bạn đã cài đặt các thành phần sau:

- **Node.js**: Phiên bản v18 trở lên (khuyên dùng v20+)
- **Kafka**: Một instance Kafka đang chạy (mặc định cần chạy ở `localhost:9094`)
- **YouTube Data API Key**: Một API key hợp lệ từ Google Cloud Console đã được kích hoạt YouTube Data API v3.

## Cài đặt (Installation)

1.  Di chuyển vào thư mục `backend`:

    ```bash
    cd backend
    ```

2.  Cài đặt các dependencies:
    ```bash
    npm install
    ```

## Cấu hình (Configuration)

Tạo một file `.env` tại thư mục gốc của `backend` với các biến sau:

```env
PORT=3000
NODE_ENV=development
# API Key Google Cloud Project của bạn đã kích hoạt YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key_here
# Tên Kafka Topic để đẩy tin nhắn vào
KAFKA_TOPIC=comment
```

> **Lưu ý:** Địa chỉ Kafka broker hiện đang được hardcode là `localhost:9094` trong file `src/service/kafka-producer.ts`. Hãy đảm bảo Kafka broker của bạn có thể truy cập được tại địa chỉ này.

## Sử dụng (Usage)

### Môi trường phát triển (Development)

Để khởi động server ở chế độ development với `ts-node`:

```bash
npm run dev
```

Server sẽ khởi động ở port được chỉ định trong file `.env` (mặc định: 3000).

## Tài liệu API (API Documentation)

### 1. Bắt đầu Crawl Live Chat

Kích hoạt crawler cho live chat của một video YouTube cụ thể.

- **Endpoint:** `POST /api/youtube/live-chat`
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**

- **Thành công (200 OK):**
  ```json
  {
    "status": "success",
    "data": "Live Chat ID retrieved successfully"
  }
  ```
- **Lỗi (400 Bad Request):** Nếu thiếu `url`.
- **Lỗi (404 Not Found):** Nếu video không tồn tại hoặc không có live chat đang hoạt động.

## Cấu trúc dự án (Project Structure)

- `src/index.ts`: Điểm khởi chạy của ứng dụng.
- `src/controller`: Xử lý các yêu cầu API gửi đến.
- `src/service`: Logic nghiệp vụ (tương tác YouTube API, Kafka producer).
- `src/router`: Định nghĩa các đường dẫn API.
- `src/utils`: Các hàm tiện ích.
