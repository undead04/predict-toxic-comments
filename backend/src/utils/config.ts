import dotenv from "dotenv";
dotenv.config();
const KAFKA_TOPIC = process.env.KAFKA_TOPIC || "";
const KAFKA_BOOTSTRAP_SERVER = process.env.KAFKA_BOOTSTRAP_SERVER || "";
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || "youtube-crawler";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";
const PORT = process.env.PORT || "";
const NODE_ENV = process.env.NODE_ENV || "";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || "toxic_comment";
const MONGO_MIN_POOL_SIZE = Number(process.env.MONGO_MIN_POOL_SIZE) || 5;
const MONGO_MAX_POOL_SIZE = Number(process.env.MONGO_MAX_POOL_SIZE) || 20;

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";

export {
  KAFKA_BOOTSTRAP_SERVER,
  KAFKA_TOPIC,
  KAFKA_CLIENT_ID,
  YOUTUBE_API_KEY,
  PORT,
  NODE_ENV,
  MONGO_URI,
  MONGO_DB_NAME,
  MONGO_MIN_POOL_SIZE,
  MONGO_MAX_POOL_SIZE,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
};
