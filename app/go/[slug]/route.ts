import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { getAppForRedirect, recordClick } from "@/lib/queries";
import { siteUrl } from "@/lib/seo";

/**
 * Tracked outbound redirect. Logs the click, bumps clicks_count, then 302s to
 * the app's website. The visible anchor carries rel="sponsored nofollow".
 */
export async function GET(
  req: NextRequest,
  { params }: RouteContext<"/go/[slug]">,
) {
  const { slug } = await params;
  const app = await getAppForRedirect(slug);

  // Unknown/unapproved slug -> send home instead of erroring.
  if (!app) {
    return NextResponse.redirect(siteUrl(), { status: 302 });
  }

  const ua = req.headers.get("user-agent") ?? "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const referrer = req.headers.get("referer");
  const day = new Date().toISOString().slice(0, 10);
  // Coarse anonymous session id — no raw PII stored.
  const sessionHash = createHash("sha256")
    .update(`${ip}|${ua}|${day}`)
    .digest("hex")
    .slice(0, 32);

  await recordClick(app.id, { referrer, sessionHash });

  return NextResponse.redirect(app.websiteUrl, { status: 302 });
}
