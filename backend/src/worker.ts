import { Worker, WaitingError } from "bullmq";
import nodemailer from "nodemailer";
import { redis } from "./queue.js";
import { prisma } from "./config.js";
import "dotenv/config";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const EMAIL_DELAY_MS = Number(process.env.EMAIL_DELAY_MS || 2000);

const MAX_EMAILS_PER_SENDER_PER_HOUR = Number(
  process.env.MAX_EMAILS_PER_SENDER_PER_HOUR || 50,
);

const SENDER_WINDOW_SECONDS = 3600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Atomically check and reserve a sender quota using Redis.
const senderRateLimitScript = `
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(ARGV[1])
local window = tonumber(ARGV[2])

if current >= limit then
    local ttl = redis.call('TTL', KEYS[1])
    if ttl <= 0 then
        redis.call('EXPIRE', KEYS[1], window)
        ttl = window
    end
    return ttl
end

current = redis.call('INCR', KEYS[1])

if current == 1 then
    redis.call('EXPIRE', KEYS[1], window)
end

return 0
`;

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { emailId } = job.data;

    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new Error("Email record not found");
    }

    if (email.status === "sent") {
      return { skipped: true };
    }

    // Per-sender hourly rate limiting
    const sender = email.sender || "default";

    const senderKey = `email-rate-limit:${sender}`;

    const delaySeconds = Number(
      await redis.eval(
        senderRateLimitScript,
        1,
        senderKey,
        MAX_EMAILS_PER_SENDER_PER_HOUR,
        SENDER_WINDOW_SECONDS,
      ),
    );

    if (delaySeconds > 0) {
      const delayMs = delaySeconds * 1000;

      console.log(
        `Sender ${sender} reached hourly limit. Rescheduling job ${job.id} in ${delaySeconds} seconds.`,
      );

      await job.moveToDelayed(Date.now() + delayMs, job.token);

      throw new WaitingError();
    }

    // Preserve the existing sending delay
    await sleep(EMAIL_DELAY_MS);

    const result = await transporter.sendMail({
      from: `"Outbox Scheduler" <${process.env.SMTP_USER}>`,
      to: email.recipient,
      subject: email.subject,
      text: email.body,
    });

    await prisma.email.update({
      where: { id: email.id },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    console.log("Email sent:", email.recipient);
    console.log("Sender:", sender);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(result));

    return { success: true };
  },
  {
    connection: redis,
    concurrency: 1,
    limiter: {
      max: Number(process.env.MAX_EMAILS_PER_HOUR || 200),
      duration: 3600000,
    },
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

export default worker;
