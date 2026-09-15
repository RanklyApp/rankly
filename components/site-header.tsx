"use client";

import { Rocket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderCta } from "@/components/header-cta";
import { SearchBar } from "@/components/search-bar";
import { SITE_NAME } from "@/lib/constants";

export function SiteHeader() {
  const pathname = usePathname();
  // Bare pages render their own full-bleed background with no header/top border
  // (landing, signup form, owner dashboard). Every other page keeps the header.
  if (
    pathname === "/" ||
    pathname === "/submit" ||
    pathname.startsWith("/dashboard")
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center justify-between gap-4 sm:justify-start">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Rocket className="size-4" aria-hidden />
            </span>
            <span>{SITE_NAME}</span>
          </Link>
        </div>

        <div className="flex-1 sm:max-w-xl sm:mx-auto">
          <SearchBar />
        </div>

        <div className="sm:ml-auto">
          <HeaderCta />
        </div>
      </div>
    </header>
  );
}
