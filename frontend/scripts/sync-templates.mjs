// Copies the canonical templates/*.md (repo root) into public/templates/ so the
// generic document flow can fetch them as static assets at runtime, both in
// `next dev` and in the Docker static export (files under public/ are copied
// into out/ by `next build`). Runs automatically via predev/prebuild so the
// frontend never silently drifts from the canonical source.
import { cpSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const frontendDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source = path.join(frontendDir, "..", "templates");
const destination = path.join(frontendDir, "public", "templates");

mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });

console.log(`Synced templates/ -> ${path.relative(frontendDir, destination)}`);
