import express from "express";
import cors from "cors";
import "dotenv/config";
import { PORT, prisma } from "./config.js";
import emailRoutes from "./routes/emails.js";
import "./worker.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Outbox API is running",
    status: "healthy",
  });
});

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "healthy", database: "connected" });
  } catch {
    res.status(500).json({ status: "unhealthy" });
  }
});

app.use("/api/emails", emailRoutes);

app.listen(PORT, () => {
  console.log(`Outbox backend running on port ${PORT}`);
});
