import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Request gate.
 *  - /dashboard/* → owner area. Requires a Supabase session (magic-link claim),
 *                   otherwise redirects to /acceder. Also refreshes the session
 *                   cookies on each request.
 *
 * Next 16 renamed the `middleware` file convention to `proxy` (same behavior).
 */
async function requireOwnerSession(req: NextRequest): Promise<NextResponse> {
  const { response, user } = await updateSession(req);
  if (!user) {
    return NextResponse.redirect(new URL("/acceder", req.url));
  }
  return response;
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/dashboard")) return requireOwnerSession(req);
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
