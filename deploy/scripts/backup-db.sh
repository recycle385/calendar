#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$PROJECT_ROOT/deploy/.env.production}"
COMPOSE_FILE="$PROJECT_ROOT/compose.production.yml"
BACKUP_DIR="$PROJECT_ROOT/deploy/backups"

mkdir -p "$BACKUP_DIR"
resolved_backup_dir="$(realpath "$BACKUP_DIR")"
resolved_deploy_dir="$(realpath "$PROJECT_ROOT/deploy")"
case "$resolved_backup_dir" in
  "$resolved_deploy_dir"/*) ;;
  *) echo "백업 경로가 deploy 디렉터리 밖입니다: $resolved_backup_dir" >&2; exit 1 ;;
esac

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
destination="$BACKUP_DIR/calendar_db_${timestamp}.sql.gz"
compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

"${compose[@]}" exec -T db sh -c \
  'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' \
  | gzip > "$destination"

gzip -t "$destination"
echo "DB 백업을 생성했습니다: $destination"
