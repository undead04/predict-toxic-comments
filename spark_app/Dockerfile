# Base image chính thức và ổn định nhất cho PySpark 3.5.7
FROM apache/spark:3.5.7

# Hoặc dùng image nhẹ hơn một chút (không có R):
# FROM apache/spark:3.5.7-java17-python3   # nếu có tag này

USER root

# Tối ưu Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYSPARK_PYTHON=python3 \
    PYSPARK_DRIVER_PYTHON=python3 \
    PYTHONPATH=/spark_app \
    HF_HOME=/models

WORKDIR /spark_app

# Copy requirements trước để cache Docker layer
COPY requirements.txt .

# Cài dependencies với cache pip. Bỏ --no-cache-dir để cache mount hoạt động hiệu quả
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip && \
    pip install -r requirements.txt


EXPOSE 8000 4040

# CMD (bạn thay bằng lệnh chạy thực tế của app)
# CMD ["python", "main.py"]
# hoặc nếu dùng FastAPI:
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]