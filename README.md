# Calendar Project

팀/모임 일정 조율을 위한 링크 기반 일정 투표 서비스입니다.

방장이 캘린더를 생성하고 링크를 공유하면, 참여자들이 가능한 날짜를 투표합니다.
백엔드는 참여자 권한 관리, 투표 집계, 실시간 반영, 자동 마감/정리까지 담당합니다.

## 1. 이 서비스가 해결하는 문제

- 여러 사람이 공통 가능한 날짜를 정할 때 발생하는 반복 커뮤니케이션을 줄입니다.
- 링크 하나로 참여/투표/현황 확인을 끝낼 수 있게 합니다.
- 기간 종료, 만료 데이터 정리 같은 운영 작업을 자동화합니다.

## 2. 핵심 기능

- Google OAuth 기반 회원 로그인
- 캘린더 생성/수정/삭제/마감 (방장 권한)
- 회원/비회원 참가자 등록 및 로그인
- 날짜별 투표 제출/수정 및 전체 현황 조회
- Socket.IO 기반 실시간 브로드캐스트
- Cron 기반 자동 마감/만료 캘린더 삭제
- 공휴일/기념일(DateInfo) 적재 및 조회 API
- Swagger API 문서 제공

## 3. 사용자 관점 동작 흐름

1. 방장이 로그인 후 캘린더를 생성합니다.
2. 시스템이 공유 링크(slug)와 방장 participant 토큰을 발급합니다.
3. 참여자가 링크로 접속해 참가 등록 후 날짜 투표를 진행합니다.
4. 투표 결과는 실시간으로 전체 참여자에게 반영됩니다.
5. 방장이 수동 마감하거나, 기간 종료 시 자동 마감됩니다.
6. 보관 기간이 지난 캘린더는 자동 삭제됩니다.

## 4. 백엔드 중심 아키텍처 요약

- Framework: Express + TypeScript
- Storage: MySQL
- Cache/Token blacklist: Redis
- Realtime: Socket.IO
- Scheduler: node-cron
- Auth: JWT (access/refresh/participant), Google OAuth
- Docs: Swagger

레이어 구조:

- Controller: 요청/응답 처리
- Service: 비즈니스 로직
- Repository: DB 접근
- Middleware: 인증, 검증, 에러 핸들링, 로깅
- Socket/Cron: 실시간 이벤트, 배치성 운영 자동화

## 5. 주요 도메인 모델

- User: OAuth 회원 정보
- Calendar: 일정 투표 방 (slug, 기간, 상태)
- Participant: 캘린더 참여자(방장/게스트)
- DateOption: 캘린더 내 투표 가능한 날짜 목록
- Vote: 참여자의 날짜별 투표값
- DateInfo: 공휴일/기념일 메타데이터

## 6. API 그룹

- /api/v1/auth: 로그인, 회원가입, 토큰 갱신, 로그아웃
- /api/v1/calendars: 캘린더 생성/조회/수정/삭제/마감
- /api/v1/calendars/:slug/participants: 참가자 등록/로그인/조회/삭제
- /api/v1/calendars/:slug/votes: 투표 제출/조회
- /api/v1/date-infos: 공휴일/기념일 관리
- /api/v1/api-docs: Swagger 문서

## 7. 기술 스택

- Frontend: React, Vite, TypeScript, Tailwind, Socket.IO Client
- Backend: Node.js, Express, TypeScript, Socket.IO, JWT, Joi, Winston
- Infra: MySQL 8, Redis 7, Docker Compose

권장 버전:

- Node.js 20+
- npm 10+

## 8. 프로젝트 구조

```text
Calendar_project/
	back-end/
		src/
			controllers/
			services/
			repositories/
			middlewares/
			routes/
			sockets/
			models/
			config/
	front-end/
		src/
			pages/
			components/
			api/
```

## 9. 빠른 실행 가이드

### 9.1 백엔드

```bash
cd back-end
npm install
npm run dev
```

기본 포트는 환경변수 PORT 기준입니다.

### 9.2 프론트엔드

```bash
cd front-end
npm install
npm run dev
```

기본 개발 포트는 8080이며, /api/v1 및 /socket.io 요청은 로컬 백엔드(3000)로 프록시됩니다.

### 9.3 Docker Compose로 백엔드 인프라 포함 실행

```bash
cd back-end
docker compose up --build
```

## 10. 환경변수

back-end/.env 예시:

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=replace_me
SESSION_SECRET=replace_me

REDIS_URL=redis://127.0.0.1:6379

DB_HOST=127.0.0.1
DB_USER=calendar_user
DB_USER_PASSWORD=calendar_password
DB_NAME=calendar_db
DB_CONNECTION_LIMIT=10

CLIENT_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000

GOOGLE_CLIENT_ID=replace_me
GOOGLE_CLIENT_SECRET=replace_me

GET_REST_DE_INFO=public_data_api_key

SIGNUP_MODE=callback
ENABLE_RATE_LIMIT=true
```

주의:

- OAuth redirect URI와 CLIENT_URL/auth/callback 설정이 일치해야 합니다.
- 필수 환경변수가 누락되면 서버 시작 시 즉시 실패합니다.

## 11. 테스트

```bash
cd back-end
npm test
```

테스트는 별도 테스트 DB/Redis 포트(예: 3307, 6380)를 사용하도록 구성되어 있습니다.

## 12. 운영 자동화

- 매일 자정(KST):
  - 투표 기간 종료 캘린더 자동 마감
- 매일 새벽 4시(KST):
  - 보관 기간 만료 캘린더 자동 삭제
- 매년 12월 1일:
  - 공휴일/기념일 데이터 업데이트
  - 오래된 date-info 정리

운영 서버의 Docker Compose, TLS, GHCR 배포, DB 백업 절차는 [배포 가이드](deploy/README.md)를 참고합니다.

## 13. 한 줄 소개

이 프로젝트는 "링크 기반 일정 투표 + 실시간 반영 + 자동 운영"을 제공하는 협업 일정 조율 플랫폼입니다.
