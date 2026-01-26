# Frontend - Toxic Comment

Đây là giao diện người dùng (Dashboard) cho hệ thống phân tích bình luận độc hại realtime. Dự án được xây dựng bằng **Next.js 16** (App Router), **React 19**, và **Tailwind CSS 4**.

## Tính năng chính

-   **Dashboard Realtime**: Hiển thị các chỉ số thống kê (tổng comment, tỉ lệ toxic) cập nhật liên tục qua SSE.
-   **Biểu đồ trực quan**: Sử dụng `recharts` để vẽ biểu đồ xu hướng toxic theo thời gian thực.
-   **Live Comment Feed**: Hiển thị dòng chảy bình luận mới nhất từ YouTube.
-   **Quản lý Crawler**: Giao diện bắt đầu/dừng crawl cho một video cụ thể.
-   **Top Toxic Users**: Bảng xếp hạng những người dùng có hành vi tiêu cực nhất.

## Công nghệ sử dụng (Tech Stack)

-   **Framework**: Next.js 16.1.4 (App Router)
-   **Library**: React 19.2.3
-   **Styling**: Tailwind CSS v4
-   **HTTP Client**: Axios
-   **Icons**: Lucide React
-   **Charts**: Recharts
-   **Animation**: Framer Motion

## Yêu cầu tiên quyết

-   **Node.js**: Phiên bản v18 trở lên (khuyên dùng v20+).
-   **Backend**: Đảm bảo Backend service đang chạy tại `http://localhost:5000` (hoặc url khác).

## Cài đặt (Installation)

1.  Di chuyển vào thư mục `frontend`:
    ```bash
    cd frontend
    ```

2.  Cài đặt dependencies:
    ```bash
    npm install
    ```

## Cấu hình (Configuration)

Tạo file `.env` tại thư mục gốc của `frontend` (hoặc sửa file có sẵn):

```env
# Địa chỉ API của Backend Service
API_URL=http://localhost:5000
```

## Sử dụng (Usage)

### Môi trường phát triển (Development)

Chạy server dev:

```bash
npm run dev
```

Truy cập `http://localhost:3000` để xem ứng dụng.

## Cấu trúc dự án (Project Structure)

-   `src/app`: Chứa các page của Next.js (App Router).
-   `src/components`: Các UI component tái sử dụng (Charts, Cards, Tables).
-   `src/services`: Các hàm gọi API tới backend (`apiClient.ts`, `youtubeService.ts`).
-   `src/config`: Cấu hình môi trường.
-   `src/hooks`: Custom React Hooks (ví dụ: `useLiveStream` để xử lý SSE).
