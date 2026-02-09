# Haven Privacy Principles

Haven is built on a simple idea: **your data belongs to you**.

## What we do NOT do

- **No ads.** Ever. There is no ad infrastructure in this codebase.
- **No tracking.** No analytics scripts, no pixel trackers, no behavioral profiling.
- **No data selling.** There is no mechanism to export or share user data with third parties.
- **No algorithmic feeds.** Your feed shows posts from people you follow, in chronological order.
- **No third-party cookies.** The only stored token is your auth session.
- **No external requests.** The app makes zero requests to external services. No CDNs, no font APIs, no analytics endpoints.
- **No FLoC/Topics.** The `Permissions-Policy: interest-cohort=()` header explicitly opts out of Google's ad tracking.

## What we DO

- **Local storage only.** All data lives in a SQLite database on the server you control.
- **Passwords hashed with bcrypt** (cost factor 12).
- **JWT auth tokens** with 30-day expiry, stored in localStorage (not cookies).
- **Security headers** on every response: no-referrer policy, X-Frame-Options DENY, nosniff.
- **You own the server.** Deploy it wherever you want — a Raspberry Pi, a VPS, your closet.

## Data deletion

Users can delete their posts at any time. To fully delete an account, remove the user row from the SQLite database — all related data (posts, comments, likes, follows, messages) will cascade-delete automatically due to foreign key constraints.
