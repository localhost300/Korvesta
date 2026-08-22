# Korvesta

Korvesta is a responsive financial-markets experience built with Next.js 16, React 19, TypeScript and Tailwind CSS 4. It includes market dashboards, insight and learning pages, company and support experiences, and a complete account onboarding journey.

## Included routes

- `/` — market landing page
- `/markets` — live market overview and filtering
- `/insights` — market intelligence and analyst commentary
- `/learn` — guides, lessons, webinars and knowledge checks
- `/company` — mission, ecosystem, leadership and trust
- `/support` — help centre, FAQs and contact form
- `/sign-in`, `/register`, `/verify`, `/success` — account journey

## Run locally

```bash
npm install
npm run dev
```

Open the local address printed by Next.js.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

The project uses reusable components under `components/`, shared market data under `lib/`, App Router routes under `app/`, local visual assets under `public/images/`, and a deterministic preview-compatible development wrapper under `scripts/`.
