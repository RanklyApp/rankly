/**
 * Creates (or repairs) the admin account WITHOUT going through the public
 * signup flow. Creates the Supabase Auth user with a confirmed email + given
 * password, mirrors the row into public.users, and sets role = "admin".
 *
 * Idempotent: if the Auth user already exists, its password is reset to the one
 * given so you can still log in, and the role is upgraded to admin.
 *
 * Run:  npx tsx db/create-admin.ts [email] [password]
 * Defaults: garciamariaa1983@gmail.com / Admin1234!
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + DATABASE_URL.
 */
import "./env";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase/admin";
import { getDb, schema } from "./index";

const DEFAULT_EMAIL = "garciamariaa1983@gmail.com";
const DEFAULT_PASSWORD = "Admin1234!";

/** Scan Auth users (paged) to find one by email. */
async function findAuthUserId(
  admin: SupabaseClient,
  email: string,
): Promise<string | undefined> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email,
    );
    if (match) return match.id;
    if (data.users.length < 200) break; // last page
  }
  return undefined;
}

async function main() {
  const email = (process.argv[2] ?? DEFAULT_EMAIL).trim().toLowerCase();
  const password = process.argv[3] ?? DEFAULT_PASSWORD;
  const admin = createAdminClient();

  // 1. Create the Auth user (email pre-confirmed so login works immediately).
  let userId: string | undefined;
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (created.error) {
    // Most likely already registered — find them and reset the password.
    userId = await findAuthUserId(admin, email);
    if (!userId) {
      console.error("✗ No se pudo crear ni encontrar el usuario en Auth:");
      console.error("  ", created.error.message);
      process.exit(1);
    }
    const upd = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    if (upd.error) {
      console.error("✗ No se pudo actualizar la contraseña:", upd.error.message);
      process.exit(1);
    }
    console.log("• El usuario ya existía en Auth — contraseña reseteada.");
  } else {
    userId = created.data.user?.id;
    console.log("• Usuario creado en Supabase Auth.");
  }

  if (!userId) {
    console.error("✗ No se obtuvo el id del usuario de Auth.");
    process.exit(1);
  }

  // 2. Mirror into public.users (id mirrors auth.users.id) as admin.
  const { users } = schema;
  await getDb()
    .insert(users)
    .values({ id: userId, email, role: "admin" })
    .onConflictDoUpdate({ target: users.id, set: { role: "admin", email } });

  console.log(`\n✓ Listo. ${email} es admin.`);
  console.log(`  Email:       ${email}`);
  console.log(`  Contraseña:  ${password}`);
  console.log(`  Entrá en /acceder; el panel de administración vive en /dashboard.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Error creando admin:", err);
  process.exit(1);
});
