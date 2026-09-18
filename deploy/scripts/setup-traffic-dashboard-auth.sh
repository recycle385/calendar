#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
AUTH_DIR="$PROJECT_ROOT/deploy/nginx/secrets"
AUTH_FILE="$AUTH_DIR/.htpasswd"

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl이 필요합니다." >&2
  exit 1
fi

read -r -p "대시보드 사용자명 [admin]: " username
username="${username:-admin}"

if [[ ! "$username" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "사용자명에는 영문, 숫자, 점, 밑줄, 하이픈만 사용할 수 있습니다." >&2
  exit 1
fi

read -r -s -p "대시보드 비밀번호: " password
echo
read -r -s -p "비밀번호 확인: " password_confirm
echo

if [[ -z "$password" || "$password" != "$password_confirm" ]]; then
  echo "비밀번호가 비어 있거나 서로 일치하지 않습니다." >&2
  exit 1
fi

mkdir -p "$AUTH_DIR"
umask 077
password_hash="$(printf '%s' "$password" | openssl passwd -apr1 -stdin)"
printf '%s:%s\n' "$username" "$password_hash" > "$AUTH_FILE"
chmod 0644 "$AUTH_FILE"

unset password password_confirm password_hash
echo "대시보드 인증 파일을 생성했습니다: $AUTH_FILE"
