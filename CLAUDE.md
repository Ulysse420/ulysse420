# CLAUDE.md — Haven

## Project overview

Haven is a privacy-first social media platform. No ads, no tracking, no data extraction. Users own their data — everything is stored locally in SQLite on the server operator's machine.

**License:** AGPL-3.0

## Architecture

Full-stack JavaScript monorepo with two workspaces:

```
client/          React 18 + Vite frontend (JSX, ES modules)
server/          Express + SQLite backend (CommonJS)
```

The client and server are separate npm packages with their own `package.json`. The root `package.json` provides convenience scripts to run both together.

### Backend (server/)

- **Runtime:** Node.js with Express 4
- **Database:** SQLite via `better-sqlite3` (synchronous API, WAL mode, foreign keys ON)
- **Auth:** bcrypt (cost 12) for passwords, JWT (30-day expiry) with JTI-based session tracking
- **File uploads:** Multer → local filesystem at `server/uploads/`
- **Module system:** CommonJS (`require`/`module.exports`)

Key files:
- `server/index.js` — Express app setup, security headers, route mounting, production static serving
- `server/db.js` — Database connection, full schema creation (7 tables), indexes
- `server/middleware/auth.js` — JWT creation, `authenticate` middleware, session validation
- `server/middleware/upload.js` — Multer config (10MB limit, JPEG/PNG/GIF/WebP only, UUID filenames)
- `server/routes/` — Route modules: `auth.js`, `posts.js`, `users.js`, `messages.js`, `sessions.js`

### Frontend (client/)

- **Framework:** React 18 with hooks (no class components)
- **Build tool:** Vite 6
- **Router:** React Router 6 (`react-router-dom`)
- **Styling:** Plain CSS in a single `client/src/styles/index.css` file (~525 lines)
- **Module system:** ES modules (`import`/`export`)
- **No component library** — all UI is custom

Key files:
- `client/src/App.jsx` — Route definitions, `ProtectedRoute` wrapper
- `client/src/context/AuthContext.jsx` — Global auth state (user, login, register, logout)
- `client/src/hooks/api.js` — HTTP client wrapping `fetch`, auto-attaches Bearer token from localStorage
- `client/src/pages/` — 11 page components (Feed, Explore, Profile, PostDetail, NewPost, Messages, Conversation, Sessions, EditProfile, Login, Register)
- `client/src/components/` — Reusable components (Navbar, PostCard)

### Database schema (SQLite)

7 tables: `users`, `posts`, `comments`, `likes`, `follows`, `messages`, `sessions`. All IDs are UUIDs (TEXT). Foreign keys use CASCADE delete. Timestamps are UTC strings via `datetime('now')`.

### API structure

All endpoints under `/api/`:
- `/api/auth` — register, login, logout, get current user
- `/api/posts` — CRUD, likes, comments, feed, explore
- `/api/users` — profiles, follow/unfollow, search
- `/api/messages` — conversations, send/receive messages
- `/api/sessions` — list, view, revoke sessions

Protected routes require `Authorization: Bearer <token>` header.

## Common commands

```bash
# First-time setup — install all dependencies
npm run setup

# Development — starts both client (:5173) and server (:3001)
npm run dev

# Start only the backend server
npm run server

# Start only the frontend dev server
npm run client

# Build frontend for production
npm run build

# Production — serve built client + API from Express
NODE_ENV=production npm start
```

## Environment variables

Copy `.env.example` to `.env`. Required for production:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Express server port |
| `JWT_SECRET` | hardcoded fallback | **Must** set a strong random value in production |
| `CLIENT_URL` | `http://localhost:5173` | Frontend origin for CORS |
| `DB_PATH` | `./server/haven.db` | SQLite database file path |

## Code conventions

### Backend
- CommonJS modules (`require`/`module.exports`)
- Route handlers use `async` for bcrypt operations, synchronous `better-sqlite3` calls everywhere else
- Error responses: `{ error: "message" }` with appropriate HTTP status codes
- Input validation at the start of route handlers, return early on failure
- SQL uses prepared statements (parameterized queries) — never string interpolation
- UUIDs for all primary keys (generated with `uuid` v4)
- Console logging only for errors (`console.error`)

### Frontend
- ES modules with `.jsx` extensions for React components
- Functional components with hooks only
- Auth state via React Context (`useAuth()` hook)
- API calls via `api.get/post/put/delete` from `client/src/hooks/api.js`
- Auth token stored in `localStorage` under key `haven_token`
- Pages are self-contained — each manages its own data fetching in `useEffect`
- No external state management library (just Context + useState)

### Naming
- Database columns: `snake_case` (`display_name`, `avatar_url`, `created_at`)
- API responses: `camelCase` (`displayName`, `avatarUrl`, `createdAt`) — mapped in route handlers
- React components: `PascalCase` filenames and exports
- CSS: kebab-case class names

### Security
- Security headers set on every response (nosniff, DENY framing, no-referrer, no FLoC)
- Passwords: bcrypt with cost factor 12
- JWT tokens include a JTI; sessions table tracks active/revoked status
- File uploads validated by MIME type and size (10MB max)
- CORS restricted to `CLIENT_URL`

## Testing and linting

No test framework or linter is currently configured. There are no test files, ESLint config, or Prettier config in the repository.

## Development notes

- The Vite dev server proxies `/api/*` and `/uploads/*` to `localhost:3001`, so the client can use relative URLs
- In production, Express serves the built React app from `client/dist` and handles the SPA fallback (`*` → `index.html`)
- The SQLite database auto-initializes on first server start (schema is in `db.js`)
- Uploaded files are stored at `server/uploads/` with UUID filenames — this directory is gitignored except for `.gitkeep`
- The database file (`*.db`) is gitignored
