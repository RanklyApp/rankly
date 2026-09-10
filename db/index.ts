import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export { schema };

type DB = PostgresJsDatabase<typeof schema>;

let cached: DB | null = null;

/**
 * Lazily creates the Drizzle client. Throws if DATABASE_URL is missing — the
 * query layer catches this so pages can still render clean empty states before
 * a database is connected.
 */
export function getDb(): DB {
  if (cached) return cached;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // `prepare: false` is required with Supabase's transaction pooler.
  const client = postgres(connectionString, { prepare: false });
  cached = drizzle(client, { schema });
  return cached;
}

/** True when a database connection string is configured. */
export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
