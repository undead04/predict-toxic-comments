import Redis from "ioredis";

import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "../utils/config";

export const redis = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  lazyConnect: true,
  enableReadyCheck: true,
  keepAlive: 1000,
  connectTimeout: 10000,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export enum StatusCrawler {
  RUNNING = "running",
  STOPPED = "stopped",
  ENDED = "ended",
  ERROR = "error",
}

redis.on("error", (err) => console.log("Redis redis Error", err));
redis.on("connect", () => console.log("Redis redis Connect"));

export const REDIS_TTL = {
  CRAWLER: 60 * 60 * 24, // 24 hours
  LEADERBOARD: 60 * 60 * 2, // 2 hours (user defined earlier)
  USER_INFO: 60 * 60 * 2,
  LOCK: 60 * 60 * 2,
};

export const REDIS_KEYS = {
  CRAWLER: (id: string) => `yt:crawler:${id}`,
  LOCK: (id: string) => `yt:live:${id}:lock`,
  LEADERBOARD: (videoId: string) => `leaderboard:scores:${videoId}`,
  USER_INFO: (authorId: string) => `user:info:${authorId}`,
  STREAM_CRAWLER: "stream:crawler",
};

export async function initRedis() {
  try {
    console.log("connect redis init");
    await redis.connect();
    console.log("Connected to Redis server");
  } catch (error) {
    console.error(error);
  }
}

export async function acquireLockActiveCrawlers(liveChatId: string): Promise<boolean> {
  const key = REDIS_KEYS.LOCK(liveChatId);
  const result = await redis.set(
    key,
    "1",
    "EX",
    REDIS_TTL.LOCK,
    "NX"
  );
  return result === "OK";
}

export async function getStatusActiveCrawlers(liveChatId: string): Promise<StatusCrawler | null> {
  const status = await redis.hget(REDIS_KEYS.CRAWLER(liveChatId), "status");
  return status as StatusCrawler | null;
}

export async function getStateActiveCrawlers(liveChatId: string): Promise<string | null> {
  return await redis.hget(REDIS_KEYS.CRAWLER(liveChatId), "state");
}

export async function setStatusActiveCrawlers(
  liveChatId: string,
  status: StatusCrawler
) {
  const key = REDIS_KEYS.CRAWLER(liveChatId);
  await redis.hset(key, "status", status);
  await redis.expire(key, REDIS_TTL.CRAWLER);
}

export async function saveStateActiveCrawlers(
  liveChatId: string,
  nextPageToken: string
) {
  const
    key = REDIS_KEYS.CRAWLER(liveChatId);
  await redis.hset(key, "state", nextPageToken);
  await redis.expire(key, REDIS_TTL.CRAWLER);
}

export async function delLockActiveCrawlers(liveChatId: string) {
  await redis.del(REDIS_KEYS.LOCK(liveChatId));
}


