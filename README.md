# Haven

A privacy-first social platform. No ads, no tracking, no data extraction — just people connecting with each other.

## Features

- **Photo sharing** — Post images with captions, like and comment
- **Profiles** — Customizable profiles with avatar, bio, and post grid
- **Follow system** — Follow people to see their posts in your chronological feed
- **Direct messages** — Private conversations between users
- **Search** — Find people by username or display name
- **Explore** — Browse recent public posts
- **Mobile-friendly** — Responsive design that works on any screen

## Tech stack

| Layer     | Technology           | Why                                      |
|-----------|---------------------|------------------------------------------|
| Backend   | Node.js + Express   | Simple, well-understood, easy to deploy  |
| Database  | SQLite              | Zero config, runs anywhere, you own it   |
| Frontend  | React + Vite        | Fast dev experience, small bundle        |
| Auth      | bcrypt + JWT        | No third-party auth dependency           |
| Storage   | Local filesystem    | Media stays on your server               |

## Quick start

```bash
# Install everything
npm run setup

# Start dev servers (API + frontend)
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to `http://localhost:3001`.

## Production

```bash
# Build the frontend
npm run build

# Start the production server
NODE_ENV=production npm start
```

In production, the Express server serves the built React app and handles API routes.

## Configuration

Copy `.env.example` to `.env` and set:

- `JWT_SECRET` — A long, random string for signing auth tokens
- `PORT` — Server port (default: 3001)
- `CLIENT_URL` — Frontend URL for CORS (default: http://localhost:5173)

## Privacy

See [PRIVACY.md](./PRIVACY.md) for the full privacy principles. The short version: no ads, no tracking, no data extraction, no external requests.

## License

AGPL-3.0 — If you run a modified version as a service, you must share the source code.
