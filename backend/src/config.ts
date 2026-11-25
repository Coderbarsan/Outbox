import "dotenv/config";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const PORT = Number(process.env.PORT || 5000);

export const EMAIL_DELAY_MS = Number(process.env.EMAIL_DELAY_MS || 2000);

export const MAX_EMAILS_PER_HOUR = Number(
  process.env.MAX_EMAILS_PER_HOUR || 200,
);
