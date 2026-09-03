# prelegal

A dataset of Common Paper legal document templates (`templates/`, catalogued in `catalog.json`), plus a full-stack app that prototypes a Mutual NDA creator: chat with an AI assistant, watch the NDA populate live as it gathers the details, and download it as a PDF once it's complete.

The chat is powered by an LLM (via LiteLLM/OpenRouter, Cerebras inference), so an `OPENROUTER_API_KEY` must be set in a repo-root `.env` file for the chat to work (see `backend/.env.example`).

## Quickest start: Docker

```bash
scripts/start-mac.sh      # macOS
scripts/start-linux.sh    # Linux
scripts/start-windows.ps1 # Windows (PowerShell)
```

Builds the frontend and backend into a single image and runs it at **http://localhost:8000**. The database is SQLite and is recreated from scratch every time the container starts. If a repo-root `.env` file exists, its variables (including `OPENROUTER_API_KEY`) are passed into the container. Stop it with the matching `scripts/stop-*` script.

## Local development

Run the frontend and backend separately, each with its own hot reload.

Backend (from `backend/`):

- `uv sync` — install dependencies
- `uv run uvicorn app.main:app --reload --port 8000` — serves the API on `http://localhost:8000` (reads `OPENROUTER_API_KEY` from the repo-root `.env`)
- `uv run pytest` — run the test suite

Frontend (from `frontend/`):

- `npm install`
- `cp .env.local.example .env.local` — points the frontend at the separately-running backend
- `npm run dev` — serves on `http://localhost:3000`
- `npm test` — runs the automated test suite (Vitest). See also `frontend/MANUAL_TESTING.md` for the manual test checklist.

## License

MIT — see [LICENSE](LICENSE).
