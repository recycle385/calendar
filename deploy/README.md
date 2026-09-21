# Oracle Cloud 운영 배포

이 디렉터리는 Oracle Cloud E2(1GB RAM + 2GB swap) 한 대에서 moim을 실행하기 위한 설정을 담습니다. 빌드와 테스트는 GitHub Actions가 담당하고 서버는 GHCR 이미지를 받아 실행만 합니다.

## 배포 흐름

1. `main` 푸시 시 프론트엔드·백엔드 테스트를 병렬 실행합니다.
2. 테스트 성공 후 두 Docker 이미지를 같은 전체 Git SHA로 태그해 GHCR에 올립니다.
3. GitHub Actions의 `Deploy production` 워크플로에서 배포할 전체 Git SHA를 선택합니다.
4. 서버 저장소가 해당 SHA를 checkout한 뒤, 같은 SHA의 `deploy/scripts/deploy.sh`를 실행합니다.
5. 스크립트가 `compose pull`, `compose up -d`, HTTPS 및 백엔드 readiness 확인을 차례로 수행합니다.

GitHub Actions에서는 production 배포를 직렬화하고, 서버 SSH 단계에서도 `flock`을 잡습니다. `deploy.sh`를 서버에서 직접 실행하는 경우에도 같은 lock을 사용하므로 Actions 배포와 수동 배포가 겹치지 않습니다.

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

주요 설정은 다음 기준으로 채웁니다.

| 구분        | 설정                                                               |
| ----------- | ------------------------------------------------------------------ |
| 이미지      | `GHCR_OWNER`, 전체 40자리 `IMAGE_TAG`                              |
| 공개 주소   | `DOMAIN`, `CLIENT_URL`, `BACKEND_URL`을 같은 HTTPS origin으로 설정 |
| 인증        | 서로 다른 JWT secret, `SESSION_SECRET`, Google OAuth ID·secret     |
| 저장소      | 운영용 MySQL root/user 비밀번호, 내부 호스트 `db`, `redis` 유지    |
| 외부 데이터 | 공공데이터포털 서비스 키                                           |

운영 값이 모두 준비되면 컨테이너를 띄우기 전에 Compose 해석 결과를 검증합니다. 출력에는 secret이 포함될 수 있으므로 로그나 이슈에 그대로 올리지 않습니다.

```bash
docker compose --env-file deploy/.env.production -f compose.production.yml config --quiet
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

GHCR에 두 이미지가 모두 있는 전체 Git SHA를 `Deploy production` 워크플로에 입력합니다. 워크플로는 대상 SHA가 `main` 이력에 포함되는지 확인하고 서버 저장소를 같은 SHA로 checkout한 뒤 배포합니다.

서버에서 직접 실행해야 한다면 배포 설정과 이미지가 같은 커밋을 사용하도록 먼저 대상 SHA를 checkout합니다.

```bash
git fetch --prune origin '+refs/heads/main:refs/remotes/origin/main'
git switch --detach <full-git-sha>
./deploy/scripts/deploy.sh <full-git-sha>
```

`deploy.sh`는 현재 checkout된 Git SHA와 이미지 태그가 다르면 배포를 거부합니다.

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

## 6. 롤백

애플리케이션 문제로 이전 버전이 필요하면 DB 스키마 호환성을 먼저 확인한 뒤, 정상 동작했던 전체 Git SHA를 `Deploy production` 워크플로에 입력합니다. 워크플로가 해당 SHA의 배포 설정과 같은 SHA의 이미지를 사용합니다.

서버에서 직접 롤백해야 한다면 동일하게 이전 SHA를 checkout한 뒤 배포합니다.

```bash
git fetch --prune origin '+refs/heads/main:refs/remotes/origin/main'
git switch --detach <previous-full-git-sha>
./deploy/scripts/deploy.sh <previous-full-git-sha>
```

이 방식은 프론트엔드와 백엔드를 같은 커밋으로 함께 되돌립니다. 데이터 복구가 필요한 장애는 이미지 롤백과 분리해 검토하고, 운영 DB에 백업 파일을 바로 덮어쓰지 않습니다.

## 7. 운영 확인

```bash
docker compose --env-file deploy/.env.production -f compose.production.yml ps
docker compose --env-file deploy/.env.production -f compose.production.yml logs --tail 100 backend frontend
curl -fsS https://<DOMAIN>/healthz
curl -fsS https://<DOMAIN>/api/v1/health/ready
```

Redis는 AOF `everysec`로 저장하며 영속 데이터는 named volume에 보관됩니다. Docker json 로그는 파일당 10MB, 최대 3개로 회전합니다. DB 볼륨과 백업 파일은 서로 대체 관계가 아니므로 둘 다 유지합니다.
