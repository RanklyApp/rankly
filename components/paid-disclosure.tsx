import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Línea de divulgación de posicionamiento pago. Debe aparecer encima de
 * cualquier listado que pueda incluir fichas "Destacado".
 */
export function PaidDisclosure({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Las posiciones marcadas como{" "}
      <span className="font-semibold text-promoted-foreground">
        Destacado
      </span>{" "}
      son espacios pagos y no implican recomendación de Rankly.{" "}
      <Link
        href="/terminos#posicionamiento-pagado"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Más información
      </Link>
    </p>
  );
}
