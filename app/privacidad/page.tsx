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
  title: "Política de Privacidad",
  description:
    "Cómo Rankly recopila, utiliza y protege los datos de visitantes, publicadores y anunciantes.",
  alternates: { canonical: "/privacidad" },
};

const TOC = [
  { id: "responsable", label: "1. Responsable del tratamiento" },
  { id: "datos-visitantes", label: "2. Visitantes anónimos" },
  { id: "datos-publicadores", label: "3. Personas que publican una ficha" },
  { id: "datos-anunciantes", label: "4. Anunciantes" },
  { id: "favicons-google", label: "5. Carga de favicons mediante Google" },
  { id: "registro-clics", label: "6. Registro de clics" },
  { id: "subprocesadores", label: "7. Subprocesadores y terceros" },
  { id: "derechos", label: "8. Derechos del titular de los datos" },
  { id: "base-legal", label: "9. Base legal (Ley 18.331)" },
  { id: "contacto", label: "10. Contacto" },
];

export default function PrivacidadPage() {
  return (
    <LegalLayout
      title="Política de Privacidad"
      lastUpdated={LEGAL_LAST_UPDATED}
      toc={TOC}
    >
      <LegalSection id="responsable" title="1. Responsable del tratamiento">
        <p>
          El responsable del tratamiento de datos personales recolectados a
          través de Rankly es{" "}
          <strong>
            [PENDIENTE: razón social o nombre completo de las personas físicas
            responsables]
          </strong>
          , con domicilio en{" "}
          <strong>[PENDIENTE: domicilio legal]</strong>.
        </p>
        <p>
          Para consultas relacionadas con esta Política, puede escribir a{" "}
          <strong>[PENDIENTE: casilla de contacto legal]</strong>.
        </p>
      </LegalSection>

      <LegalSection id="datos-visitantes" title="2. Visitantes anónimos">
        <p>
          Los visitantes que navegan Rankly sin registrarse ni publicar una
          ficha no proporcionan datos personales directamente al servicio.
        </p>
        <p>
          De forma indirecta, la infraestructura de Rankly puede procesar datos
          técnicos de la conexión (dirección IP, navegador, sistema operativo,
          URL de referencia y páginas visitadas) en los registros del servidor
          de Vercel, que presta el servicio de alojamiento. Estos datos son
          necesarios para el funcionamiento técnico del sitio y no se utilizan
          para identificar individualmente a los visitantes.
        </p>
        <p>
          Adicionalmente, al cargar los favicons de las aplicaciones listadas,
          la dirección IP del visitante puede llegar a los servidores de Google.
          Consulte la cláusula 5 para más detalle.
        </p>
      </LegalSection>

      <LegalSection
        id="datos-publicadores"
        title="3. Personas que publican una ficha"
      >
        <p>
          Quienes publican una ficha de producto en Rankly proporcionan los
          siguientes datos:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Correo electrónico:</strong> utilizado para crear la cuenta
            de acceso al panel de administración de la ficha y para
            comunicaciones relacionadas con la misma.
          </li>
          <li>
            <strong>Nombre del producto y descripción:</strong> información
            pública que aparece en el directorio.
          </li>
          <li>
            <strong>URL del sitio web:</strong> información pública para
            dirigir al visitante al producto.
          </li>
          <li>
            <strong>Logotipo:</strong> imagen subida voluntariamente y
            almacenada en Supabase Storage; se muestra públicamente en la
            ficha.
          </li>
        </ul>
        <p>
          El correo electrónico no se muestra públicamente. Se utiliza
          exclusivamente para la gestión de la cuenta y para comunicaciones
          operativas o contractuales relacionadas con el servicio.
        </p>
      </LegalSection>

      <LegalSection id="datos-anunciantes" title="4. Anunciantes">
        <p>
          Quienes contratan una posición destacada proporcionan datos de
          facturación (nombre, correo electrónico, datos de tarjeta de pago u
          otros medios de pago) directamente a{" "}
          <strong>Dodo Payments</strong>, que actúa como merchant of record y
          es responsable del tratamiento de esos datos de pago conforme a su
          propia política de privacidad.
        </p>
        <p>
          Rankly recibe de Dodo Payments únicamente la confirmación del estado
          del pago (activo, fallido, cancelado) y los datos de identificación
          mínimos necesarios para asociar la suscripción a la ficha
          correspondiente.
        </p>
      </LegalSection>

      <LegalSection
        id="favicons-google"
        title="5. Carga de favicons mediante Google"
      >
        <p>
          Los logotipos de las aplicaciones que no cuentan con imagen propia se
          cargan en el navegador del visitante directamente desde el servicio
          de favicons de Google:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            https://www.google.com/s2/favicons
          </code>
          .
        </p>
        <p>
          Esta carga implica que el navegador del visitante realiza una
          solicitud HTTP a los servidores de Google, lo que expone la dirección
          IP del visitante a Google en el momento de esa solicitud. Rankly no
          controla el tratamiento que Google realice de esa información.
        </p>
        <p>
          Los favicons se cargan mediante una etiqueta{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            &lt;img&gt;
          </code>{" "}
          con el atributo{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            referrerpolicy="no-referrer"
          </code>
          , de modo que no se envía a Google la URL de la página de Rankly que
          el visitante está viendo.
        </p>
      </LegalSection>

      <LegalSection id="registro-clics" title="6. Registro de clics">
        <p>
          Cuando un visitante hace clic en el enlace de salida hacia un
          producto listado, Rankly registra el evento en la tabla{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">events</code>{" "}
          de la base de datos. Los datos que se almacenan son:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Identificador de la aplicación:</strong> qué producto fue
            clicado.
          </li>
          <li>
            <strong>Tipo de evento:</strong> siempre{" "}
            <em>click</em> en este caso.
          </li>
          <li>
            <strong>Hash de sesión:</strong> un identificador derivado de
            características técnicas de la conexión (por ejemplo, user agent
            e IP), aplicando una función de hash unidireccional. El hash no
            permite recuperar la dirección IP ni identificar al visitante. Se
            utiliza exclusivamente para deduplicar clics repetidos del mismo
            usuario en la misma sesión.
          </li>
          <li>
            <strong>URL de referencia (referrer):</strong> la dirección de la
            página desde la que el visitante llegó al directorio, si el
            navegador la envía.
          </li>
          <li>
            <strong>Fecha y hora:</strong> marca temporal del evento (UTC).
          </li>
        </ul>
        <p>
          Esta información se utiliza para calcular métricas de rendimiento
          por ficha (número de clics) que se muestran a los titulares de las
          fichas en su panel privado, y para ordenar el listado orgánico
          (mayor cantidad de clics = posición más alta en el bloque orgánico).
        </p>
        <p>
          Los registros de eventos no se venden ni se comparten con terceros
          con fines comerciales.
        </p>
      </LegalSection>

      <LegalSection id="subprocesadores" title="7. Subprocesadores y terceros">
        <p>
          Rankly utiliza los siguientes servicios de terceros que pueden
          procesar datos relacionados con el funcionamiento del sitio:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Vercel:</strong> servicio de alojamiento y CDN. Procesa
            solicitudes HTTP incluyendo datos técnicos de la conexión.
            <br />
            <span className="text-muted-foreground/70">
              [PENDIENTE: agregar enlace a la política de privacidad de Vercel]
            </span>
          </li>
          <li>
            <strong>Supabase / Neon:</strong> base de datos PostgreSQL y
            almacenamiento de archivos (logotipos). Almacena datos de fichas,
            cuentas de publicadores y registro de eventos.
            <br />
            <span className="text-muted-foreground/70">
              [PENDIENTE: agregar enlace a la política de privacidad de
              Supabase/Neon]
            </span>
          </li>
          <li>
            <strong>Dodo Payments:</strong> procesador de pagos y merchant of
            record. Trata datos de facturación de anunciantes.
            <br />
            <span className="text-muted-foreground/70">
              [PENDIENTE: agregar enlace a la política de privacidad de Dodo
              Payments]
            </span>
          </li>
          <li>
            <strong>Google:</strong> servicio de favicons (
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              google.com/s2/favicons
            </code>
            ). Puede recibir la dirección IP del visitante al cargar las
            imágenes. Ver cláusula 5.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="derechos" title="8. Derechos del titular de los datos">
        <p>
          Las personas cuyos datos son tratados por Rankly tienen derecho a:
        </p>
        <ul className="ml-4 list-disc space-y-1">
          <li>
            <strong>Acceso:</strong> solicitar información sobre qué datos
            personales están almacenados.
          </li>
          <li>
            <strong>Rectificación:</strong> solicitar la corrección de datos
            inexactos o incompletos.
          </li>
          <li>
            <strong>Supresión:</strong> solicitar la eliminación de los datos
            cuando ya no sean necesarios para la finalidad con la que fueron
            recogidos, o cuando se retire el consentimiento.
          </li>
          <li>
            <strong>Oposición:</strong> oponerse al tratamiento de sus datos
            en determinadas circunstancias.
          </li>
        </ul>
        <p>
          Para ejercer cualquiera de estos derechos, escriba a{" "}
          <strong>[PENDIENTE: casilla de contacto legal]</strong> indicando su
          identidad, el derecho que desea ejercer y, si corresponde, los datos
          afectados.
        </p>
        <p>
          Rankly responderá en un plazo máximo de{" "}
          <strong>[PENDIENTE: definir plazo, ej. 15 días hábiles]</strong>{" "}
          desde la recepción de la solicitud.
        </p>
      </LegalSection>

      <LegalSection id="base-legal" title="9. Base legal (Ley 18.331)">
        <p>
          El tratamiento de datos personales descripto en esta Política se
          rige por la{" "}
          <strong>
            Ley N.° 18.331 de Protección de Datos Personales y Acción de
            Habeas Data de la República Oriental del Uruguay
          </strong>{" "}
          y su normativa complementaria.
        </p>
        <p>
          Los datos son tratados únicamente para las finalidades declaradas en
          esta Política y no serán utilizados para usos distintos sin
          consentimiento expreso del titular o habilitación legal.
        </p>
        <p>
          El tratamiento de datos de publicadores (correo electrónico) tiene
          como base la ejecución del contrato de prestación del servicio de
          directorio. El registro de clics tiene como base el interés legítimo
          de Rankly en medir el rendimiento del servicio y ordenar los
          resultados. El tratamiento de datos de anunciantes es realizado por
          Dodo Payments bajo su propia base legal como merchant of record.
        </p>
        <p>
          <strong>
            [PENDIENTE: revisar con asesoría legal si las bases legales
            indicadas son adecuadas bajo la Ley 18.331 y su reglamentación]
          </strong>
        </p>
      </LegalSection>

      <LegalSection id="contacto" title="10. Contacto">
        <p>
          Para consultas, solicitudes de ejercicio de derechos o reclamos
          relacionados con el tratamiento de datos personales, puede
          comunicarse a:
        </p>
        <p>
          <strong>[PENDIENTE: casilla de contacto legal]</strong>
        </p>
        <p>
          Si considera que su solicitud no ha sido atendida de forma
          satisfactoria, tiene derecho a presentar una reclamación ante la{" "}
          <strong>
            Unidad Reguladora y de Control de Datos Personales (URCDP)
          </strong>{" "}
          de Uruguay.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
