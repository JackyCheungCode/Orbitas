# Orbitas

B2B prospect intelligence and sales collaboration workspace.

## Current foundation

- React + TypeScript + Vite
- IBM Carbon Design System (`@carbon/react`)
- Responsive console shell and primary navigation
- Prospect intelligence dashboard with illustrative sample data
- Companies, Contacts, Activities, Data Sources, and Settings route scaffolds
- Searchable prospect table and responsive layout styles

## Requirements

- Node.js 20 or later
- npm

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run typecheck
npm run build
```

## Architecture direction

The UI is prepared for a later integration with Supabase (PostgreSQL, Auth, and row-level security) and Cloudflare Pages/Workers. No credentials or live data connections are configured yet.

## Important

Dashboard records are illustrative mock data. Buttons that are not yet connected display a placeholder message; they do not create or update records.