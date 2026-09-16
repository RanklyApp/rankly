"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Where the search navigates on submit. Ignored in controlled live-filter
   *  mode (when `onValueChange` is set). */
  action?: string;
  /** Preserve extra query params (e.g. staying on a category). */
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Controlled live-filter value. Pass together with `onValueChange` to filter
   *  in place instead of navigating on submit. */
  value?: string;
  /** Controlled live-filter callback. When provided, every keystroke calls this
   *  and submitting does NOT navigate — the parent filters the list in place. */
  onValueChange?: (value: string) => void;
}

export function SearchBar({
  action = "/",
  defaultValue = "",
  placeholder = "Buscá una funcionalidad: transcribir reuniones, generar imágenes…",
  className,
  autoFocus,
  value,
  onValueChange,
}: SearchBarProps) {
  const router = useRouter();
  // Controlled live-filter mode when the parent passes onValueChange; otherwise
  // fall back to the legacy navigate-on-submit behavior with local state.
  const controlled = onValueChange !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? value ?? "" : internal;

  function handleChange(next: string) {
    if (controlled) onValueChange(next);
    else setInternal(next);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Live-filter mode: nothing to navigate — results already filtered as you type.
    if (controlled) return;
    const q = internal.trim();
    router.push(q ? `${action}?q=${encodeURIComponent(q)}` : action);
  }

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn("relative w-full", className)}
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        type="search"
        name="q"
        value={current}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar herramientas"
        autoFocus={autoFocus}
        className="h-11 pl-9"
      />
    </form>
  );
}
