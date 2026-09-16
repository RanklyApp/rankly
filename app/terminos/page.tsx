/**
 * BORRADOR PARA REVISIÓN LEGAL — no es un documento final.
 * Este archivo debe ser revisado y aprobado por un abogado antes de publicarse.
 * Los marcadores [PENDIENTE: …] indican información que debe ser completada
 * por el titular del proyecto antes de la publicación.
 */

import type { Metadata } from "next";
import { LegalLayout, LegalSection } from "@/components/legal-layout";
import { LEGAL_LAST_UPDATED } from "@/lib/legal-date";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description:
    "Condiciones de uso de Rankly: criterios de posicionamiento, pagos, marcas de terceros y ley aplicable.",
  alternates: { canonical: "/terminos" },
};

const TOC = [
  { id: "objeto", label: "1. Objeto y alcance" },
  { id: "posicionamiento-pagado", label: "2. Posicionamiento pagado" },
  { id: "posicionamiento-organico", label: "3. Posicionamiento orgánico" },
  { id: "correccion-baja", label: "4. Corrección y eliminación de fichas" },
  { id: "marcas", label: "5. Marcas de terceros" },
  { id: "reclamo-ficha", label: "6. Reclamo de ficha por su titular" },
  { id: "contenido-subido", label: "7. Contenido subido por el publicador" },
  { id: "pagos", label: "8. Pagos y facturación" },
  { id: "garantia", label: "9. Sin garantía de resultados" },
  { id: "modificaciones", label: "10. Modificaciones al servicio" },
  { id: "ley-aplicable", label: "11. Ley aplicable" },
];

export default function TerminosPage() {
  return (
    <LegalLayout
      title="Términos y Condiciones"
      lastUpdated={LEGAL_LAST_UPDATED}
      toc={TOC}
    >
      <LegalSection id="objeto" title="1. Objeto y alcance">
        <p>
          Rankly es un directorio público de herramientas de software como
          servicio (SaaS) con inteligencia artificial. El servicio permite a
          visitantes descubrir y acceder a herramientas de terceros, y a
          titulares de productos publicar fichas de presentación.
        </p>
        <p>
          Al utilizar Rankly —ya sea como visitante, como publicador de una
          ficha o como anunciante— usted acepta estos Términos y Condiciones.
          Si no los acepta, debe abstenerse de usar el servicio.
        </p>
        <p>
          Titular del servicio:{" "}
          <strong>
            [PENDIENTE: razón social o nombre completo de las personas físicas
            responsables]
          </strong>
          , con domicilio en{" "}
          <strong>[PENDIENTE: domicilio legal]</strong>.
        </p>
      </LegalSection>

      <LegalSection
        id="posicionamiento-pagado"
        title="2. Posicionamiento pagado"
      >
        <p>
          Rankly ofrece posiciones destacadas dentro del listado principal. Las
          fichas que ocupan esas posiciones son identificadas de forma visible
          con el indicador <strong>Destacado</strong> y se ordenan de mayor a
          menor según el importe mensual abonado por el anunciante.
        </p>
        <p>
          El posicionamiento pagado es un espacio publicitario. No implica
          recomendación, aval, verificación de calidad ni relación comercial de
          ningún tipo entre Rankly y el producto anunciado.
        </p>
        <p>
          El número máximo de posiciones destacadas que se muestran
          simultáneamente puede ser modificado por Rankly conforme a lo
          establecido en la cláusula 10.
        </p>
      </LegalSection>

      <LegalSection
        id="posicionamiento-organico"
        title="3. Posicionamiento orgánico"
      >
        <p>
          Las fichas sin contrato de posicionamiento pagado se ordenan según
          criterios orgánicos, que actualmente consideran la cantidad de
          visitas registradas en el directorio y la fecha de publicación de la
          ficha (las más recientes primero en igualdad de condiciones).
        </p>
        <p>
          Rankly puede ajustar los criterios orgánicos en cualquier momento sin
          obligación de notificación previa, dado que no están vinculados a
          ninguna relación contractual de pago.
        </p>
      </LegalSection>

      <LegalSection
        id="correccion-baja"
        title="4. Corrección y eliminación de fichas"
      >
        <p>
          Cualquier titular de una marca, producto o servicio listado en
          Rankly puede solicitar la corrección o eliminación de su ficha
          escribiendo a{" "}
          <strong>[PENDIENTE: casilla de contacto legal]</strong>.
        </p>
        <p>
          Rankly procesará la solicitud dentro de los <strong>5 días hábiles</strong>{" "}
          siguientes a su recepción. Si la solicitud de baja procede, la ficha
          será retirada del directorio en ese plazo.
        </p>
        <p>
          En el caso de solicitudes de corrección, Rankly evaluará la
          información aportada y aplicará los cambios que sean verificables y
          razonables. Si la ficha fue publicada originalmente por un tercero
          distinto al titular de la marca, aplica también la cláusula 6.
        </p>
      </LegalSection>

      <LegalSection id="marcas" title="5. Marcas de terceros">
        <p>
          Los nombres comerciales, marcas registradas y logotipos que aparecen
          en el directorio pertenecen a sus respectivos titulares. Su uso en
          Rankly es nominativo y tiene por único propósito identificar el
          producto o servicio al que hace referencia cada ficha.
        </p>
        <p>
          Rankly no afirma tener ninguna relación comercial, patrocinio,
          asociación ni endorsement con los productos listados, salvo que se
          indique expresamente en un acuerdo escrito separado.
        </p>
      </LegalSection>

      <LegalSection
        id="reclamo-ficha"
        title="6. Reclamo de ficha por su titular"
      >
        <p>
          Si una ficha fue creada por un tercero y usted es el titular
          legítimo del producto o marca en cuestión, puede reclamarla
          escribiendo a{" "}
          <strong>[PENDIENTE: casilla de contacto legal]</strong> con:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Nombre del producto y URL del directorio donde aparece.</li>
          <li>
            Documentación que acredite su titularidad (escritura social,
            registro de marca, dominio del sitio web oficial u otro medio
            equivalente).
          </li>
          <li>Correo electrónico de contacto para recibir la respuesta.</li>
        </ul>
        <p>
          Rankly verificará la documentación aportada en un plazo de{" "}
          <strong>[PENDIENTE: definir plazo]</strong>. Si la verificación es
          positiva, se transfiere la gestión de la ficha al reclamante.
        </p>
        <p>
          Si existen dos reclamos simultáneos sobre la misma ficha, Rankly
          suspenderá la ficha mientras resuelve la disputa. Ambas partes serán
          notificadas y se les solicitará documentación adicional. Si la
          disputa no puede resolverse administrativamente, Rankly derivará a
          las partes a los canales legales correspondientes y mantendrá la
          ficha suspendida hasta recibir resolución firme.
        </p>
      </LegalSection>

      <LegalSection
        id="contenido-subido"
        title="7. Contenido subido por el publicador"
      >
        <p>
          Quien publica una ficha en Rankly declara y garantiza que:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            Tiene los derechos necesarios sobre el logotipo, imágenes y texto
            descriptivo que sube, o cuenta con autorización expresa del titular
            para hacerlo.
          </li>
          <li>
            El contenido no infringe derechos de propiedad intelectual ni
            industrial de terceros.
          </li>
          <li>
            El contenido es veraz y no es engañoso para los visitantes.
          </li>
        </ul>
        <p>
          Al subir contenido, el publicador otorga a Rankly una licencia no
          exclusiva, gratuita, transferible y con vigencia indefinida para
          exhibir, reproducir y distribuir ese contenido en el marco del
          servicio de directorio.
        </p>
        <p>
          Rankly puede rechazar, modificar o retirar cualquier ficha a su
          criterio, sin expresión de causa ni responsabilidad, en cualquier
          momento.
        </p>
      </LegalSection>

      <LegalSection id="pagos" title="8. Pagos y facturación">
        <p>
          El procesamiento de pagos para posiciones destacadas es gestionado
          por <strong>Dodo Payments</strong>, que actúa como merchant of
          record. La relación contractual de venta se perfecciona entre Dodo
          Payments y el anunciante. Dodo Payments es responsable de emitir las
          facturas correspondientes y de gestionar los impuestos que resulten
          aplicables según la jurisdicción del comprador.
        </p>
        <p>
          Consulte los{" "}
          <a
            href="https://dodopayments.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Términos de Servicio de Dodo Payments
          </a>{" "}
          para conocer las condiciones que rigen la relación de pago.{" "}
          <strong>[PENDIENTE: verificar URL exacta de los términos de Dodo Payments]</strong>
        </p>

        <p className="font-medium text-foreground">Ciclo de facturación</p>
        <p>
          Las posiciones destacadas se contratan con ciclo de facturación
          mensual. El cobro se realiza al inicio de cada período.
        </p>

        <p className="font-medium text-foreground">Fallo o rechazo de pago</p>
        <p>
          Si el cobro mensual falla o es rechazado, la ficha pasa
          automáticamente al bloque orgánico al finalizar el período pagado.
          Rankly enviará una notificación al correo registrado.{" "}
          <strong>
            [PENDIENTE: definir período de gracia y proceso de reintento con
            Dodo Payments]
          </strong>
        </p>

        <p className="font-medium text-foreground">Baja del servicio</p>
        <p>
          El anunciante puede dar de baja su suscripción en cualquier momento
          desde el portal de cliente de Dodo Payments. La baja surte efecto al
          final del período mensual ya pagado; la ficha permanece en posición
          destacada hasta esa fecha.{" "}
          <strong>
            [PENDIENTE: confirmar proceso exacto de cancelación con Dodo
            Payments y si existe acceso a portal propio]
          </strong>
        </p>

        <p className="font-medium text-foreground">Reembolsos</p>
        <p>
          Los períodos ya facturados no se reembolsan de forma proporcional,
          salvo que la legislación aplicable en la jurisdicción del anunciante
          establezca lo contrario o Dodo Payments determine un reembolso
          conforme a su política.{" "}
          <strong>
            [PENDIENTE: confirmar política de reembolsos con Dodo Payments]
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="garantia" title="9. Sin garantía de resultados">
        <p>
          Rankly no garantiza un número mínimo de visitas, clics, impresiones
          ni conversiones como resultado de la contratación de una posición
          destacada o de la publicación de una ficha gratuita.
        </p>
        <p>
          El posicionamiento en el directorio no constituye garantía de
          rendimiento comercial de ningún tipo.
        </p>
      </LegalSection>

      <LegalSection id="modificaciones" title="10. Modificaciones al servicio">
        <p>
          Rankly puede modificar en cualquier momento los criterios de
          ordenamiento del listado (tanto para posiciones pagas como
          orgánicas), la cantidad máxima de posiciones destacadas disponibles
          y las condiciones generales del servicio.
        </p>
        <p>
          Las modificaciones que afecten a anunciantes con contratos activos
          serán notificadas con una antelación mínima de{" "}
          <strong>[PENDIENTE: definir plazo, ej. 15 días]</strong> al correo
          registrado, antes de entrar en vigor.
        </p>
        <p>
          El uso continuado del servicio tras la notificación implica la
          aceptación de los cambios. Si el anunciante no acepta las
          modificaciones, puede dar de baja su suscripción conforme a lo
          establecido en la cláusula 8.
        </p>
      </LegalSection>

      <LegalSection id="ley-aplicable" title="11. Ley aplicable">
        <p>
          Estos Términos y Condiciones se rigen por las leyes de la República
          Oriental del Uruguay. Para cualquier controversia derivada de su
          interpretación o aplicación, las partes se someten a la jurisdicción
          de los tribunales competentes de Uruguay, sin perjuicio de los
          derechos irrenunciables que la legislación del país de residencia del
          consumidor pueda reconocerle.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
