# Lấy logger
log4jLogger = spark._jvm.org.apache.log4j
logger = log4jLogger.LogManager.getLogger(__name__)

# Trong quá trình xử lý
logger.info("Kafka pipeline started successfully")
if data_loss_detected:
    logger.error("Critical: Data loss detected in offset range...")