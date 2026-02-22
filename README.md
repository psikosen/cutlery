# Shadow System

A Solo Leveling-inspired life RPG where every real-world task feeds your shadow creature a new gene mutation.

## Tech Stack

- React 18 + TypeScript
- Vite (build tooling)
- HTML Canvas 2D (procedural creature rendering)
- IndexedDB (local persistence)
- OTP + MFA authentication

## Getting Started

```bash
npm install
npm run dev
```

## Architecture

- `src/types/` — Core type definitions and constants
- `src/data/` — Default tasks, traits, achievements
- `src/services/` — Game engine, persistence, auth
- `src/renderer/` — Procedural creature Canvas rendering
- `src/hooks/` — React state management (game + auth)
- `src/screens/` — Main app screens
- `src/components/` — Reusable UI components
