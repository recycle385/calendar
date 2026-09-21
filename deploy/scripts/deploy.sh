#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$PROJECT_ROOT/deploy/.env.production}"
COMPOSE_FILE="$PROJECT_ROOT/compose.production.yml"
IMAGE_TAG="${1:-}"
TRAFFIC_AUTH_FILE="$PROJECT_ROOT/deploy/nginx/secrets/.htpasswd"
LOCK_FILE="${DEPLOY_LOCK_FILE:-/tmp/moim-production-deploy.lock}"

if [[ "${DEPLOY_LOCK_HELD:-0}" != "1" ]]; then
  if ! command -v flock >/dev/null 2>&1; then
    echo "flock 명령을 찾을 수 없어 안전하게 배포를 잠글 수 없습니다." >&2
    exit 1
  fi

  exec 9>"$LOCK_FILE"
  if ! flock -n 9; then
    echo "다른 배포가 이미 진행 중입니다." >&2
    exit 1
  fi
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "배포 환경 파일이 없습니다: $ENV_FILE" >&2
  exit 1
fi

if [[ ! -s "$TRAFFIC_AUTH_FILE" ]]; then
  echo "접속 통계 대시보드 인증 파일이 없습니다: $TRAFFIC_AUTH_FILE" >&2
  echo "먼저 ./deploy/scripts/setup-traffic-dashboard-auth.sh 를 실행하세요." >&2
  exit 1
fi

if [[ ! "$IMAGE_TAG" =~ ^[0-9a-f]{40}$ ]]; then
  echo "이미지 태그에는 Git 전체 커밋 SHA(40자리 소문자 16진수)를 사용해야 합니다." >&2
  exit 1
fi

CURRENT_SHA="$(git -C "$PROJECT_ROOT" rev-parse HEAD)"
if [[ "$CURRENT_SHA" != "$IMAGE_TAG" ]]; then
  echo "배포 설정의 Git SHA와 이미지 SHA가 일치하지 않습니다." >&2
  echo "현재 설정: $CURRENT_SHA" >&2
  echo "요청 이미지: $IMAGE_TAG" >&2
  echo "대상 SHA를 checkout한 뒤 다시 배포하세요." >&2
  exit 1
fi

read_env() {
  local key="$1"
  sed -n "s/^${key}=//p" "$ENV_FILE" | tail -n 1 | tr -d '\r'
}

DOMAIN="$(read_env DOMAIN)"
if [[ -z "$DOMAIN" ]]; then
  echo "DOMAIN이 설정되지 않았습니다." >&2
  exit 1
fi

TRAFFIC_DASHBOARD_PATH="$(read_env TRAFFIC_DASHBOARD_PATH)"
if [[ ! "$TRAFFIC_DASHBOARD_PATH" =~ ^[A-Za-z0-9._-]+(/[A-Za-z0-9._-]+)+$ ]]; then
  echo "TRAFFIC_DASHBOARD_PATH는 슬래시로 구분된 두 개 이상의 안전한 경로여야 합니다." >&2
  echo "앞뒤 슬래시는 넣지 마세요." >&2
  exit 1
fi

update_image_tag() {
  local value="$1"
  local temporary
  temporary="$(mktemp "${ENV_FILE}.XXXXXX")"
  awk -v tag="$value" '
    BEGIN { replaced = 0 }
    /^IMAGE_TAG=/ { print "IMAGE_TAG=" tag; replaced = 1; next }
    { print }
    END { if (!replaced) print "IMAGE_TAG=" tag }
  ' "$ENV_FILE" > "$temporary"
  chmod --reference="$ENV_FILE" "$temporary"
  mv "$temporary" "$ENV_FILE"
}

update_image_tag "$IMAGE_TAG"

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")

echo "[$IMAGE_TAG] 프론트엔드와 백엔드 이미지를 받습니다."
"${compose[@]}" pull frontend backend goaccess

echo "컨테이너를 새 이미지로 교체합니다."
"${compose[@]}" up -d --remove-orphans

echo "서비스 상태를 확인합니다."
for attempt in {1..40}; do
  if curl --fail --silent --show-error \
    --resolve "$DOMAIN:443:127.0.0.1" \
    "https://$DOMAIN/healthz" >/dev/null \
    && "${compose[@]}" exec -T backend node -e \
      "fetch('http://127.0.0.1:3000/api/v1/health/ready').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"; then
    echo "배포가 완료되었습니다: $IMAGE_TAG"
    exit 0
  fi

  if [[ "$attempt" -eq 40 ]]; then
    echo "제한 시간 안에 서비스가 정상 상태가 되지 않았습니다." >&2
    "${compose[@]}" ps >&2
    "${compose[@]}" logs --tail 100 backend frontend goaccess >&2
    exit 1
  fi

  sleep 3
done
