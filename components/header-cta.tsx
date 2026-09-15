"use client";

import { Eye, LayoutDashboard, LogOut, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Auth-aware header CTA, used in the site header and on the landing.
 *  - Logged out → "Agregar negocio" (→ /submit, one-step signup).
 *  - Logged in  → a view toggle to jump between the owner dashboard and the
 *                 public view without logging out, plus "Salir".
 *
 * Auth is checked client-side so public pages stay statically cacheable; the
 * toggle just appears after hydration for owners.
 */
export function HeaderCta() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    try {
      // Throws if the NEXT_PUBLIC_SUPABASE_* env vars are missing (e.g. not set
      // on the host). Degrade to the logged-out CTA instead of crashing the page.
      const supabase = createSupabaseBrowserClient();
      supabase.auth
        .getUser()
        .then(({ data }) => {
          if (active) setLoggedIn(Boolean(data.user));
        })
        .catch(() => {
          if (active) setLoggedIn(false);
        });
      const { data: sub } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (active) setLoggedIn(Boolean(session?.user));
        },
      );
      unsubscribe = () => sub.subscription.unsubscribe();
    } catch {
      // Env missing → leave `loggedIn` at its null default, which already
      // renders the logged-out CTA. (No synchronous setState in the effect.)
    }

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  // Until we know, and when logged out, show the signup CTA (matches SSR).
  if (!loggedIn) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/submit">
          <Plus className="size-4" aria-hidden />
          Agregar negocio
        </Link>
      </Button>
    );
  }

  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <div className="flex items-center gap-2">
      {onDashboard ? (
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <Eye className="size-4" aria-hidden />
            Ver como visitante
          </Link>
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" aria-hidden />
            Ver como negocio
          </Link>
        </Button>
      )}
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm" aria-label="Salir">
          <LogOut className="size-4" aria-hidden />
          <span className="hidden sm:inline">Salir</span>
        </Button>
      </form>
    </div>
  );
}
