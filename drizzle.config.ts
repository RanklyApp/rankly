import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local (then .env) so `pnpm db:generate` / `pnpm db:migrate` read
// local secrets without any manual export. Inlined here — not the shared
// `db/env` import — because drizzle-kit bundles this config and doesn't reliably
// run a side-effect module import before evaluating defineConfig(). dotenv never
// overrides existing vars, so .env.local wins and real env vars (CI) still take
// precedence.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Only manage the `public` schema. Supabase ships system schemas (auth,
  // storage, realtime…) whose CHECK constraints crash drizzle-kit's
  // introspection on re-push; scoping to public avoids touching them.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
