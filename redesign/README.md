# Batyrbek.com redesign

The new site is an intentionally small Astro implementation: semantic `.astro` pages, a custom CSS file, and one small browser script for theme preference. It does not use React, Tailwind, a CMS, or copied template components.

## Run locally

Requires Node.js 20.3+ (Node 22 recommended).

```bash
npm install
npm run dev
```

Open `http://localhost:4321`.

## Content to replace

- `src/data/projects.ts` — all project copy, project status, and later metrics.
- `public/images/home-bg.jpg` — current hero portrait (copied from the old site).
- `src/pages/index.astro` — homepage biography and contact copy.

The existing root site has not been touched. It remains separate while this redesign is reviewed.
