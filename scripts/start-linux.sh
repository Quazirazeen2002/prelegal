#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE_NAME="prelegal"
CONTAINER_NAME="prelegal-app"
PORT="8000"

docker build -t "$IMAGE_NAME" "$REPO_ROOT"

docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true

docker run \
  --rm \
  --detach \
  --name "$CONTAINER_NAME" \
  --publish "$PORT:8000" \
  "$IMAGE_NAME"

echo "Prelegal is running at http://localhost:$PORT"
echo "Stop it with scripts/stop-linux.sh"
