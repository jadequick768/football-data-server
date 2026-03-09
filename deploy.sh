#!/usr/bin/env bash
# deploy.sh — chạy trên VPS
# Usage: bash deploy.sh

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$REPO_DIR/.env"

echo "==> Kiểm tra .env ..."
if [[ ! -f "$ENV_FILE" ]]; then
  cp "$REPO_DIR/.env.example" "$ENV_FILE"
  echo "⚠️  Tạo $ENV_FILE từ .env.example — hãy điền SPORTSRC_API_KEY rồi chạy lại."
  exit 1
fi

if grep -q "REPLACE_ME\|PUT_YOUR_KEY_HERE" "$ENV_FILE"; then
  echo "⚠️  Chưa điền SPORTSRC_API_KEY trong $ENV_FILE"
  exit 1
fi

echo "==> Pull latest code ..."
git -C "$REPO_DIR" pull --ff-only

echo "==> Build images ..."
docker compose -f "$REPO_DIR/docker-compose.prod.yml" --env-file "$ENV_FILE" build --pull

echo "==> Deploy (zero-downtime style) ..."
docker compose -f "$REPO_DIR/docker-compose.prod.yml" --env-file "$ENV_FILE" up -d --remove-orphans

echo ""
echo "✅ Deploy xong!"
echo "   API  → https://api.tintuc360.net/health"
echo "   Web  → https://tintuc360.net"
