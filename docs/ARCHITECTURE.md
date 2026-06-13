# Architecture

InnoOps AI is built on a modern, full-stack architecture leveraging the TanStack ecosystem and Supabase.

## Tech Stack
- **Framework:** TanStack Start (React 19, Vite)
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase (PostgreSQL)
- **AI Integration:** Microsoft Foundry (Azure OpenAI)

## Core Components
1. **Client Layer:** React components for employee and admin dashboards.
2. **Server Functions:** Secure API endpoints implemented using `createServerFn` from `@tanstack/react-start`.
3. **Security Middleware:** Rate limiting, IP blocking, and schema validation.
4. **Database Layer:** Supabase PostgreSQL with strict Row Level Security (RLS) policies.
