#!/bin/bash

# Hàm kiểm tra dịch vụ
wait_for_service() {
  host=$1
  port=$2
  name=$3
  echo "Checking $name ($host:$port)..."
  # Dùng Python để mở socket test connection thay vì lệnh nc
  while ! python3 -c "import socket; s = socket.socket(); s.settimeout(1); s.connect(('$host', $port)); s.close()" > /dev/null 2>&1; do
    echo "Waiting for $name..."
    sleep 2
  done
  echo "$name is UP!"
}

# Đợi Kafka
wait_for_service "kafka-1" 29092 "Kafka"

zip -r app_code.zip . -i "scripts/*" "utils/*"
# Thực hiện submit job
echo "Submitting Spark Job..."
exec spark-submit \
    --master local[2] \
    --packages org.apache.spark:spark-sql-kafka-0-10_2.12:3.5.1,org.apache.hadoop:hadoop-aws:3.3.4,org.mongodb.spark:mongo-spark-connector_2.12:10.3.0,com.redislabs:spark-redis_2.12:3.1.0 \
    --conf spark.executorEnv.PYTHONPATH=/opt/spark_app \
    --conf spark.executor.instances=1 \
    --conf spark.executor.memory=3g \
    --conf spark.executor.cores=2 \
    --conf spark.driver.memory=3g \
    --conf spark.executor.memoryOverhead=512m \
    --conf spark.python.worker.memory=400m \
    --conf spark.memory.fraction=0.6 \
    --conf spark.local.dir=/mnt/spark-temp \
    /opt/spark_app/main.py
