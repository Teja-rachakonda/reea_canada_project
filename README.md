# REAA Ultimate v4.0 — Pabba Realty

Real Estate Automation Agency platform. React 18 + Vite frontend, Node.js + Express backend, OpenAI `gpt-4o` for the REAAMusic module, optional Supabase for persistence.

## Structure

```
reaa-platform/
├── frontend/   React 18 + Vite 6 + Tailwind — the dashboard UI (17 modules)
└── backend/    Node.js + Express — OpenAI proxy + API routes
```

## Run locally

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env        # then paste your OpenAI key into .env
node index.js               # → http://localhost:3001

# 2. Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                 # → http://localhost:5173
```

Logins: `admin/admin` (17 modules), `swetha/swetha123` (9), `user/user123` (3).

## Environment variables

**backend/.env**

| Var | Required | Notes |
|-----|----------|-------|
| `OPENAI_API_KEY` | Yes (for REAAMusic) | Must start with `sk-`. Server-side only — never exposed to the browser. |
| `PORT` | No | Defaults to 3001. |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | No | Without them, songs save to the browser only. |

**frontend/.env**

| Var | Required | Notes |
|-----|----------|-------|
| `VITE_API_URL` | Yes | Backend base URL. Localhost in dev; your deployed backend URL in production. |

## Deploy

Frontend and backend deploy separately.

- **Frontend → Vercel:** root `frontend`, build `npm run build`, output `dist`. Set `VITE_API_URL` to the deployed backend URL.
- **Backend → Railway/Render:** root `backend`, start `node index.js`. Set `OPENAI_API_KEY` (and Supabase vars if used). Enable CORS for the frontend domain.

Full step-by-step instructions are in the deployment chat.

## Database

`backend/schema.sql` creates the 5 Supabase tables (`leads`, `listings`, `songs`, `content_calendar`, `broadcasts`) with Row Level Security enabled. Run it in the Supabase SQL editor.

## Status

Phase 1: App shell, auth, Admin Panel, Dashboard, and **REAAMusic (lyrics)** are live. The other 14 modules are Coming Soon placeholders. Audio (SUNO) and video (HeyGen) generation are Phase 2.
