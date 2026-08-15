# Circuit — AKTU Study Hub

A full-stack study site: login/signup, a resource library, and an AI tutor
chatbot (Gemini or OpenAI). Dark "blueprint" theme with 3D hero card, scroll
reveal, and a scroll-progress rail.

## Two things this build deliberately does NOT do

1. **It never asks for or stores a real Gmail password.** Users create a
   password for this site only (stored as a bcrypt hash). If you want
   "log in with Google," that's a separate OAuth integration — ask and I'll
   add it — but under no design should this site collect anyone's actual
   Google password.
2. **It's not set up to re-host the GATEWAY videos you purchased.** The
   resource library is for notes, write-ups, and links to content you
   actually have the right to share. Uploading your paid course videos for
   others to stream would violate GATEWAY's license terms and copyright law.

## Stack

- **Backend:** Node.js, Express, SQLite (via `better-sqlite3`, zero setup —
  no separate database server to install), JWT auth, bcrypt password hashing.
- **Frontend:** Plain HTML/CSS/JS (no build step) — open it straight through
  the backend's static server.
- **AI chatbot:** Server-side proxy to Gemini or OpenAI. The API key lives
  only in `backend/.env` and is never sent to the browser.

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
- Set `JWT_SECRET` to a long random string (the file shows a command to generate one).
- Set `AI_PROVIDER` to `gemini` or `openai`, and fill in the matching API key.
  - Gemini key: https://aistudio.google.com/apikey
  - OpenAI key: https://platform.openai.com/api-keys

Then run it:

```bash
npm start
```

Open **http://localhost:4000** — the backend serves the frontend too, so
there's nothing else to start. Sign up for an account, log in, add a
resource, and try the AI Help tab.

## Project layout

```
backend/
  server.js          entry point
  db.js              SQLite schema (users, resources, chat_messages)
  routes/auth.js      register/login (bcrypt + JWT)
  routes/resources.js resource library CRUD
  routes/chat.js       AI tutor proxy (Gemini/OpenAI)
  middleware/auth.js   JWT verification
frontend/
  index.html          public landing page
  login.html           login/signup
  dashboard.html        resources + chatbot (auth required)
  css/style.css
  js/app.js, auth.js, dashboard.js
```

## Deploying so classmates can actually use it

Running only on your laptop means it's only reachable while your laptop is
on and network-exposed. For something classmates can hit anytime, deploy the
backend (with its SQLite file, or swap in a hosted Postgres/MongoDB) to a
host like Render, Railway, or Fly.io, and put the frontend on the same
service (it's already served statically by Express) or on Vercel/Netlify
pointed at the deployed API. Happy to walk through whichever host you pick.

## Reasonable next steps

- Add "Sign in with Google" (OAuth) if you want one-click login without a
  separate password.
- Add file uploads (e.g. via S3 or Cloudinary) for PDFs of your own notes.
- Add an admin role/panel to moderate what gets posted.
- Rate-limit and paginate the resource list once it grows.
