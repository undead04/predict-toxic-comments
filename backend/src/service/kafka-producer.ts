import { Kafka, Partitioners, Producer } from "kafkajs";

const kafka = new Kafka({
  clientId: "youtube-crawler",
  brokers: ["localhost:9094"], // Đảm bảo port này khớp với EXTERNAL trong Docker
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

// Gán sự kiện trước khi connect
producer.on("producer.connect", () => {
  console.log("✅ KafkaJS Producer connected");
});

// HÀM KHỞI CHẠY KẾT NỐI (Gọi hàm này trong index.ts)
export const initKafka = async () => {
  try {
    console.log("⏳ Connecting to Kafka...");
    await producer.connect();
  } catch (error) {
    console.error("❌ Kafka Connection Failed:", error);
    process.exit(1); // Nếu không có Kafka, hệ thống Data Pipeline không nên chạy tiếp
  }
};

export const sendToKafka = async (topic: string, message: any) => {
  try {
    // Không cần await producer.connect() ở đây nữa vì đã init ở index.ts
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  } catch (error) {
    console.error("❌ KafkaJS Send Error:", error);
  }
};
