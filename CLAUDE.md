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

### Completed (PL-5)

- `POST /api/chat/message` replaces the manual NDA form: a Structured Outputs call to `openrouter/openai/gpt-oss-120b` via LiteLLM/OpenRouter (Cerebras inference) converses with the user, extracts Mutual NDA fields as it goes, and reports completion once the required fields (purpose, both parties' company/signer names) are confirmed by the user.
- The backend merges extracted fields onto previously-known ones (a turn that doesn't mention a field never erases it) and independently double-checks the model's completion claim against the required-field gate rather than trusting it outright.
- `NdaChat.tsx` (later generalized into `ChatPanel.tsx` in PL-6) drove the same live preview/PDF-download flow as the old form; download stayed disabled until the AI marked the document complete.

### Completed (PL-6)

- Support for all 11 catalog document types, not just the Mutual NDA. 10 of the 11 have no accompanying cover-page/order-form template (only the Mutual NDA does), so instead of hand-crafting bespoke fields per document, a **generic engine** was built:
  - `frontend/lib/document-template.ts`: a hand-rolled line-based parser (deliberately not a general Markdown parser — these templates' nested-clause convention parses ambiguously under CommonMark) that converts a raw `templates/*.md` file into the same `Block[]` shape the Mutual NDA renderer already used (extracted to `frontend/lib/document-blocks.ts` so both share it), plus the list of "variables" (defined terms like `<span class="coverpage_link">Customer</span>`) the document references.
  - `backend/app/catalog.py`, `app/generic_documents.py`, `app/document_chat.py`, `app/routers/document_chat.py`: `POST /api/chat/detect-document-type` classifies which of the 11 catalog types the user wants (or explains it can't and offers the closest match); `POST /api/chat/generic-message` dynamically builds a Structured Outputs schema per request (one nullable field per variable, via `pydantic.create_model`) and extracts/merges fields the same way the NDA flow does.
  - `backend/app/llm.py`: a shared `call_structured()` helper, added after discovering live that gpt-oss-120b's "Structured Outputs" isn't grammar-constrained — it can emit syntactically malformed JSON despite the schema. Retries once before giving up; used by both the NDA and generic chat flows.
  - `frontend/components/DocumentCreator.tsx` replaced `NdaCreator.tsx`: one persistent `ChatPanel` (generalized from the old `NdaChat`) spans a `detecting → mutual-nda | generic` phase state machine; the preview panel (`PreviewPanel.tsx`) is document-type-agnostic, since it just renders `Block[]`.
  - The AI is instructed to always end a reply with a question or concrete next step, across every document type (Mutual NDA included).

### Completed (PL-7)

- Real user authentication end-to-end: `AuthContext.tsx` (React context wrapping the app), `AuthModal.tsx` (sign in/up), `UserMenu.tsx` (email + sign out) built on PL-4's existing backend auth (signup/signin/signout/me, JWT-in-cookie, bcrypt).
- Document persistence: `backend/app/models.py`'s `Document` table (JSON column for fields, scoped to `user_id`) and `/api/documents` CRUD endpoints, each checking ownership before returning/mutating a document.
- `MyDocumentsModal.tsx` lists, loads, and deletes a signed-in user's saved documents; `DocumentCreator.tsx`'s "Save to My Documents" / "New Document" wire this into the chat+preview state for both the Mutual NDA and generic-document shapes.
- Decided scope: drafting (chat, live preview, PDF download) stays open to anonymous users; signing in only gates saving/loading documents — there is no login wall on the core flow.
- Brand color scheme applied (`app/globals.css`'s `--color-brand-*` tokens, matching the "Color Scheme" section above, which was previously defined but never used): headings, primary buttons, and muted text across the new and touched components. This is a light-touch pass, not an exhaustive re-skin of every element.

### Current API Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in and receive session cookie
- `POST /api/auth/signout` - Clear auth cookie
- `GET /api/auth/me` - Get current user info (requires the session cookie)
- `GET /api/chat/document-types` - List the 11 supported document types
- `POST /api/chat/detect-document-type` - Classify which document type the user wants from a conversation
- `POST /api/chat/message` - Mutual NDA chat turn (extract fields, report completion)
- `POST /api/chat/generic-message` - Chat turn for any of the other 10 document types
- `GET /api/documents` - List the current user's saved documents (auth required)
- `POST /api/documents` - Save a new document (auth required)
- `GET /api/documents/{id}` - Get one saved document (auth required, must be owned by the caller)
- `PUT /api/documents/{id}` - Update a saved document's title/fields (auth required, ownership checked)
- `DELETE /api/documents/{id}` - Delete a saved document (auth required, ownership checked)
- `GET /api/health` - Health check
