import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Request gate.
 *  - /admin/*     → provisional HTTP Basic Auth (env vars). Replaced by a
 *                   Supabase role check later.
 *  - /dashboard/* → owner area. Requires a Supabase session (magic-link claim),
 *                   otherwise redirects to /acceder. Also refreshes the session
 *                   cookies on each request.
 *
 * Next 16 renamed the `middleware` file convention to `proxy` (same behavior).
 */
function adminBasicAuth(req: NextRequest): NextResponse {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASSWORD;

  // No credentials configured -> admin is unavailable.
  if (!user || !pass) {
    return new NextResponse("Admin no configurado.", { status: 503 });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const idx = decoded.indexOf(":");
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u === user && p === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Autenticación requerida", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}

async function requireOwnerSession(req: NextRequest): Promise<NextResponse> {
  const { response, user } = await updateSession(req);
  if (!user) {
    return NextResponse.redirect(new URL("/acceder", req.url));
  }
  return response;
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin")) return adminBasicAuth(req);
  if (pathname.startsWith("/dashboard")) return requireOwnerSession(req);
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};
