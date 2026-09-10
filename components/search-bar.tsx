"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  /** Where the search navigates on submit. */
  action?: string;
  /** Preserve extra query params (e.g. staying on a category). */
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  action = "/buscar",
  defaultValue = "",
  placeholder = "Buscá una funcionalidad: transcribir reuniones, generar imágenes…",
  className,
  autoFocus,
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
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
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar herramientas"
        autoFocus={autoFocus}
        className="h-11 pl-9"
      />
    </form>
  );
}
