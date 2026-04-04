# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This is the **Odyssey** project — an AI-powered behavioral learning platform for children (Expo mobile app + Express API).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo (React Native) with expo-router
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)

## Artifacts

- **odyssey** (`artifacts/odyssey/`) — Expo mobile app, serves at `/`
- **api-server** (`artifacts/api-server/`) — Express API, serves at `/api`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Odyssey Features

- **Learner Profile**: Multi-step creation form (name, birthday, diagnosis, therapies, interests, capabilities, goals)
- **Adventures**: Create AI-generated or manual step-by-step learning activities
- **Child Mode**: Fullscreen step-by-step execution with coin earning
- **AI Co-pilot**: Real-time tips when a child struggles with a step
- **Wallet**: Coin tracking with transaction history
- **Rewards**: AI-suggested personalized rewards, progress tracking, redeeming
- **Adaptive Learning**: Performance tracking after each adventure

## Database Tables

- `learners` — learner profiles
- `adventures` — learning adventures
- `steps` — steps within adventures
- `wallets` — coin balances
- `rewards` — available rewards
- `transactions` — earn/redeem history
- `performance_tracking` — step completion data for AI adaptation

## API Routes

- `GET/POST /api/learners` — manage learner profiles
- `GET/POST/PUT/DELETE /api/adventures` — manage adventures with steps
- `GET /api/wallet/learner/:id` — get wallet balance
- `POST /api/wallet/learner/:id/earn` — earn coins
- `POST /api/wallet/learner/:id/redeem` — redeem coins
- `GET/POST /api/rewards` — manage rewards
- `POST /api/ai/generate-adventure` — AI-generate a personalized adventure
- `POST /api/ai/suggest-rewards` — AI-suggest personalized rewards
- `POST /api/ai/copilot-tip` — real-time support tip during child mode
- `POST /api/ai/adaptive-suggestions` — post-adventure improvement suggestions
- `POST /api/ai/performance` — track step performance data

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
