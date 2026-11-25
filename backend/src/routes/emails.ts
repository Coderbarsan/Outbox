import { Router } from "express";
import { prisma } from "../config.js";
import { emailQueue } from "../queue.js";

const router = Router();

router.post("/schedule", async (req, res) => {
  try {
    const { recipients, subject, body, scheduledAt, delay, hourlyLimit } =
      req.body;

    if (
      !Array.isArray(recipients) ||
      recipients.length === 0 ||
      !subject ||
      !body ||
      !scheduledAt
    ) {
      return res.status(400).json({
        message: "Recipients, subject, body and scheduledAt are required.",
      });
    }

    const startTime = new Date(scheduledAt);

    if (isNaN(startTime.getTime()) || startTime.getTime() < Date.now()) {
      return res.status(400).json({
        message: "Please provide a valid future scheduling time.",
      });
    }

    const uniqueRecipients = [...new Set(recipients)];

    const emails = [];

    for (let i = 0; i < uniqueRecipients.length; i++) {
      const recipient = uniqueRecipients[i];

      const email = await prisma.email.create({
        data: {
          recipient,
          subject,
          body,
          scheduledAt: new Date(
            startTime.getTime() + i * Number(delay || 2000),
          ),
          jobId: `email-${crypto.randomUUID()}`,
        },
      });

      emails.push(email);
    }

    for (const email of emails) {
      await emailQueue.add(
        "send-email",
        { emailId: email.id },
        {
          jobId: email.jobId,
          delay: Math.max(0, email.scheduledAt.getTime() - Date.now()),
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      );
    }

    res.status(201).json({
      message: "Emails scheduled successfully.",
      count: emails.length,
      emails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Unable to schedule emails.",
    });
  }
});

router.get("/scheduled", async (_req, res) => {
  const emails = await prisma.email.findMany({
    where: { status: "scheduled" },
    orderBy: { scheduledAt: "asc" },
  });

  res.json(emails);
});

router.get("/sent", async (_req, res) => {
  const emails = await prisma.email.findMany({
    where: { status: "sent" },
    orderBy: { sentAt: "desc" },
  });

  res.json(emails);
});

export default router;
