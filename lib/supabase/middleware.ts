import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session for a request and returns the current
 * user plus a response carrying any rotated auth cookies. Used by `proxy.ts`
 * to gate the owner dashboard. Follows the @supabase/ssr middleware pattern.
 *
 * If Supabase env is missing, returns no user so the caller redirects to login
 * instead of crashing.
 */
export async function updateSession(
  req: NextRequest,
): Promise<{ response: NextResponse; user: { id: string; email?: string } | null }> {
  let response = NextResponse.next({ request: req });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { response, user: null };

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        response = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() revalidates the token with Supabase (don't trust getSession here).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user: user ? { id: user.id, email: user.email } : null };
}
