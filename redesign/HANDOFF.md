# Batyrbek.com — handoff

Last updated: 2026-08-19

## Current state

The Astro portfolio is live on both production targets:

- `https://www.batyrbek.com` — Vercel primary site
- `https://server.batyrbek.com` — Docker/Cloudflare Tunnel fallback

Both are deployed from GitHub `main`. Vercel builds `redesign/` to
`redesign/dist`; the Docker image builds the same Astro output and serves it
through Express. Do not edit either running deployment directly.

## Product direction

- Recruiter-first but human: roughly 80% professional / 20% personal.
- Warm cream, charcoal, and muted ochre. Avoid shiny gold.
- Vanilla Astro, semantic pages, custom CSS, and minimal JavaScript. No React,
  Tailwind, CMS, or template-builder look.
- Light/dark mode is implemented. The EN/DE control is still a non-functional
  placeholder; multilingual content is future work.
- Desktop has top navigation; mobile has fixed bottom navigation.
- The interface uses CSS-drawn arrows for click cues, never emoji or Unicode
  text-arrow glyphs. Keep future buttons, links, and cards consistent with it.

## Homepage decisions already made

- Hero: “Hey, I’m Batyrbek.”
- Quote: “Vision without execution is hallucination” (regular weight, no
  closing period).
- Current status: Working Student @ UniCredit, Payments & Cash Management.
- Availability: Open to opportunities from 01.04.2027.
- Project heading: “A selection of projects.”
- Project numbering is removed.
- The smiling-B uses the black GitHub logo asset in light mode and the white
  one in dark mode.
- The old “Built quietly with…” footer text is removed.

## Routes and content

- `/` — home, About, selected projects, experience, tools, writing preview,
  and contact form.
- `/projects` and `/projects/[slug]` — four project/case-study pages.
- `/writing` and `/writing/[slug]` — three placeholder articles.
- `src/data/projects.ts` and `src/data/writing.ts` hold current project and
  writing content.

UniCredit case studies are confidential. Do not publish internal screenshots,
source code, customer data, or implementation detail without explicit review.

## Contact form

- The Astro form posts to `/api/submit-contact`.
- Cloudflare Turnstile is live. Its public widget is in
  `src/pages/index.astro`; validation remains server-side in
  `api/submit-contact.js`.
- The API stores submissions in MongoDB and attempts an email notification.
- The public email is `mail@batyrbek.com`.

## Local development

```bash
cd ~/VSCode/GitHub/personal-website/personal-website
npm --prefix redesign install
npm --prefix redesign run dev
```

Open `http://localhost:4321`. The local Astro server cannot serve the root API,
so successful form delivery must be tested on a deployed preview or production.

## Next session

1. Add a professional About photo once Batyrbek selects it.
2. Decide whether to refine or redesign the smiling-B logo.
3. Replace placeholder project and writing content with approved copy and
   images/diagrams.
4. Design the EN/DE implementation with typed locale files and locale-aware
   routes before translating content.
5. Add real social URLs and the final CV file.
