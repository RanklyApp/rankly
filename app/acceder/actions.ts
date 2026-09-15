"use server";

import { redirect } from "next/navigation";
import { ensureUserRow } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations";

export interface LoginState {
  error?: string;
}

/**
 * Owner login with email + password. On success sets the session cookies and
 * redirects to the dashboard; on failure returns a generic error (no hint about
 * which part was wrong).
 */
export async function signInOwner(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Email o contraseña inválidos." };

  const email = parsed.data.email.toLowerCase();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Email o contraseña incorrectos." };
  }

  // Defensive: ensure the public.users row exists (it normally does).
  try {
    await ensureUserRow(data.user.id, email);
  } catch {
    // Non-fatal.
  }

  redirect("/dashboard");
}
