# Policy Pulse UI

Frontend for **Policy Pulse** — a full-stack insurance policy management app.  
Built with **React + TypeScript + Vite** and designed to integrate with a Spring Boot API.

> Backend repo (Policy Pulse API):
> https://github.com/siva-sai-udaygiri/policy-pulse-api

---

## Features (current)
- API connectivity demo (`/api-demo`)
- Calls backend health endpoint and renders JSON response
- Typed HTTP client approach + UI-friendly error handling (in progress)

## Planned (roadmap)
- Policies list with search/filter + pagination
- Create/Edit policy forms with validation
- Auth flow (JWT) + role-based screens
- E2E smoke tests + CI build pipeline

---

## Tech Stack
- React, TypeScript
- Vite
- ESLint
- (Planned) Component tests: Vitest + React Testing Library
- (Planned) E2E: Playwright

---

## Prerequisites
- Node.js 18+ (recommended)
- npm 9+

---

## Run locally

### 1) Start the backend API first
The UI expects the API running locally.

```bash
# in policy-pulse-api
mvnw spring-boot:run

API health:http://localhost:8080/api/health

# in policy-pulse-ui
npm install
npm run dev

UI:http://localhost:5173

API Integration Notes

If the UI uses relative calls like /api/..., ensure the Vite dev server proxies to the API.

Check vite.config.ts for a proxy similar to:

/api -> http://localhost:8080

In production, prefer one of these:

Reverse proxy (Nginx) serving UI and forwarding /api/* to backend

Or configure a base URL env var and call the API directly

Scripts:
npm run dev      # start dev server
npm run build    # production build
npm run preview  # preview production build
npm run lint     # lint

