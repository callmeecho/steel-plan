# Steel Plan

Steel Plan is a portfolio-grade web app for steel order management, built with `Next.js 16`, `TypeScript`, `Supabase`, and `PostgreSQL`.

The project focuses on the kind of full-stack delivery highlighted in React / Next.js / Postgres / Supabase roles:

- authentication with Supabase Auth
- role-based access control with RLS
- order query and filtering workflows
- dictionary management with soft delete
- dashboard reporting with server-rendered data

## Features

- Login, signup, logout
- Order list with keyword search, status filter, steel grade filter, and range filters
- Cross-page order selection persisted in the database
- Steel grade management for `admin` users
- Soft archive and restore flow for steel grades
- Dashboard with KPI cards, status distribution, grade ranking, and delivery trend

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth / Postgres / RLS
- Recharts

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`.

3. Start the development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Environment Variables

The app currently requires:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Build

```bash
npm run build
npm run start
```

## Demo Notes

- Protected pages redirect unauthenticated users to `/login`
- `viewer` users can read data
- `admin` users can maintain steel grades

## Project Status

Current implemented modules:

- Auth
- Orders
- Steel grades
- Dashboard

Planned next modules:

- Avatar upload with Supabase Storage
- Order updates with Supabase Realtime
- Deployment and delivery documents
