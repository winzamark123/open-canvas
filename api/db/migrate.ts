import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, closeConnection } from "./index.js";

async function runMigrations() {
  console.log("⏳ Running migrations...");

  try {
    await migrate(db, { migrationsFolder: "./api/db/migrations" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed!");
    console.error(error);
    process.exit(1);
  } finally {
    await closeConnection();
    process.exit(0);
  }
}

runMigrations();
