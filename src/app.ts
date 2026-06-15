import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import router from "./routes/index.routes.js";
import { swaggerUi, swaggerDocument } from "./config/swagger.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount the API router
app.use("/api", router);

// General health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Global error handler — captura errores de middlewares (multer, etc.) en Express v5
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("[GlobalError]", message);
  res.status(500).json({ success: false, message });
});

export default app;

