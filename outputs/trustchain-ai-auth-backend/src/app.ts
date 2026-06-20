import compression from "compression";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOrigins, env } from "./config/env";
import { authRouter } from "./modules/auth/auth.routes";
import { deviceRouter } from "./modules/devices/device.routes";
import { errorMiddleware } from "./shared/middleware/error.middleware";
import { notFoundMiddleware } from "./shared/middleware/not-found.middleware";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  if (env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", service: "trustchain-ai-auth" });
  });

  app.use("/api/auth", authRouter);
  app.use("/devices", deviceRouter);
  app.use("/api/devices", deviceRouter);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
