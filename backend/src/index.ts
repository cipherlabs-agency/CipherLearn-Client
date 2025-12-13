import { config } from "./config/env.config";
import app from "./server";
import allRoutes from "./routes";
import Database from "./config/db.config";

app.use("/api", allRoutes);

const db = new Database();

async function startServer() {
  try {
    app.listen(config.APP.PORT, () => {
      console.log(`Server is running on port ${config.APP.PORT}`);
      db.connect();
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
