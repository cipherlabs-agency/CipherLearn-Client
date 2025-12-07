import { config } from "./env.config";

export const corsOptions = {
  origin: config.APP.CLIENT_URL || "http://localhost:3000",
  withCredentials: true,
};
