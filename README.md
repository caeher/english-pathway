# English Pathway

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow, validation, curriculum changes, and database migrations before opening a pull request.

Plataforma interactiva y gamificada para aprender inglés. Construida con **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS v4** y **Supabase**.

## Requisitos

- **Node.js 22+**
- **pnpm 10+**
- **Docker Desktop** en ejecución (WSL2 recomendado en Windows)
- **Supabase CLI** (incluida como devDependency del proyecto)

Verifica que Docker y la CLI funcionan:

```bash
docker info
pnpm exec supabase --version
```

## Desarrollo local

Flujo recomendado para reproducir el proyecto en tu máquina con Supabase local (Docker vía Supabase CLI).

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Levantar Supabase local

La primera ejecución descarga las imágenes Docker. Las migraciones en `supabase/migrations/` se aplican automáticamente.

```bash
pnpm db:start
```

### 3. Configurar variables de entorno

Genera `.env.local` con las claves del stack local:

```bash
pnpm db:env
```

Alternativa manual: copia `.env.example` a `.env.local` y rellena las claves con `pnpm exec supabase status`.

### 4. Poblar la base de datos

```bash
pnpm db:seed
```

Importa documentos legales. El currículo vive en `knowledge/` — para RAG:

```bash
pnpm kb:embed
```

(Requiere `OPENAI_API_KEY` en `.env.local`.)

### 5. Arrancar Next.js

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

### URLs locales de referencia

| Servicio | URL |
|----------|-----|
| App Next.js | http://localhost:3000 |
| Supabase API | http://127.0.0.1:54321 |
| Supabase Studio | http://127.0.0.1:54323 |
| Mailpit (emails) | http://127.0.0.1:54324 |
| Postgres directo | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

### Primer usuario

1. Regístrate en `/register`.
2. Abre [Mailpit](http://127.0.0.1:54324) y confirma el correo de verificación.
3. Inicia sesión en `/login` → serás redirigido a `/settings`.
4. Practica en `/learn` con el tutor IA (voz o texto).

> **Confirmación de email en local:** los correos no salen a internet; se capturan en Mailpit.

## Variables de entorno

Copia `.env.example` a `.env.local`:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor/seeds) |
| `NEXT_PUBLIC_APP_URL` | URL de la app (p.ej. `http://localhost:3000`) |
| `NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED` | `true` para mostrar botón Google |
| `NEXT_PUBLIC_OAUTH_GITHUB_ENABLED` | `true` para mostrar botón GitHub |
| `OPENAI_API_KEY` | Embeddings para RAG, asistente de chat y fallback de voz OpenAI |
| `ELEVENLABS_API_KEY` | API key ElevenLabs (opcional) |
| `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` | ID del agente de conversación |
| `OPENAI_REALTIME_MODEL` | Modelo de voz fallback; por defecto `gpt-realtime-2.1-mini` |
| `OPENAI_REALTIME_VOICE` | Voz de OpenAI Realtime; por defecto `marin` |

En local, genera `.env.local` con:

```bash
pnpm db:env
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo Next.js |
| `pnpm build` | Build de producción |
| `pnpm start` | Servidor de producción |
| `pnpm lint` | ESLint |
| `pnpm architecture:check` | Verifica APIs públicas y límites de features |
| `pnpm activities:validate` | Valida schemas y referencias de las actividades del currículo |
| `pnpm db:env` | Genera `.env.local` desde el stack Supabase local |
| `pnpm db:start` | Levanta stack Supabase local (Docker) |
| `pnpm db:stop` | Detiene stack Supabase local |
| `pnpm db:status` | Muestra URLs y claves del stack local |
| `pnpm db:reset` | Borra datos y reaplica migraciones |
| `pnpm db:seed` | Documentos legales |
| `pnpm kb:embed` | Embeddings RAG desde `knowledge/` |
| `pnpm db:types` | Regenera tipos TypeScript desde el esquema local |

## Supabase Cloud (alternativa)

Si prefieres un proyecto en la nube en lugar de local:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. Copia las claves del dashboard a `.env.local`.
3. Aplica el esquema:
   - Desde el SQL Editor: pega `supabase/migrations/20250607000000_initial_schema.sql`, o
   - Con CLI: `supabase link` y `supabase db push`.
4. Ejecuta `pnpm db:seed`.

## Docker (solo app Next.js)

`docker compose up --build` levanta **únicamente** el contenedor de Next.js en modo standalone (puerto 3000). **No incluye Supabase.**

Para usar la app en Docker con Supabase local en el host:

1. Arranca Supabase antes: `pnpm db:start`
2. En `.env.local`, usa `NEXT_PUBLIC_SUPABASE_URL=http://host.docker.internal:54321` (Windows/macOS)
3. Ejecuta `docker compose up --build`

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `supabase start` falla | Verifica que Docker Desktop está en ejecución (`docker info`) |
| Puerto ocupado | `pnpm db:stop` o cambia puertos en `supabase/config.toml` |
| `pnpm db:seed` falla | Comprueba que `SUPABASE_SERVICE_ROLE_KEY` está en `.env.local` |
| No puedo iniciar sesión tras registrarme | Confirma el email en [Mailpit](http://127.0.0.1:54324) |
| Storage unhealthy en Windows | Reintenta con `supabase start --ignore-health-check` |
| Puerto 54322 ocupado | `pnpm db:stop` u otro proyecto Supabase local en ejecución |
| `pnpm db:seed` falla por esbuild | Ejecuta `pnpm install` (el `postinstall` reinstala el binario) o `node node_modules/esbuild/install.js` |
| Resetear todo desde cero | `pnpm db:reset && pnpm db:seed` |

## Estructura del proyecto

```
app/
├── (public)/        # Landing, FAQ, how-it-works
├── (learn)/         # Tutor IA y panel de actividades
├── (auth)/          # Login, registro, recuperación
├── (account)/       # Settings
├── (legal)/         # Términos, privacidad, cookies
├── api/tutor/       # Contexto RAG, actividades, sesión
└── auth/            # Callbacks OAuth

knowledge/           # Base de conocimiento (markdown + JSON)
features/            # APIs públicas y ownership de cada feature
components/learn/    # ActivityRenderer, DynamicContentPanel
components/games/    # Componentes interactivos de práctica
lib/knowledge/       # Carga y chunking del currículo
```

## Autenticación

- Email y contraseña vía Supabase Auth
- OAuth dinámico (Google, GitHub)
- `/settings` requiere sesión; `/learn` es público
