# Hướng dẫn Tải và Cài đặt Model AI

Để hệ thống phân tích bình luận độc hại hoạt động chính xác, bạn cần tải đúng file trọng số (weights) của mô hình và đặt vào thư mục này.

## 📥 Tải Model

Bạn có thể tải mô hình đã được huấn luyện sẵn tại đây:

*   **Link tải Mô hình:** [Tải visobert_toxic.pt tại đây](https://drive.google.com/file/d/1S-J4V_YqTwD3cYw7fwqjBjc-xj0VWeOW/view?usp=sharing)
*   **Tên file:** `visobert_toxic.pt`

> [!IMPORTANT]
> Nếu bạn sử dụng model khác không tương thích với cấu trúc của `ToxicClassifier.py`, hệ thống Spark sẽ gặp lỗi khi khởi tạo (Inference Error).

## 📂 Cách thiết đặt

1.  Tải file `visobert_toxic.pt` từ đường link trên.
2.  Di chuyển file vào thư mục `/model` (thư mục hiện tại).
3.  Cấu trúc thư mục sau khi cài đặt sẽ như sau:
    ```text
    /model
    ├── README.md
    └── visobert_toxic.pt
    ```

## 🧠 Thông tin Mô hình
- **Base Model:**  ViSobert
- **Task:** Multiclass Classification (toxic, threat, severe_toxic,insult,identity_hate.)
- **Framework:** PyTorch
