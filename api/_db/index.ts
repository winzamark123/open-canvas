import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

// For development (long-lived connection) vs production (serverless)
const isDevelopment = process.env.NODE_ENV === "development";

// Connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString,
  max: isDevelopment ? 1 : 10, // Fewer connections in dev
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
});

// Create Drizzle instance with schema
export const db = drizzle(pool, { schema });

// Helper to close connection (for scripts/migrations)
export const closeConnection = async () => {
  await pool.end();
};
