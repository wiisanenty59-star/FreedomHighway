# HiddenFreeways

## Overview

An invite-only urban exploration community website. Users must register and be approved by an admin before accessing the site. Features an interactive map, location database, and retro-style forum.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/urbex)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Cookie-session (bcryptjs for password hashing)
- **Map**: react-leaflet + Leaflet.js (OpenStreetMap + ESRI satellite)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Admin Credentials

- Username: `T-Why`
- Password: `Qzz908kasr15`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

- **Invite-only registration**: Users register and wait for admin approval
- **Admin panel**: Approve/ban users, manage locations (admin: T-Why)
- **Interactive Map**: Full US/Canada map with OpenStreetMap + satellite toggle. Click to add pins, filter by category
- **Location Database**: Abandoned buildings, graffiti, caves, tunnels, rooftops, industrial sites, military sites, bridges
- **Forum**: phpBB/Lemmy-style retro forum with categories, threads, post counts, user info panels
- **Dark theme**: Charcoal/black backgrounds, amber (#f59e0b) accents

## DB Schema

- `users` — user accounts with roles (admin/member) and status (pending/approved/banned)
- `categories` — location categories (abandoned buildings, graffiti, etc.)
- `locations` — map pins with coordinates, risk level, status
- `forum_categories` — forum boards
- `threads` — forum threads
- `posts` — forum replies

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
