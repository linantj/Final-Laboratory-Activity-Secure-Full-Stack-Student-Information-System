# Secure Student Information System

This workspace contains a Next.js frontend in `frontend` and a Laravel REST API in `backend`. The API uses Laravel Sanctum bearer tokens; the Next.js server keeps each token in an HttpOnly cookie and forwards only the fixed, supported API routes. The token is not returned to browser JavaScript or stored in local storage.

## Local setup

1. Install PHP 8.2+, Composer, Node.js, and the PHP PDO PostgreSQL/MySQL drivers you plan to use.
2. In `backend`, install dependencies with `composer install`. Copy `.env.example` to `.env` only if `.env` does not already exist, then generate an application key with `php artisan key:generate`.
3. Configure the Supabase PostgreSQL values and `DB_SSLMODE=require` in the local, untracked backend `.env`. The Supabase project must be reachable from this machine. Do not commit `.env`.
4. After verifying the connection and target database, apply the additive Laravel migrations with `php artisan migrate`.
5. In `frontend`, install dependencies with `npm ci` and copy `.env.example` to `.env.local`. Set `LARAVEL_API_URL` to the Laravel origin without a trailing slash or `/api` suffix.
6. Start the API in `backend` with `php artisan serve`; start the frontend in `frontend` with `npm run dev`.

The API defaults to PostgreSQL in `config/database.php`. An existing local `.env` may explicitly override that setting, so check `DB_CONNECTION` before migrating. Never run migrations against a database until its host and database name have been verified. Use the exact endpoint and credentials from the Supabase dashboard. Prefer its direct database endpoint when the runtime supports its network; otherwise use the dashboard-provided session pooler settings. Do not guess hostnames or alter pooler credentials.

## API

- `POST /api/auth/register` — validates the name, unique email, password, and confirmation; returns a user and one-time token.
- `POST /api/auth/login` — checks credentials and is limited to five attempts per minute.
- `GET /api/auth/user` and `POST /api/auth/logout` — require a Sanctum bearer token.
- `GET /api/students?source=cloud|physical` — requires a Sanctum token. `cloud` is bound to PostgreSQL; `physical` is bound to `local_mysql`. Other source values are rejected.

The table name is configured server-side with `STUDENTS_TABLE` (default `students`). The lab handout's student schema was not present in this workspace, so no student table migration or column assumptions are included. Create/verify that table in each database according to the handout before using the records endpoint. The endpoint returns the selected table's rows and count; keep sensitive columns out of that table or narrow the selected columns before exposing real student data.

The current local backend environment uses SQLite and does not include Supabase connection settings. The installed XAMPP PHP CLI has `pdo_mysql` but not `pdo_pgsql`; enable/install the PostgreSQL PDO driver for the PHP CLI before testing a Supabase connection. For the physical lab connection, configure `LOCAL_MYSQL_HOST`, `LOCAL_MYSQL_PORT`, `LOCAL_MYSQL_DATABASE`, `LOCAL_MYSQL_USERNAME`, and `LOCAL_MYSQL_PASSWORD` locally. Do not expose port 3306 publicly. A Render-hosted service cannot reach a private Windows LAN address without an explicitly secured private network or VPN; use Supabase for public deployment.

## Verification

Backend feature tests use isolated in-memory SQLite and do not require or modify Supabase/MySQL. Run `php artisan test` from `backend`. Frontend checks are `npm run lint`, `npx tsc --noEmit`, and `npm run build` from `frontend`.

## Deployment

### Vercel

Create a Vercel project for this repository and set **Root Directory** to `frontend`. Set the server-only environment variable `LARAVEL_API_URL` to the deployed Laravel origin (no `/api` suffix). Do not use a `NEXT_PUBLIC_` prefix for the API origin or credentials. Set the backend's `FRONTEND_URL` to the exact Vercel origin.

### Render

`backend/render.yaml` and `backend/Dockerfile` describe the Apache/PHP API service. Configure the blueprint's secret values (`APP_KEY`, `APP_URL`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, and `FRONTEND_URL`) in Render before deploying. Use the Supabase connection host and credentials assigned to your project; keep TLS required. `APP_DEBUG` is disabled in the production blueprint. Confirm the Supabase database and migration status, then run `php artisan migrate --force` in the Render service shell only after verifying the target. The physical MySQL settings should not be configured on Render for a private LAN-only database.

## Source control

The backend and frontend ignore local environment files. This workspace currently has no Git repository metadata; initialize Git from the workspace root and create a GitHub repository only after reviewing the files and confirming no secrets or local data are staged.
# Final-Laboratory-Activity-Secure-Full-Stack-Student-Information-System
