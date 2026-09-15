/**
 * Env loader for standalone CLI scripts (drizzle-kit, `tsx db/seed.ts`).
 *
 * Next.js loads `.env.local` automatically, but plain Node tools only read
 * `.env`. This makes the CLI scripts match Next's precedence: `.env.local`
 * first (local secrets, highest priority), then `.env` as a fallback. dotenv
 * never overrides a variable that is already set, so the first file — and any
 * real environment variable (e.g. in CI) — always wins.
 *
 * Paths are resolved from the current working directory, which is the project
 * root when scripts are run via `pnpm db:migrate` / `pnpm db:seed`.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config(); // .env fallback
