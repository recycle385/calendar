#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${DEPLOY_ENV_FILE:-$PROJECT_ROOT/deploy/.env.production}"
COMPOSE_FILE="$PROJECT_ROOT/compose.production.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "배포 환경 파일이 없습니다: $ENV_FILE" >&2
  exit 1
fi

read_env() {
  local key="$1"
  sed -n "s/^${key}=//p" "$ENV_FILE" | tail -n 1 | tr -d '\r'
}

DOMAIN="$(read_env DOMAIN)"
EMAIL="$(read_env LETSENCRYPT_EMAIL)"
if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
  echo "DOMAIN과 LETSENCRYPT_EMAIL을 설정해야 합니다." >&2
  exit 1
fi

cert_dir="$PROJECT_ROOT/deploy/certbot/conf/live/$DOMAIN"
mkdir -p "$cert_dir" "$PROJECT_ROOT/deploy/certbot/www"

if [[ -f "$cert_dir/fullchain.pem" && -f "$cert_dir/privkey.pem" ]]; then
  echo "인증서가 이미 있습니다. 초기 발급을 중단합니다: $cert_dir" >&2
  exit 1
fi

echo "Nginx 최초 기동용 임시 인증서를 만듭니다."
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$cert_dir/privkey.pem" \
  -out "$cert_dir/fullchain.pem" \
  -subj "/CN=$DOMAIN"

compose=(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE")
"${compose[@]}" up -d db redis backend frontend

echo "Let's Encrypt 인증서를 발급합니다."
rm -f "$cert_dir/fullchain.pem" "$cert_dir/privkey.pem"
rmdir "$cert_dir"
"${compose[@]}" --profile tools run --rm certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  --domain "$DOMAIN"

"${compose[@]}" exec -T frontend nginx -s reload
echo "TLS 초기 설정이 완료되었습니다: https://$DOMAIN"
