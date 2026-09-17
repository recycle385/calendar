#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$PROJECT_ROOT/deploy/.env.production}"
COMPOSE_FILE="$PROJECT_ROOT/compose.production.yml"
compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

"${compose[@]}" --profile tools run --rm certbot renew \
  --webroot --webroot-path /var/www/certbot --quiet
"${compose[@]}" exec -T frontend nginx -s reload
