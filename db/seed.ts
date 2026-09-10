/**
 * Seed script — intentionally inserts NOTHING by default.
 *
 * This project ships with an empty database on purpose: no fake apps, no
 * placeholder categories, not even in development. Real categories are created
 * from the admin panel, and real apps arrive through the public submission form
 * + moderation queue.
 *
 * This file stays in the repo as a scaffold. If you ever need to bulk-load
 * REAL data (e.g. importing a vetted list), write the inserts inside `seed()`
 * below and run `pnpm db:seed` manually. It is NOT part of the startup command.
 */
import "dotenv/config";
import { getDb, schema } from "./index";

async function seed() {
  // No-op by default. Example of how you'd insert a real category:
  //
  // const db = getDb();
  // await db.insert(schema.categories).values({
  //   slug: "transcripcion",
  //   name: "Transcripción",
  //   description: "Herramientas que transcriben audio y reuniones.",
  //   icon: "mic",
  //   seoTitle: "Herramientas de transcripción con IA",
  //   seoDescription: "Las mejores apps de IA para transcribir reuniones y audio.",
  // });

  void getDb;
  void schema;

  console.log(
    "Seed is a no-op. The database is meant to start empty — add real data via the admin panel and submission form.",
  );
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
