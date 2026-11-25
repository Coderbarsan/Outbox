import { Queue } from "bullmq";
import Redis from "ioredis";
import "dotenv/config";

export const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT || 6379),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
});

export const emailQueue = new Queue("email-queue", {
  connection: redis,
});
