# HiddenFreeways

## Overview

An invite-only urban exploration community website. Users must register (with full application questions) and be approved by an admin before accessing the site. Features an interactive map, location database, retro-style forum, and earned invite system.

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

### Access Control
- **Invite-only registration** with full application questionnaire (purpose, reason to join, why accept, exploration experience)
- **Invite codes**: Members with 10+ posts and 2+ locations earn the ability to generate invite codes (14-day expiry, max 3 active)
- **Auto-approval**: Users with valid invite codes are instantly approved on registration
- **Admin panel**: Approve/ban users (with expandable application answers), manage locations, manage forum boards, manage location categories

### Forum
- phpBB/Lemmy-style retro forum with categories, threads, posts
- **Rules & Guidelines** board pinned at top with comprehensive community rules
- Forum sidebar: network stats, admin team list, quick links
- Admin can create/edit/delete forum boards in-panel

### Map & Locations
- Interactive US/Canada map (OpenStreetMap + ESRI satellite toggle)
- Color-coded pins by category: Abandoned Buildings, Graffiti Art, Caves, Tunnels, Rooftops, Industrial Sites, Military Sites, Bridges
- Admin can create/edit/delete location categories in-panel

### Theme
- Dark theme: charcoal/black backgrounds, amber (#f59e0b) accents, Space Mono font
- OPSEC-focused UX copy throughout

## DB Schema

- `users` — accounts with roles (admin/member), status (pending/approved/banned), registration answers, invite tracking
- `categories` — location categories with icon/color
- `locations` — map pins with coordinates, risk level, status
- `forum_categories` — forum boards with sortOrder
- `threads` — forum threads (support pinned + locked)
- `posts` — forum replies
- `invites` — invite codes (created_by, used_by, expires_at)

## Invite System Rules (hardcoded in auth.ts / invites.ts)

- POSTS_REQUIRED = 10
- LOCATIONS_REQUIRED = 2
- INVITE_EXPIRY_DAYS = 14
- MAX_ACTIVE_INVITES = 3

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
