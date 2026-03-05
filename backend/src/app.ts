import express from "express";
import path from "node:path";
import { readFile } from "node:fs/promises";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { InMemoryStore } from "./stores/in-memory-store.js";
import { createApiRouter } from "./routes/api-router.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { MockRunwayClient } from "./integrations/mock/runway-client.js";
import { MockStorageClient } from "./integrations/mock/storage-client.js";
import { MockPaymentsClient } from "./integrations/mock/payments-client.js";
import { MockEmailClient } from "./integrations/mock/email-client.js";

export async function createApp() {
  const app = express();
  const backendRoot = path.resolve(process.cwd());
  const openApiPath = path.resolve(backendRoot, "openapi.yaml");
  const rawOpenApi = await readFile(openApiPath, "utf-8");
  const openApiDocument = YAML.parse(rawOpenApi);

  const store = new InMemoryStore();
  const runwayClient = new MockRunwayClient();
  const storageClient = new MockStorageClient();
  const paymentsClient = new MockPaymentsClient();
  const emailClient = new MockEmailClient();

  // CORS (dev-friendly). TODO: tighten for production.
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/openapi.yaml", (_req, res) => {
    res.type("application/yaml").send(rawOpenApi);
  });

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(
    createApiRouter({
      store,
      runwayClient,
      storageClient,
      paymentsClient,
      emailClient,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
