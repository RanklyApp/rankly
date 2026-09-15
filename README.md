# SaaS Rank

Directorio público de aplicaciones SaaS con IA. El visitante busca una
funcionalidad ("necesito algo que transcriba reuniones"), navega por categoría o
buscador, y sale hacia el dominio de la app. No se registra ni deja datos.

Los dueños de las SaaS publican gratis (sin login, con moderación). Si además
pagan una suscripción mensual, su ficha aparece por encima de las gratuitas y,
entre las pagas, ordena de mayor a menor importe. **El sitio funciona completo
con cero apps y cero clientes pagos**: la capa de pago se enciende arriba de un
catálogo que ya anda solo.

## Stack

- **Next.js 16** (App Router) + **TypeScript** estricto (sin `any`)
- **Tailwind CSS v4** + **shadcn/ui** (base radix, Geist + Lucide)
- **PostgreSQL** vía **Supabase**, ORM **Drizzle** con migraciones versionadas
- **Supabase Storage** para logos; **Supabase Auth** (magic link) en Fase 2
- **Zod** valida todo input en cada API route / server action
- **Vitest** para el motor de ranking
- Deploy en **Vercel**

## Levantar en local

```bash
# 1. Clonar
git clone https://github.com/RanklyApp/rankly.git
cd rankly

# 2. Instalar dependencias
pnpm install

# 3. Variables de entorno
cp .env.example .env.local
# Abrí .env.local y completá las variables (ver sección "Variables de entorno")

# 4. Migraciones y seed (requiere DATABASE_URL en .env.local)
pnpm db:migrate     # aplica el schema en Supabase
pnpm db:seed        # carga las 15 categorías (idempotente)

# 5. Arrancar
pnpm dev
```

> **Sin `DATABASE_URL`** el proyecto igual arranca: `pnpm dev` levanta con un
> catálogo de demo (19 apps reales + 3 ficticias de ejemplo) sin tocar ninguna
> base de datos. Útil para explorar UI y rutas sin configurar Supabase.

> Las apps reales entran por el formulario público + moderación, nunca por código.
> Las categorías se cargan con `pnpm db:seed` (idempotente, re-correrlo no duplica nada).

### Schema y migraciones

El schema se maneja con **migraciones versionadas**. Editás `db/schema.ts`, luego:

```bash
pnpm db:generate    # genera el SQL de la migración a partir del diff del schema
pnpm db:migrate     # aplica las migraciones pendientes
```

No usamos `drizzle-kit push`: sobre Supabase crashea al introspeccionar los
schemas de sistema (`auth`, `storage`, …). `migrate` no introspecciona la base,
así que es estable. Los scripts leen `.env.local` solos (no hace falta exportar
nada).

### Variables de entorno

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Postgres de Supabase (usar el *Transaction pooler*, puerto 6543) |
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase (Storage / Auth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente Supabase público |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor: subir logos a Storage. Bypassa RLS |
| `NEXT_PUBLIC_SITE_URL` | Canonical, Open Graph, sitemap |
| `ADMIN_USER` / `ADMIN_PASSWORD` | Basic Auth provisional del panel admin (Fase 2 lo reemplaza) |

Antes de publicar apps con logo hay que crear un bucket **público** llamado
`logos` en Supabase Storage.

## Cómo agregar una categoría

Las categorías se administran desde el panel, no por código:

1. Configurá `ADMIN_USER` / `ADMIN_PASSWORD` en `.env.local`.
2. Entrá a `/admin/categories` (te pide las credenciales Basic Auth).
3. Completá **nombre**, **slug** (minúsculas y guiones, ej. `transcripcion`),
   **descripción**, **ícono** (nombre de un ícono de
   [Lucide](https://lucide.dev/icons), ej. `mic`, `image`, `code`), y
   **SEO title / description**.
4. Guardá. La categoría queda disponible en el formulario de alta, en
   `/categorias` y en `/c/<slug>`.

El ícono se resuelve en runtime con `DynamicIcon` de `lucide-react`, así que
cualquier nombre válido de Lucide funciona sin tocar el código.

## Ordenación del listado — `rankApps`

Función pura y testeada en `lib/rank.ts`:

- **Bloque pagado**: `plan === 'paid'`, ordenado por `monthlyAmountCents` DESC.
  Topeado en `MAX_PROMOTED` (default 5). Si hay más pagas que el tope, una
  ventana rotatoria (parámetro `offset`) elige cuáles se muestran, para que
  todas tengan exposición con el tiempo. Las pagas que se pasan del tope caen al
  bloque orgánico ese load, **sin perder el badge "Destacado"**.
- **Bloque orgánico**: el resto, por `clicksCount` DESC y luego más recientes.
- Sin apps pagas, degrada a orden puramente orgánico.

Es determinista (sin `Date.now` adentro): el `offset` se calcula afuera
(`lib/rotation.ts`, bucket horario) y se pasa como argumento, así el orden es
estable dentro de la ventana de cache ISR (server-rendered, indexable) pero rota
entre revalidaciones. Tests: `pnpm test`.

## Decisiones de arquitectura

- **Sin DB navegable**: la capa de queries (`lib/queries.ts`) envuelve cada
  lectura; si no hay `DATABASE_URL`, devuelve datos del catálogo demo en vez de
  romper la página. Todas las rutas (`/`, `/c/[slug]`, `/app/[slug]`, `/buscar`)
  son navegables sin Supabase. Con DB, los datos demo se usan solo como relleno
  inicial hasta que el catálogo real crezca.
- **Plata en centavos**: `monthlyAmountCents` es `integer` para evitar bugs de
  punto flotante con dinero.
- **Salida rastreada**: `/go/[slug]` registra el clic (evento + `clicks_count`) y
  hace 302 al sitio; el enlace visible lleva `rel="sponsored nofollow"` y `/go`
  está bloqueado en `robots.txt`.
- **SEO como canal principal**: fichas y categorías con `generateStaticParams` +
  ISR, `sitemap.xml` y `robots.txt` dinámicos, JSON-LD `SoftwareApplication` y
  `BreadcrumbList`, Open Graph, y filtros en la URL (indexables).
- **Admin provisional**: protegido con Basic Auth por middleware hasta que la
  Fase 2 traiga auth por rol con Supabase.
- **Sin datos falsos en producción**: sólo entran apps reales, revisadas.

## Estructura

```
app/            # rutas (home, /c/[slug], /app/[slug], /submit, /buscar, /admin, /go, /api)
components/     # UI (cards, grids, header, forms) + components/ui (shadcn)
db/             # schema Drizzle, cliente, seed (no-op), migraciones
lib/            # rank, queries, mutations, validations (Zod), seo, supabase
tests/          # tests de rankApps (Vitest)
```

## Roadmap

- **Fase 1 (hecha)**: catálogo público, alta con moderación, salida rastreada, SEO.
- **Fase 2**: cuentas por magic link, reclamo de ficha, dashboard del dueño
  (impresiones, clics, CTR, posición media).
- **Fase 3**: monetización con Stripe (Checkout, Customer Portal, webhooks).
```
