#!/bin/sh
set -eu

LOG_FILE=/var/log/nginx/analytics/moim-access.log
REPORT_DIR=/var/www/goaccess
REPORT_FILE="$REPORT_DIR/report.html"
TEMP_REPORT="$REPORT_DIR/report.tmp.html"
DATABASE_DIR=/var/lib/goaccess
DATABASE_MARKER="$DATABASE_DIR/.initialized"
CONFIG_FILE=/etc/goaccess/goaccess.conf
REFRESH_SECONDS="${GOACCESS_REFRESH_SECONDS:-300}"

case "$REFRESH_SECONDS" in
  ''|*[!0-9]*|0)
    echo "GOACCESS_REFRESH_SECONDS는 1 이상의 정수여야 합니다." >&2
    exit 1
    ;;
esac

mkdir -p "$REPORT_DIR" "$DATABASE_DIR"

generate_report() {
  if [ ! -s "$LOG_FILE" ]; then
    return 0
  fi

  set -- "$LOG_FILE" \
    --no-global-config \
    --config-file="$CONFIG_FILE" \
    --db-path="$DATABASE_DIR" \
    --persist \
    --output="$TEMP_REPORT"

  if [ -f "$DATABASE_MARKER" ]; then
    set -- "$@" --restore
  fi

  if goaccess "$@"; then
    mv "$TEMP_REPORT" "$REPORT_FILE"
    touch "$DATABASE_MARKER"
  else
    rm -f "$TEMP_REPORT"
    return 1
  fi
}

while true; do
  if ! generate_report; then
    echo "GoAccess 보고서 생성에 실패했습니다. 다음 주기에 다시 시도합니다." >&2
  fi
  sleep "$REFRESH_SECONDS"
done
