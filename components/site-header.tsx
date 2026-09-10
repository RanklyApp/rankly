"use client";

import { Rocket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { SITE_NAME } from "@/lib/constants";

export function SiteHeader() {
  const pathname = usePathname();
  // The home page has its own hero search — hide the header one there to avoid
  // two stacked search bars. Keep it on every other page.
  const showSearch = pathname !== "/";

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

        {showSearch && (
          <div className="flex-1 sm:max-w-xl sm:mx-auto">
            <SearchBar />
          </div>
        )}

        <div className="hidden items-center gap-2 sm:ml-auto sm:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/submit">Publicar app</Link>
          </Button>
        </div>

        <div className="sm:hidden">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/submit">Publicar tu app</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
