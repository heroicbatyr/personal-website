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

## Development direction

The Astro portfolio already has reusable layouts, project case studies, and
writing routes. Future work is content refinement, a professional About photo,
the final logo direction, and planned EN/DE support. See
[AGENTS.md](AGENTS.md) and [redesign/HANDOFF.md](redesign/HANDOFF.md) before
making a change.
