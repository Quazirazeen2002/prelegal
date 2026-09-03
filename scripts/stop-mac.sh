#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="prelegal-app"

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  docker stop "$CONTAINER_NAME"
  echo "Prelegal stopped."
else
  echo "Prelegal is not running."
fi
