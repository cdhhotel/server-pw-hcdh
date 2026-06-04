import express from "express";
import cors from "cors";
import helmet from "helmet";
import router from "./routes/index.js";
import { swaggerUi, swaggerDocument } from "./config/swagger.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount the API router
app.use("/api", router);

// General health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

export default app;
