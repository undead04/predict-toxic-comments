# Sử dụng chính chủ image Spark để có sẵn Java, Spark core và cấu hình hệ thống
FROM apache/spark:3.5.7-scala2.12-java17-python3-r-ubuntu

USER root

# 1. Định nghĩa thư mục làm việc (Thường Spark mặc định dùng /opt/spark/work-dir)
WORKDIR /spark_app

# 2. Cài đặt các gói hệ thống cần thiết cho Python (nếu cần build thư viện)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 3. Copy requirements và cài đặt thư viện Python
COPY requirements.txt .
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r requirements.txt

# 5. Cấu hình biến môi trường để Spark nhận diện đúng Python driver
ENV PYSPARK_PYTHON=python3
ENV PYSPARK_DRIVER_PYTHON=python3
ENV PYTHONPATH="${PYTHONPATH}:/opt/spark_app"
# 6. Expose các port cần thiết: 
# 8000 cho API, 4040 cho Spark UI (nếu chạy local mode)
EXPOSE 8000 4040

