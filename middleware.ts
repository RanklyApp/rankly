import { type NextRequest, NextResponse } from "next/server";

/**
 * Provisional gate for the admin panel.
 *
 * Phase 1 has no user auth yet (magic link + role checks land in Phase 2), so
 * the admin panel is protected with HTTP Basic Auth via env vars. If the
 * credentials are not configured, the panel is closed entirely rather than
 * left open. Replace this with a Supabase role check in Phase 2.
 */
export function middleware(req: NextRequest) {
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

export const config = {
  matcher: ["/admin/:path*"],
};
