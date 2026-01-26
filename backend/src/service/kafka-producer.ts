import { Kafka, Partitioners } from "kafkajs";
import { KAFKA_BOOTSTRAP_SERVER, KAFKA_CLIENT_ID } from "../utils/config";
import { KafkaPayload } from "../types/YoutubeComment";

const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: [KAFKA_BOOTSTRAP_SERVER], // Đảm bảo port này khớp với EXTERNAL trong Docker
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

export async function sendToKafka(topic: string, messages: KafkaPayload[]) {
  await producer.send({
    topic,
    messages: messages.map((message) => ({
      key: message.videoId,
      value: JSON.stringify(message),
    })),
  });
}
