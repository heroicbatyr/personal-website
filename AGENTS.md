# Working notes for future contributors and coding agents

## Product context

This is Batyrbek's personal website, published at `batyrbek.com` through
Vercel and independently deployed on his Ubuntu server at
`server.batyrbek.com` through a Cloudflare Tunnel.  The two deployments use
the same GitHub `main` branch, so a single reviewed push updates both.

The site is intended to grow into a long-lived portfolio rather than remain a
one-page template.  Near-term additions likely include:

- a Projects page with strong technical case studies and showcases;
- optional blog / writing pages;
- an inexpensive chatbot that has carefully curated public context about
  Batyrbek;
- additional pages and navigation without needing another template migration.

When proposing a redesign, prefer a maintainable component/page structure,
semantic accessible HTML, fast static delivery, and content that can be added
without duplicating the site shell.  Do not add a CMS, authentication, AI
service, or paid platform unless the owner has specifically chosen it.

## Architecture

- `redesign/` — production Astro source: routes, components, styles, content,
  and public assets.
- `public/` — legacy source material in Git; Docker replaces it with the Astro
  build output during image creation.
- `server.js` — Express server for the self-hosted deployment; it serves the
  public site and exposes the API endpoints.
- `api/` and `database/` — contact / form handling and MongoDB persistence.
- `services/contact-notification.js` — Resend email notification after a
  successful contact submission.
- `finance-service/` — Java 21 / Spring Boot stock research API. It owns
  provider integration, normalized DTOs, validation, and Caffeine caches.
  The provider key is never exposed to the Astro application.
- `/finance` — lightweight Astro/TypeScript stock dashboard. On the server,
  Express forwards only `/api/stocks/*` to `finance-service` over the private
  Docker network; Cloudflare remains pointed at `personal-site`.
- `vercel.json` — installs and builds the Astro application for Vercel while
  retaining the root API functions.
- `Dockerfile` + `compose.server.yml` — builds the Astro app, serves its output
  through self-hosted `personal-site`, and runs the `cloudflared` tunnel. The
  web container deliberately has no host port; Cloudflare Tunnel reaches it
  over the `website-internal` Docker network.
- `.github/workflows/deploy-server.yml` — GitHub Actions workflow executed by
  the server's self-hosted runner.  It pulls `main`, rebuilds the container,
  and waits for `/healthz` to be healthy.

## Deployment rules

1. Make website changes in Git, then commit and push them to `main` once they
   are ready.  Do not edit the running container or server checkout as the
   primary source of truth.
2. Vercel deploys `batyrbek.com` from GitHub.  GitHub Actions deploys the same
   commit to `server.batyrbek.com`.
3. For substantial template work, use a feature branch and Vercel Preview;
   merge only after checking responsive layout, links, the contact form, and
   performance.
4. Keep `server.batyrbek.com/healthz` working; the deploy workflow relies on
   it to know whether a deployment succeeded.

## Secrets and safety

Never commit or print credentials.  On the server they are kept in ignored,
permission-restricted files:

- `.env.server`: `MONGODB_URI`, `RESEND_API_KEY`, `NOTIFICATION_FROM`,
  `NOTIFICATION_TO`, `TURNSTILE_SECRET_KEY`
- `.env.cloudflared`: `TUNNEL_TOKEN`
- `.env.finance`: `STOCK_API_KEY`, optional `FINANCE_ALLOWED_ORIGINS`

Vercel needs matching production environment variables for any server-side
form functionality it hosts.  Verify variable names and presence only; do not
copy their values into documentation, commits, logs, or chat.

The contact form uses Cloudflare Turnstile. The public widget site key lives in
`redesign/src/pages/index.astro`; the private `TURNSTILE_SECRET_KEY` stays only in Vercel
Production settings and the self-hosted `.env.server`. `api/submit-contact.js`
must validate `cf-turnstile-response` with Cloudflare Siteverify before any
database write or notification. The configured widget hostnames are
`batyrbek.com`, `www.batyrbek.com`, and `server.batyrbek.com`.

Contact submissions are stored in MongoDB Atlas database `test`, collection
`contact`.  A failed notification email must not discard an otherwise valid
form submission.

## Interface conventions

- Do not use emojis or Unicode text-arrow glyphs in the Astro interface.
- Use the CSS-drawn arrow icon for click cues. Keep buttons, links, and cards
  clear through typography, borders, and hover or focus states as well.

## Before handing work off

- Run the appropriate checks (at minimum syntax / local smoke checks for
  changed server code).
- Keep `git status` clean except for intentional changes.
- State whether the change needs a push and whether Vercel / the self-hosted
  runner has been verified.
