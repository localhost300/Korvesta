# Korvesta Dashboard Upgrade

This project already contains the public website and the authenticated dashboard. Do not create a second Next.js project.

## Install and run

```bash
npm install
npm run dev
```

No new package is required for this upgrade. The interactive charts use React and SVG, and the existing project dependencies already cover every imported component.

## Files to add

Copy these complete files into the same locations in your current Korvesta project:

1. `components/dashboard/InteractiveChart.tsx`
2. `components/dashboard/EnhancedFinancePages.tsx`

## Files to replace

Replace the complete contents of these existing files:

1. `components/dashboard/DashboardApp.tsx`
2. `components/dashboard/DashboardShell.tsx`
3. `app/globals.css`

## Routes upgraded

- `/dashboard/portfolio` — investment plans, invest modal, active investment tracker, and CSV report.
- `/dashboard/trade` — multi-pair spot trading workspace.
- `/dashboard/trade/futures` — multi-pair futures workspace with leverage selection.
- `/dashboard/trade/demo` — multi-pair demo trading with virtual balance and reset flow.
- `/dashboard/earn` — stake flow, active positions, unstaking, history, and rewards report.

## Theme

The dashboard theme button now toggles a `dash-light` class on the dashboard shell and stores the selection in `localStorage` under `korvesta-theme:v1`.

## Validation commands

```bash
npm run typecheck
npm run lint
npm run build
```

The data and trade execution in this build are realistic local mock flows. Connect the page state to your API, database, market-data provider, custody provider, and order-execution backend before using it for real funds.
