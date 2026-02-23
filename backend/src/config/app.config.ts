import { config } from "./env.config";

export const corsOptions = {
  origin: config.APP.CLIENT_URL,
  withCredentials: true,
};
