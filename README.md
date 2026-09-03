# prelegal

A dataset of Common Paper legal document templates (`templates/`, catalogued in `catalog.json`), plus a full-stack app that prototypes a Mutual NDA creator: fill in a form, preview the completed NDA, and download it as a PDF.

## Quickest start: Docker

```bash
scripts/start-mac.sh      # macOS
scripts/start-linux.sh    # Linux
scripts/start-windows.ps1 # Windows (PowerShell)
```

Builds the frontend and backend into a single image and runs it at **http://localhost:8000**. The database is SQLite and is recreated from scratch every time the container starts. Stop it with the matching `scripts/stop-*` script.

## Local development

Run the frontend and backend separately, each with its own hot reload.

Backend (from `backend/`):

- `uv sync` — install dependencies
- `uv run uvicorn app.main:app --reload --port 8000` — serves the API on `http://localhost:8000`
- `uv run pytest` — run the test suite

Frontend (from `frontend/`):

- `npm install`
- `npm run dev` — serves on `http://localhost:3000`
- `npm test` — runs the automated test suite (Vitest). See also `frontend/MANUAL_TESTING.md` for the manual test checklist.

## License

MIT — see [LICENSE](LICENSE).
