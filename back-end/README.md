# Calendar Backend

모임 날짜 조율 캘린더 백엔드입니다. Google OAuth 로그인, 캘린더 생성/참가, 날짜별 투표, 공휴일 정보 관리, 실시간 접속 상태 알림을 제공합니다.

## 기술 스택

- Runtime: Node.js 20
- Language: TypeScript
- Server: Express, Socket.IO
- Database: MySQL 8, Redis
- Auth: JWT, Google OAuth
- Validation: Joi
- Docs: Swagger UI
- Test: Jest, Supertest, socket.io-client
- Infra: Docker, Docker Compose

## 주요 기능

- Google OAuth 로그인 및 회원가입
- Access Token / Refresh Token 발급, 갱신, 로그아웃
- 공유 가능한 slug 기반 캘린더 생성, 조회, 수정, 삭제, 마감
- 회원/비회원 참가자 등록 및 참가자 토큰 발급
- 날짜별 투표 제출, 수정, 집계 조회
- 공휴일/기념일 `date_info` 데이터 등록, 조회, 삭제
- Socket.IO 기반 캘린더 방 입장/퇴장 및 온라인 사용자 알림
- Cron 기반 자동 마감, 만료 캘린더 삭제, 공휴일 데이터 정기 업데이트

## 프로젝트 구조

```text
src
├─ app.ts                         # Express 앱 및 공통 미들웨어 등록
├─ web.ts                         # DB/Redis/Socket/Cron 초기화 후 서버 시작
├─ config                         # env, database, redis, swagger, logger 설정
├─ constants                      # API prefix 및 라우트 상수
├─ containers                     # controller/service/repository 의존성 조립
├─ controllers                    # HTTP 요청/응답 처리
├─ services                       # 비즈니스 로직
├─ repositories                   # MySQL/Redis 데이터 접근
├─ models                         # 도메인 모델, DTO, DB schema
├─ middlewares                    # 인증, 검증, 로깅, CORS, rate limit, 에러 처리
├─ routes                         # Express 라우터
├─ sockets                        # Socket.IO 초기화 및 이벤트 처리
├─ utils                          # JWT, 날짜, 공공데이터 API, 에러 유틸
├─ types                          # Express/Socket/Auth 타입 확장
└─ __tests__                      # unit/integration 테스트
```

## 실행 준비

```bash
npm install
```

필수 환경 변수는 `.env` 또는 테스트 환경의 `.env.test`에 설정합니다.

```env
PORT=3000
NODE_ENV=development

MAIN_JWT_SECRET=...
PARTICIPANT_JWT_SECRET=...
REFRESH_JWT_SECRET=...
LEGACY_JWT_SECRET=...
SESSION_SECRET=...
SIGNUP_MODE=immediate
HOST_ACCESS_TOKEN=...

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=...
DB_USER_PASSWORD=...
DB_ROOT_PASSWORD=...
DB_NAME=...
DB_CONNECTION_LIMIT=10

REDIS_URL=redis://127.0.0.1:6379

CLIENT_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

GET_REST_DE_INFO=...
ENABLE_RATE_LIMIT=false
GENERAL_RATE_LIMIT_MAX=600
```

`MAIN_JWT_SECRET`, `PARTICIPANT_JWT_SECRET`, `REFRESH_JWT_SECRET`은 서로 다른 긴 무작위 값으로 설정합니다. `LEGACY_JWT_SECRET`은 기존 단일 JWT secret에서 분리 배포할 때만 임시로 설정하고, 기존 토큰 만료 기간이 지난 뒤 제거합니다. `SIGNUP_MODE`는 `pending` 또는 `immediate`, `ENABLE_RATE_LIMIT`는 `true` 또는 `false`만 허용합니다. `GENERAL_RATE_LIMIT_MAX`는 15분 동안 IP별로 허용할 일반 API 요청 수이며 생략하면 600입니다. `DB_ROOT_PASSWORD`는 Docker Compose의 MySQL 컨테이너에서 사용합니다. 애플리케이션 내부 검증 필수값은 `src/config/env.ts` 기준입니다.

## 개발 실행

로컬 MySQL/Redis를 직접 띄운 뒤 개발 서버를 실행합니다.

```bash
npm run dev
```

Docker Compose로 앱, MySQL, Redis를 함께 실행할 수도 있습니다.

```bash
docker compose up --build
```

DB 초기 스키마는 `src/models/schema/calendar_db.sql`이 MySQL 컨테이너 시작 시 적용됩니다.

## 빌드 및 운영

```bash
npm run build
npm run start
```

`npm run build`는 TypeScript를 `dist`로 컴파일합니다. `npm run start`는 Node.js로 `dist/web.js`를 실행합니다. 운영 환경은 저장소 루트의 `compose.production.yml`과 [배포 가이드](../deploy/README.md)를 사용합니다.

## 테스트

테스트용 MySQL/Redis는 `docker-compose.ci.yml` 기준으로 각각 `3307`, `6380` 포트를 사용합니다.

```bash
docker compose -f docker-compose.ci.yml up -d --wait
npm test
docker compose -f docker-compose.ci.yml down --volumes
```

Jest 설정은 `jest.config.js`에 있으며 `src/__tests__/**/*.test.ts`를 실행합니다.

## API

모든 HTTP API는 `/api/v1` prefix를 사용합니다. Swagger UI는 `/api/v1/api-docs`에서 확인할 수 있습니다.

### Auth

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/v1/auth/google` | Google OAuth 로그인 페이지로 리다이렉트 |
| GET | `/api/v1/auth/google/callback` | Google OAuth 콜백 처리 |
| POST | `/api/v1/auth/register` | signupToken 기반 회원가입 완료 |
| POST | `/api/v1/auth/refresh` | Refresh Token으로 Access Token 갱신 |
| POST | `/api/v1/auth/logout` | Refresh Token 무효화 및 쿠키 삭제 |

### Calendars

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/v1/calendars` | UserAuth | 캘린더 생성 |
| GET | `/api/v1/calendars/my` | UserAuth | 내 캘린더 목록 조회 |
| GET | `/api/v1/calendars/joined` | UserAuth | 계정에 연결된 참여 캘린더 목록 조회 |
| GET | `/api/v1/calendars/:slug` | 없음 | slug로 캘린더 조회 |
| PATCH | `/api/v1/calendars/:slug` | UserAuth | 방장 캘린더 수정 |
| DELETE | `/api/v1/calendars/:slug` | UserAuth | 방장 캘린더 삭제 |
| POST | `/api/v1/calendars/:slug/close` | UserAuth | 방장 캘린더 마감 |

### Participants

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/v1/calendars/:slug/participants` | 선택 UserAuth | 참가자 등록 |
| POST | `/api/v1/calendars/:slug/participants/login` | 선택 UserAuth | 참가자 로그인 |
| POST | `/api/v1/calendars/:slug/participants/guest-entry` | 없음 | 닉네임 기준 비회원 신규 참여 또는 비밀번호 재입장 |
| GET | `/api/v1/calendars/:slug/participants` | 없음 | 참가자 및 투표 현황 조회 |
| GET | `/api/v1/calendars/:slug/participants/reconciliation` | UserAuth + `X-Participant-Token` | 익명 게스트와 현재 계정 참가 정보 비교 |
| POST | `/api/v1/calendars/:slug/participants/reconciliation` | UserAuth + `X-Participant-Token` | 계정·게스트 참가 및 투표 기록 정리 |
| DELETE | `/api/v1/calendars/:slug/participants/self` | ParticipantAuth | 본인 참가자 삭제 |
| DELETE | `/api/v1/calendars/:slug/participants/:uuid` | UserAuth | 방장이 참가자 강퇴 |

로그인 회원은 참가자 등록 시 `profileType`을 함께 보냅니다. `account`는 계정 프로필 이름을, `alias`는 별명을 사용하지만 둘 다 회원 계정에 연결되므로 Main Token만으로 다시 입장할 수 있습니다. 비회원 참여는 `nickname`과 개인 `password`를 사용하며 계정의 참여 목록에는 포함되지 않습니다.

비회원으로 참여한 브라우저에서 로그인하면 reconciliation API로 기존 게스트 기록과 계정 기록을 정리합니다. 계정 참가자가 이미 있으면 `keep-account` 또는 `use-guest-votes`로 한쪽의 전체 투표만 유지하고 게스트를 삭제합니다. 계정 참가자가 없으면 `claim-account` 또는 `claim-alias`로 게스트 행과 투표는 유지하면서 회원에 연결합니다. 연결 시 참가자 UUID와 토큰을 새로 발급해 기존 게스트 토큰과 소켓은 더 이상 사용할 수 없습니다.

### Votes

투표 제출은 `{"votes":[{"date":"2026-09-10","voteType":"available"},{"date":"2026-09-11","voteType":"maybe"}]}` 형식을 사용합니다. `voteType`은 `available`, `maybe`, `unavailable` 중 하나이며 날짜마다 필수입니다. 날짜는 중복 없이 최대 366개까지 허용하고, 해당 캘린더의 활성 날짜여야 합니다.

한 요청은 해당 참가자의 전체 투표를 교체합니다. 빠진 날짜는 투표 취소이며 `{"votes":[]}`는 전체 취소입니다. `unavailable`은 미투표와 구분됩니다. 응답도 `selectedDates` 대신 `votes`를 반환하며 `votedCount`는 교체 후 투표 수입니다. 프론트는 기존 `selectedDates + voteType` 요청과 응답 처리를 함께 변경해야 합니다.

투표 저장은 캘린더 공유 잠금, 참가자 배타 잠금, 날짜 옵션 공유 잠금 순서로 검증과 교체를 같은 트랜잭션에서 수행합니다. 기존 투표의 PK만 삭제하고 날짜 옵션 ID 순서로 다시 삽입하며, 데드락 발생 시 전체 트랜잭션을 최대 두 번 재시도합니다.

| Method | Path | 인증 | 설명 |
| --- | --- | --- | --- |
| POST | `/api/v1/calendars/:slug/votes` | ParticipantAuth | 투표 제출 및 수정 |
| GET | `/api/v1/calendars/:slug/votes` | 없음 | 캘린더 전체 투표 현황 조회 |
| GET | `/api/v1/calendars/:slug/votes/:participantUuid` | 없음 | 특정 참가자 투표 내역 조회 |

투표 타입은 `available`, `unavailable`, `maybe` 중 하나입니다.

### Date Infos

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/v1/date-infos` | 공휴일/기념일 단건 등록 |
| POST | `/api/v1/date-infos/batch` | 공휴일/기념일 배치 등록 |
| GET | `/api/v1/date-infos` | 전체 조회 |
| GET | `/api/v1/date-infos/years?years[]=2025` | 여러 연도 조회 |
| GET | `/api/v1/date-infos/before?year=2025` | 특정 연도 이전 조회 |
| GET | `/api/v1/date-infos/kinds?years[]=2025&dateKinds[]=01` | 여러 연도와 종류로 조회 |
| GET | `/api/v1/date-infos/:year/kinds?dateKinds[]=01` | 특정 연도와 종류로 조회 |
| GET | `/api/v1/date-infos/:year` | 특정 연도 조회 |
| DELETE | `/api/v1/date-infos/before?year=2025` | 특정 연도 이전 삭제 |
| DELETE | `/api/v1/date-infos` | 날짜/이름 쌍으로 삭제 |

`dateKind` 값은 `01`, `02`, `03`, `04`, `05`를 사용합니다.

## 인증 방식

- `UserAuth`: Google 로그인 사용자의 JWT입니다. `Authorization: Bearer <accessToken>` 헤더를 사용합니다.
- `ParticipantAuth`: 캘린더 참가자의 JWT입니다. 투표 제출, 본인 참가 취소, 소켓 연결에 사용합니다. `host` 역할이어도 관리 권한은 부여하지 않습니다.
- 캘린더 수정·삭제·마감과 참가자 강퇴는 Main Access Token(`UserAuth`)을 보내야 하며, DB의 `calendar.owner_id`로 소유자를 확인합니다. 프론트의 해당 요청은 Participant Token 대신 Main Access Token을 사용해야 합니다.
- Refresh Token은 쿠키 기반으로 처리합니다.

## Socket.IO

Socket.IO는 HTTP 서버 위에서 초기화되며 `websocket` transport를 사용합니다. 연결 시 참가자 토큰이 필요합니다.

```ts
io("http://localhost:3000", {
  transports: ["websocket"],
  auth: { token: participantToken },
});
```

클라이언트 이벤트:

- `joinCalendarRoom`: 현재 토큰의 캘린더 방에 입장
- `leaveCalendarRoom`: 캘린더 방에서 퇴장

서버 이벤트:

- `onlineUsers`: 현재 방의 온라인 사용자 목록
- `userOnline`: 다른 사용자의 입장 알림
- `userOffline`: 다른 사용자의 퇴장 알림
- `calendarClosed`: 캘린더 자동 마감 알림
- `calendarDeleted`: 만료 캘린더 삭제 알림

## Cron 작업

서버 timestamp와 로그는 UTC를 사용하고, 투표 가능 날짜와 크론 기준일은 `Asia/Seoul`의 날짜로 계산합니다. `YYYY-MM-DD` 날짜 전용 값에는 timestamp 시간대 변환을 적용하지 않습니다.

`src/services/cron.service.ts`에서 서버 시작 시 다음 작업을 등록합니다.

- 매일 KST 00:00: 전날까지 투표 기간이 끝난 열린 캘린더를 자동 마감
- 매일 KST 04:00: 보관 기간이 지난 캘린더 삭제, 공휴일 동기화 누락 복구, 오래된 date-info 정리
- 매년 12월 1일 KST 04:00 유지보수에서는 공휴일 정보를 전체 갱신
- 자동 마감은 대상 조회와 상태 변경을 같은 트랜잭션과 행 잠금 안에서 재확인하고 실제 마감된 캘린더에만 Socket 이벤트를 전송합니다.
- 삭제는 서버가 계산한 `vote_end_date + 30일`의 `expired_at`이 지난 뒤 첫 04시 유지보수에서 처리합니다.

## 데이터베이스

스키마 파일은 `src/models/schema/calendar_db.sql`입니다.

- `users`: Google OAuth 사용자
- `users.last_login_at`: 가입 시 최초 기록하며, 기존 사용자 로그인 성공 시에만 갱신합니다. 프로필 수정과 토큰 재발급에는 갱신하지 않습니다. 서버 시작 시 기존 DB의 `ON UPDATE` 속성을 제거하며, 이미 잘못 기록된 과거 시각은 복원하지 않습니다.
- `calendars`: 모임 캘린더
- `date_info`: 공휴일/기념일 정보
- `participants`: 캘린더 참가자
- `date_options`: 투표 대상 날짜
- `votes`: 참가자별 날짜 투표

## 참고 사항

- API 요청 검증은 `src/middlewares/validation.ts`의 Joi schema를 기준으로 합니다.
- 공통 에러 처리는 `src/middlewares/errorHandler.ts`와 `src/utils/errors`에서 관리합니다.
- Redis는 토큰 블랙리스트, rate limit, Socket.IO 관련 기능에 사용됩니다.
- `ENABLE_RATE_LIMIT=true`일 때 `/api/v1` 하위 API에 rate limiter가 적용됩니다.

### 공휴일 데이터 출처 보존

공휴일의 저장 키는 날짜·종류·순번·출처입니다. 같은 날짜와 순번의 `public-api`와 `custom` 항목은 별도로 보존하며, 재동기화는 같은 출처의 항목만 갱신합니다. 서버 시작 시 기존 유니크 키를 하나의 ALTER TABLE로 교체합니다. 이미 이전 동기화에서 덮어써진 데이터는 백업에서 복원해야 합니다. 과거 수동 마이그레이션 SQL을 최신 마이그레이션 이후에 다시 실행하지 마세요.
