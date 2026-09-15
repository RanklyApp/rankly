"use client";

import { Trash2 } from "lucide-react";

/**
 * Submit button for the admin delete form. Guards the (irreversible) delete
 * behind a native confirm(): cancelling the dialog prevents the submit.
 */
export function AdminDeleteButton({ name }: { name: string }) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (
          !window.confirm(
            `¿Eliminar definitivamente "${name}"? Esta acción no se puede deshacer.`,
          )
        ) {
          e.preventDefault();
        }
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-destructive/40 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Trash2 className="size-4" aria-hidden />
      Eliminar
    </button>
  );
}
