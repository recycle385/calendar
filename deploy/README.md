# Oracle Cloud 운영 배포

이 디렉터리는 Oracle Cloud E2(1GB RAM + 2GB swap) 한 대에서 moim을 실행하기 위한 설정을 담습니다. 빌드와 테스트는 GitHub Actions가 담당하고 서버는 GHCR 이미지를 받아 실행만 합니다.

## 배포 흐름

1. `main` 푸시 시 프론트엔드·백엔드 테스트를 병렬 실행합니다.
2. 테스트 성공 후 두 Docker 이미지를 같은 전체 Git SHA로 태그해 GHCR에 올립니다.
3. 서버에서 `deploy/scripts/deploy.sh <전체 Git SHA>`를 실행합니다.
4. 스크립트가 `compose pull`, `compose up -d`, HTTPS 및 백엔드 readiness 확인을 차례로 수행합니다.

GitHub Actions의 `Deploy production` 워크플로를 수동 실행해 3번을 SSH로 수행할 수도 있습니다.

## 1. 서버 준비

Ubuntu에 Docker Engine, Compose plugin, Git, curl, OpenSSL을 설치하고 저장소를 복제합니다. 서버 방화벽과 Oracle Security List에서는 `22`, `80`, `443`만 허용합니다. `3000`, `3306`, `6379`는 외부에 열지 않습니다.

2GB swap은 메모리 부족 시 프로세스가 즉시 종료되는 것을 완화할 뿐 RAM을 늘리지는 않습니다. 배포 후 `docker stats`와 `free -h`로 실제 사용량을 확인합니다.

GHCR 패키지가 비공개라면 서버에서 packages read 권한을 가진 토큰으로 한 번 로그인합니다.

```bash
echo "$GHCR_READ_TOKEN" | docker login ghcr.io -u recycle385 --password-stdin
```

## 2. 운영 환경변수

```bash
cp deploy/.env.production.example deploy/.env.production
chmod 600 deploy/.env.production
```

예시 값을 실제 값으로 모두 교체합니다. JWT·세션 키는 서로 다른 긴 난수로 생성하고, `.env.production`은 Git에 올리지 않습니다. `IMAGE_TAG`는 GHCR에 올라간 전체 Git SHA를 사용합니다.

접속 통계 대시보드는 별도의 Basic Auth 인증 파일을 사용합니다. 최초 배포 전에 서버에서 다음 명령을 한 번 실행합니다. 생성되는 파일은 `deploy/nginx/secrets/.htpasswd`이며 Git에서 제외됩니다.

```bash
./deploy/scripts/setup-traffic-dashboard-auth.sh
```

Google OAuth에는 다음 주소를 운영 리디렉션 URI로 등록합니다.

```text
https://<DOMAIN>/auth/callback
```

프론트엔드는 이 경로에서 Google의 `code`와 `state`를 받은 뒤 백엔드 콜백 API로 전달합니다. Google Console의 승인된 리디렉션 URI와 `CLIENT_URL`이 정확히 일치하는지 배포 전에 다시 확인합니다.

## 3. 최초 TLS 발급과 기동

도메인의 A 레코드가 서버 공인 IP를 가리키고 80/443 접속이 가능해진 뒤 실행합니다.

```bash
./deploy/scripts/init-tls.sh
```

스크립트는 Nginx 최초 기동용 임시 인증서를 만든 다음, HTTP-01 방식으로 Let's Encrypt 인증서를 발급하고 Nginx를 다시 불러옵니다.

인증서 갱신은 root crontab 등에서 매일 한 번 확인하도록 설정합니다.

```cron
20 3 * * * cd /opt/calendar/Calendar_project && ./deploy/scripts/renew-tls.sh >> /var/log/moim-certbot.log 2>&1
```

## 4. 배포

GHCR에 두 이미지가 모두 있는 SHA를 지정합니다.

```bash
./deploy/scripts/deploy.sh 0123456789abcdef0123456789abcdef01234567
```

백엔드는 시작 시 현재의 멱등 마이그레이션을 실행합니다. 스키마 변경은 이전 애플리케이션 버전과 호환되는 순서로 작성해야 하며, 마이그레이션 실패 시 배포 스크립트의 상태 확인도 실패합니다.

수동 Actions 배포를 사용하려면 GitHub의 `production` Environment에 보호 규칙을 설정하고 아래 Secrets를 등록합니다.

- `ORACLE_HOST`
- `ORACLE_USER`
- `ORACLE_DEPLOY_PATH`
- `ORACLE_SSH_PRIVATE_KEY`
- `ORACLE_SSH_KNOWN_HOSTS`

`ORACLE_SSH_KNOWN_HOSTS`에는 사전에 신뢰성을 확인한 서버 host key를 저장합니다. 워크플로 안에서 즉석으로 `ssh-keyscan`하지 않습니다.

## 5. DB 백업과 복구 확인

백업 파일은 Git에서 제외된 `deploy/backups` 아래에 생성됩니다.

```bash
./deploy/scripts/backup-db.sh
```

매일 백업하려면 다음처럼 등록할 수 있습니다.

```cron
10 4 * * * cd /opt/calendar/Calendar_project && ./deploy/scripts/backup-db.sh >> /var/log/moim-db-backup.log 2>&1
```

이 스크립트는 백업을 자동 삭제하지 않습니다. 서버와 분리된 저장소로 주기적으로 복사하고, 보존 정책은 그 저장소에서 적용합니다. 복구 연습은 운영 DB가 아닌 별도 MySQL에서 수행합니다.

```bash
gzip -dc deploy/backups/calendar_db_<timestamp>.sql.gz \
  | docker compose --env-file deploy/.env.production -f compose.production.yml exec -T db \
      sh -c 'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'
```

## 6. 운영 확인

```bash
docker compose --env-file deploy/.env.production -f compose.production.yml ps
docker compose --env-file deploy/.env.production -f compose.production.yml logs --tail 100 backend frontend
curl -fsS https://<DOMAIN>/healthz
curl -fsS https://<DOMAIN>/api/v1/health/ready
```

Nginx는 헬스체크, 정적 에셋, Socket.IO 요청을 통계에서 제외하고 쿼리 문자열·쿠키·요청 본문·Referer를 저장하지 않습니다. 캘린더 공유 코드와 참가자 UUID도 `:slug`, `:participant`로 치환합니다. 접근 시각, IP, 메서드, 정규화된 URL 경로, 프로토콜, 상태 코드, 응답 크기, User-Agent, 처리 시간만 `nginx_access_logs` 볼륨에 보관합니다. GoAccess 보고서에서는 IP 마지막 영역을 익명화하며 집계 DB와 생성된 HTML은 각각 `goaccess_data`, `goaccess_reports` 볼륨에 저장됩니다.

필터링된 원본 접근 로그는 현재 자동 삭제하지 않고 유지하므로 서버 디스크 사용량을 정기적으로 확인합니다.

```bash
docker system df
docker compose --env-file deploy/.env.production -f compose.production.yml exec frontend \
  du -h /var/log/nginx/analytics/moim-access.log
```

Redis는 AOF `everysec`로 저장하며 MySQL·Redis·백엔드 로그·접속 통계는 named volume에 보관됩니다. Docker json 로그는 파일당 10MB, 최대 3개로 회전합니다. DB 볼륨과 백업 파일은 서로 대체 관계가 아니므로 둘 다 유지합니다.
