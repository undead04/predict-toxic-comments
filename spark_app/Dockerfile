# Sử dụng image Spark gọn nhẹ hơn nếu chỉ dùng Python (bỏ qua R/Scala nếu không cần)
FROM apache/spark:3.5.7-scala2.12-java17-python3-r-ubuntu

USER root

# Tối ưu Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYSPARK_PYTHON=python3 \
    PYSPARK_DRIVER_PYTHON=python3 \
    PYTHONPATH="${PYTHONPATH}:/spark_app"

WORKDIR /spark_app

# Kết hợp cài đặt hệ thống và dọn dẹp để giảm dung lượng layer
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements trước để tận dụng cache của Docker
COPY requirements.txt .

# Cài đặt thư viện Python với --no-cache-dir và tối ưu torch cpu
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r requirements.txt

# Expose ports
EXPOSE 8000 4040

