# Batyrbek's personal website

The source for [batyrbek.com](https://batyrbek.com).  It is deployed from one
GitHub repository to two independent places:

| Address | Host | Purpose |
| --- | --- | --- |
| `batyrbek.com` / `www.batyrbek.com` | Vercel | Primary public website |
| `server.batyrbek.com` | Ubuntu Docker server via Cloudflare Tunnel | Independent live deployment and fallback |

## Frontend architecture

The public portfolio is the Astro app in `redesign/`. Its source pages,
components, styles, and content data live there. Vercel builds it to
`redesign/dist`; the Docker image builds the same output and serves it from
Express alongside the root API functions.

The former files in root `public/` are legacy source material, not the
production portfolio output. See `redesign/HANDOFF.md` for the current visual
and content decisions.

## How publishing works

Push a commit to `main`.

1. Vercel detects the GitHub commit and deploys the primary site.
2. GitHub Actions sends the same commit to a self-hosted runner on the Ubuntu
   server.
3. The runner fast-forwards `/home/batyr/personal-website`, rebuilds Docker,
   and verifies the `personal-site` health endpoint.

Typical server deployment time is 1–4 minutes; an initial build or dependency
change can take closer to 5–10 minutes.  Check the **Actions** tab in GitHub
for the authoritative job status.

For meaningful redesigns, make a feature branch first and use Vercel's Preview
deployment.  Once it looks right on desktop and mobile, merge to `main`; both
live deployments follow automatically.

## Server deployment

The server uses Docker Compose:

```bash
docker compose -f compose.server.yml up -d --build
docker compose -f compose.server.yml ps
```

`personal-site` serves the application internally on port 3000.
`batyrbek-tunnel` is Cloudflare's outbound tunnel client and publishes it at
`server.batyrbek.com`.  There is intentionally no public Docker port mapping.

The health endpoint is:

```text
https://server.batyrbek.com/healthz
```

## Contact form and email

The contact endpoint saves each successful submission to MongoDB Atlas
(`test.contact`) and then attempts to notify `admin@batyrbek.com` through
Resend, from `db@batyrbek.com`.  The database write comes first so a temporary
mail provider issue does not lose a message.

On the server, secrets live only in ignored files:

- `.env.server` — MongoDB and Resend variables
- `.env.cloudflared` — Cloudflare tunnel token

The contact form is protected by Cloudflare Turnstile. The public widget uses
the configured site key, and `/api/submit-contact` verifies its one-time token
with Cloudflare before any submission is stored or emailed. A missing, expired,
reused, or invalid token returns `403` and is not saved.

Turnstile is configured for `batyrbek.com`, `www.batyrbek.com`, and
`server.batyrbek.com`. `TURNSTILE_SECRET_KEY` is configured in Vercel's
Production environment and in the self-hosted server's `.env.server`. The
public site key is embedded in the form; never commit or share the secret key.

After changing Turnstile code, commit and push to `main`; Vercel and the
self-hosted deployment both update from that commit. Changing only the server
secret requires restarting/redeploying the `personal-site` container so it
loads the updated `.env.server` value.

Do not put their values in GitHub, issues, screenshots, logs, or this README.
Vercel's production environment needs the matching form-related variables.

## Stock Research Dashboard

`/finance` is a lightweight Astro and vanilla TypeScript interface backed by
the Java 21 service in `finance-service/`. The public request path is:

```text
batyrbek.com/finance
  -> https://server.batyrbek.com/api/stocks/...
  -> Express path gateway
  -> finance-service:8080
  -> Alpha Vantage
```

The provider key exists only in the Spring container. Alpha Vantage was chosen
because its documented company overview, global quote, daily, and weekly
time-series endpoints cover the dashboard. Its free daily endpoint returns the
latest 100 trading days; full daily history requires premium access. The API
therefore combines recent daily closes with older weekly closes for a useful
five-year series, and labels weekly-only fallback data accurately. Finnhub's
stock candle endpoint currently requires premium access. The `StockDataProvider`
interface keeps provider-specific JSON out of the controller, service, cache,
and frontend layers.

### Required finance environment

Create the ignored runtime file from the committed placeholder template:

```bash
cp .env.finance.example .env.finance
```

Set `STOCK_API_KEY` to one Alpha Vantage API key, or add `STOCK_API_KEYS` as a
comma-separated pool of keys you are authorized to use. Both variables are merged and
deduplicated. The provider starts requests across the pool and tries the next key only when Alpha Vantage explicitly reports a
rate limit. Do not commit `.env.finance`. `FINANCE_ALLOWED_ORIGINS` defaults to the two production website origins and
Astro's usual localhost origins; keep this list narrow.

The optional Astro build variable below changes the browser-visible API host.
Production defaults to `https://server.batyrbek.com`:

```text
PUBLIC_FINANCE_API_BASE_URL=http://localhost:18080
```

### Local development

Run the backend in Docker, where Maven compiles and tests it with Java 21:

```bash
docker compose -f compose.server.yml up -d --build finance-service
curl http://127.0.0.1:18080/actuator/health
curl http://127.0.0.1:18080/api/stocks/NVDA
curl 'http://127.0.0.1:18080/api/stocks/NVDA/history?range=5y'
```

Run the frontend against that local service:

```bash
PUBLIC_FINANCE_API_BASE_URL=http://localhost:18080 npm --prefix redesign run dev
```

For host-based Java development, use JDK 21 and Maven 3.9+:

```bash
STOCK_API_KEY=your-key mvn -f finance-service/pom.xml spring-boot:run
mvn -f finance-service/pom.xml verify
```

The REST contract is deliberately frontend-friendly:

- `GET /api/stocks/{ticker}` — quote and normalized company metrics, including
  a `stale` indicator;
- `GET /api/stocks/{ticker}/history?range=5y` — one cached five-year series with
  `resolution`, `updatedAt`, and `stale` metadata.

Quotes are fresh-cached for 15 minutes. Company fundamentals and normalized
five-year history are fresh-cached for 24 hours. Atomic Caffeine cache loads
coalesce concurrent requests for the same ticker. Successful provider responses are
also written atomically to `/app/data/cache` on the named Docker volume
`personal-website-finance-cache`, so rebuilding or restarting the container does not
empty the cache. Disk-backed quotes remain usable for two days; fundamentals and
history remain usable for 30 days during provider failures. Stale responses retain
their original `updatedAt` and return `stale: true`.

The browser downloads the five-year history once per ticker. Its `1W`, `1M`,
`6M`, `YTD`, `1Y`, and `5Y` buttons only filter that in-memory array and never
call the provider or backend again. Provider calls are serialized with a short
safety interval. Alpha Vantage documents a standard limit of 25 requests per day. The exact reset
time is not documented. Its support page also offers unlimited requests for verified
open-source or educational projects, which is preferable to creating duplicate
accounts. Range-button clicks never consume provider requests.

### Optional Vercel outage snapshots

The service can mirror its last successful normalized overview and history responses
to a private Vercel Blob store. The finance page reads these snapshots only when the
home-server API is unreachable, unavailable, or rate-limited. This is an outage
fallback, not the primary cache.

1. In the Vercel project, create and connect a **Private Blob** store.
2. Create a random shared secret, for example with `openssl rand -hex 32`.
3. Add `FINANCE_BACKUP_SECRET` to the Vercel Production environment.
4. Put the same secret in `.env.finance` on the home server and set:

```text
FINANCE_BACKUP_URL=https://www.batyrbek.com/api/finance-snapshot
FINANCE_BACKUP_SECRET=the-same-random-secret
```

Without these optional values, local disk persistence still works and snapshot
mirroring stays disabled. Never expose the shared secret or Blob credentials in the
browser.

### Finance deployment

Before the first production deployment, create `/home/batyr/personal-website/.env.finance`
on the server and set `STOCK_API_KEY` or `STOCK_API_KEYS`. Configure the optional
Vercel snapshot values above if desired. Then build all three services:

```bash
docker compose -f compose.server.yml up -d --build
docker compose -f compose.server.yml ps
curl https://server.batyrbek.com/api/stocks/NVDA
```

The Spring service is reachable from the host only on `127.0.0.1:18080` and
from the other containers on `website-internal`; Cloudflare remains pointed at
`personal-site`. GitHub Actions verifies both `personal-site` and
`stock-research-api` after a push to `main`.

## Development direction

The Astro portfolio already has reusable layouts, project case studies, and
writing routes. Future work is content refinement, a professional About photo,
the final logo direction, and planned EN/DE support. See
[AGENTS.md](AGENTS.md) and [redesign/HANDOFF.md](redesign/HANDOFF.md) before
making a change.
