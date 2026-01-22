import express from "express";
import cors from "cors";
import helmet from "helmet";
import httpLogger from "./middleware/httpLogger";
import logger from "./utils/logger";
import { config } from "./config/env.config";

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: config.APP.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors());

// Trust proxy for rate limiting (important for production behind load balancer)
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(httpLogger);

app.get("/", (req, res) => {
  logger.info("Health check endpoint hit");
  return res.send("CipherLearn");
});

export default app;
