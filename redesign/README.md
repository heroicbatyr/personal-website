# Batyrbek.com Astro site

This is the production Astro implementation of Batyrbek.com: semantic `.astro`
pages, custom CSS, and small browser scripts for theme preference and the
contact form. It does not use React, Tailwind, a CMS, or copied template
components.

## Run locally

Requires Node.js 20.3+ (Node 22 recommended).

```bash
cd ~/VSCode/GitHub/personal-website/personal-website
npm --prefix redesign install
npm --prefix redesign run dev
```

Open `http://localhost:4321`.

## Content to replace

- `src/data/projects.ts` — all project copy, project status, and later metrics.
- `public/images/home-bg.jpg` — current hero portrait (copied from the old site).
- `src/pages/index.astro` — homepage biography and contact copy.

## Deployment

GitHub `main` deploys this project to Vercel and the self-hosted Docker backup.
Vercel builds `redesign/dist`; Docker builds the same output before serving it
with the root Express API. See `HANDOFF.md` for current decisions and next
steps.
