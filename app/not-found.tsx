import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Compass className="size-6" aria-hidden />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        No encontramos esta página
      </h1>
      <p className="mt-2 text-muted-foreground">
        El enlace puede estar roto o la herramienta ya no está disponible.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/categorias">Ver categorías</Link>
        </Button>
      </div>
    </div>
  );
}
