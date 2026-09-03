# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The current implementation supports all 11 document types via AI chat with full user authentication and document persistence.

## Development process

When instructed to build a feature:

1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:

```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```

Backend available at http://localhost:8000

## Color Scheme

- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### Completed (PL-3)

- Client-rendered Mutual NDA creator prototype (`frontend/`): fill in a form, preview the completed NDA, download it as a PDF. No backend, auth, or persistence — this was a pure frontend prototype.

### Completed (PL-4)

- `backend/`: uv-managed FastAPI service. SQLite via SQLModel, dropped and recreated from scratch on every app startup (a genuinely temporary database, not just an empty file on first boot).
- Auth routes backed by real logic: `POST /api/auth/signup`, `POST /api/auth/signin`, `POST /api/auth/signout`, `GET /api/auth/me` — bcrypt password hashing, JWT session token in an HttpOnly cookie. Covered by pytest (12 tests: signup/signin validation, cookie auth, and the fresh-database-per-startup behavior).
- `GET /api/health` health check.
- Frontend switched to Next.js static export (`output: "export"` in `next.config.ts`) so `backend/app/main.py` can serve it directly from `/` via `StaticFiles`, alongside the `/api/*` routes, as one process on `http://localhost:8000`.
- `Dockerfile`: multi-stage build (Node stage builds the static frontend export, then a `uv`/Python stage runs the backend) producing a single image with everything above.
- `scripts/{start,stop}-{mac,linux,windows}`: build and run (or stop) that image.
- No product-facing features changed in this pass — the NDA form/preview/PDF flow is exactly what PL-3 shipped. There is **no frontend UI yet for signup/signin** — the auth endpoints exist and are tested, but nothing in `frontend/` calls them.

### Not yet started (PL-5 / PL-6 / PL-7)

These were previously (incorrectly) marked "Completed" in this file; none of the following exists in the codebase yet:

- AI chat interface for document creation, LiteLLM/OpenRouter/Cerebras integration, structured-output field extraction
- Support for document types beyond the Mutual NDA (the other 10 templates in `catalog.json` have no preview/PDF components)
- Document persistence, a "My Documents" view, or any frontend auth UI (login form, user menu, sign-out, auth context)
- Any `/api/documents/*` or `/api/chat/*` endpoints

### Current API Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in and receive session cookie
- `POST /api/auth/signout` - Clear auth cookie
- `GET /api/auth/me` - Get current user info (requires the session cookie)
- `GET /api/health` - Health check
