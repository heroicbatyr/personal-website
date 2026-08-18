# Batyrbek.com redesign — handoff

Last updated: 2026-08-19

## What this is

`redesign/` is a new, isolated Astro implementation of Batyrbek.com. It is **not yet the deployed site** and must not overwrite the existing root site until it has been reviewed and deliberately migrated.

The existing site has pre-existing staged edits in:

- `public/index.html`
- `public/css/style.css`
- `public/js/main.js`

Those edits were intentionally left untouched.

## Product direction agreed so far

- Recruiter-first, but human and personal: roughly **80% professional / 20% personal**.
- Visual tone: warm cream and charcoal with muted ochre—never shiny gold.
- Vanilla Astro: semantic Astro pages, custom CSS, and minimal browser JavaScript. No React, Tailwind, CMS, copied template components, or site-builder feeling.
- Light/dark mode. English/German architecture remains future work; UI currently displays an EN/DE placeholder control only.
- Desktop: top navigation. Mobile: fixed bottom navigation.
- Header should remain visible during scrolling (implemented).
- Hero uses the existing `home-bg.jpg`: copy on the left and portrait on the right, preserving the photo composition.
- Hero statement: “Ambition without execution is just imagination.”
- Status: Working Student @ UniCredit, Payments & Cash Management; open to opportunities from 01.04.2027.
- Main title: Business Informatics Student.

## Implemented routes

- `/` — homepage with hero, expanded About, selected projects, experience, skills, writing preview, and contact form layout.
- `/projects` — project index.
- `/projects/[slug]` — four case-study pages.
- `/writing` — writing index.
- `/writing/[slug]` — three placeholder article pages.

## Homepage review changes — 2026-08-19

- Replaced the full-name hero heading with “Hey, I’m Batyrbek.”
- Removed the “I take the work seriously…” About heading.
- Reduced the visual weight of the ambition quote and rebalanced the availability block.
- Replaced “Projects with a point of view” with the more neutral “A selection of projects.”
- Removed project numbering from the homepage and project index.
- Added clearer hover and keyboard-focus feedback to project and writing links.
- Increased the Experience & Education / Tools & Interests labels and changed the tools list to compact tags.
- Removed the footer build-technology sentence.
- Restored the existing smiling-B logo at a restrained header size. A possible logo redesign remains a separate design decision.

The requested professional About photo has not been added because the suitable image does not exist in the project yet. Do not substitute the older casual portrait.

Second review pass:

- Downloaded the smiling-B logo files from the GitHub repository and use the black asset in light mode / white asset in dark mode.
- Reduced the oversized hero, section, project, writing, and page-intro titles.
- Removed split italic/accent styling from display headings.
- Increased the uppercase section labels, including About, Selected Work, Writing, Contact, Experience & Education, and Tools & Interests.
- Removed the divider and “Availability” label; the row now only says when Batyrbek is open to opportunities.
- Increased the ambition quote slightly.

Follow-up adjustments:

- Quote is now “Vision without execution is hallucination” with no ending period and regular weight.
- Opportunity availability aligns with the Working Student line and has no trailing period.

## Current project content

Defined in `src/data/projects.ts`:

1. Signature Proof Automation Support — UniCredit internal/confidential
2. Task Manager & KPI Statistics — UniCredit internal/confidential
3. Market Atlas — stock-analysis project, in progress
4. Batyr AI — coming soon

Confidential UniCredit case studies intentionally use only non-sensitive high-level descriptions. Do not add internal screenshots, source code, customer data, or details until Batyrbek decides what is safe to publish.

## Contact form status

- New UI form posts to `/api/submit-contact`, matching the existing root Vercel API endpoint.
- The current Astro redesign is a static project in a subfolder, so its preview cannot serve that root API.
- The UI shows a safe fallback message in local preview.
- Cloudflare Turnstile is **not implemented yet**. The current UI is a labelled placeholder only. Before deployment, add the real Turnstile widget and server-side token verification; do not treat the placeholder as protection.
- Public contact email: `mail@batyrbek.com`.
- LinkedIn, GitHub, and Instagram are visual placeholders for now; do not make them misleading outbound links.

## Key files

- `src/pages/index.astro` — homepage structure/copy/contact layout.
- `src/styles/global.css` — all custom styling and responsive work.
- `src/components/Header.astro` — top/mobile navigation.
- `src/layouts/BaseLayout.astro` — theme toggle and form submit behaviour.
- `src/data/projects.ts` / `src/data/writing.ts` — content.
- `public/images/home-bg.jpg` — hero portrait, copied from legacy site.

## Build and preview

```bash
cd ~/VSCode/GitHub/personal-website/personal-website/redesign
npm run dev
```

Open `http://localhost:4321`.

Build has passed on 2026-08-13 with `npm run build`: 0 errors, 0 warnings.

## Good next steps

1. Review the 2026-08-19 homepage changes in the local preview.
2. Add the professional About photo once Batyrbek provides or selects the final image.
3. Decide whether to refine or redesign the existing smiling-B logo.
4. Replace placeholder project/writing copy with approved content and add project-specific images/diagrams.
5. Implement actual multilingual content and browser-language selection. Prefer locale files with typed access and locale-aware routes over scattering copy through components; decide the final URL strategy before migrating the text.
6. Obtain the actual social URLs and real CV PDF.
7. Wire Cloudflare Turnstile securely while merging the Astro site into the actual deployment setup.
8. Decide the migration plan for retaining old content in an unlinked legacy folder.
