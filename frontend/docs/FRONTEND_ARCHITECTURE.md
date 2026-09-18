# Frontend Architecture

화면 동작은 [MOIM_PAGE_SPEC.md](MOIM_PAGE_SPEC.md), 서버 연동은 [FRONTEND_CONTRACTS.md](FRONTEND_CONTRACTS.md)를 기준으로 한다. 이 문서는 코드 배치와 책임을 정의한다.

## Structure

```text
src/
├─ app/
│  ├─ router/
│  ├─ providers/
│  ├─ guards/
│  └─ pages/             # 여러 도메인을 조합하는 라우트 페이지
├─ domains/
│  ├─ auth/
│  ├─ user/
│  ├─ calendar/
│  ├─ participant/
│  └─ vote/
├─ shared/
│  ├─ api/
│  ├─ socket/
│  ├─ ui/
│  ├─ hooks/
│  ├─ utils/
│  ├─ constants/
│  └─ types/
└─ main.tsx
```

실제로 필요한 폴더만 만든다. `admin`은 백엔드 확장 후 추가한다. 도메인 내부는 필요에 따라 `api/`, `model/`, `hooks/`, `ui/`, `pages/`, `index.ts`를 둔다. 한 도메인만 사용하는 페이지는 해당 도메인의 `pages/`에 둘 수 있다.

## Responsibilities

| 영역         | 책임                                                                     |
| ------------ | ------------------------------------------------------------------------ |
| app          | Router, Provider, Guard, 앱 초기화, 도메인 간 연결·페이지 조합           |
| auth         | OAuth, 회원 인증 세션, 토큰 갱신·로그아웃                                |
| user         | 로그인 응답의 표시용 사용자 정보. 프로필 수정 API가 있다고 가정하지 않음 |
| calendar     | 캘린더 생성·조회·수정·마감·삭제, 공휴일 조회 및 날짜 주석                |
| participant  | 캘린더별 참가 세션, 참여·재입장·강퇴·탈퇴, 참가자 목록·온라인 표시       |
| vote         | 날짜별 투표, 편집본, 저장, 현황·집계                                     |
| shared       | 도메인을 모르는 HTTP·Socket transport, 범용 UI·유틸                      |
| admin (후속) | 관리자 인증·API 계약 확정 후 운영 화면 구현                              |

공휴일 데이터는 `calendar`가 소유한다. 투표 UI에는 페이지에서 필요한 날짜 주석을 전달한다. 범용 달력 UI는 공휴일 API를 직접 호출하지 않는다.

## Dependency Rules

```text
main → app → domain pages / ui / hooks → domain api / model → shared
```

- `shared`는 어떤 도메인도 참조하지 않는다. 도메인은 `app`을 참조하지 않는다.
- 서로 다른 도메인을 조합하는 코드와 hook은 `app/pages` 또는 `app/providers`에 둔다. 도메인끼리 직접 import하지 않는다.
- 도메인 외부에서는 해당 `index.ts`로 공개한 API만 사용한다. 도메인 내부에서는 자기 `index.ts`를 거치지 않는다.
- 조합 페이지는 도메인 기능을 연결한다. HTTP 요청 구현, 인증 정책, 투표 집계 로직을 페이지에 복제하지 않는다.
- 도메인 API는 wire DTO와 필요한 UI 모델 변환을 담당한다. 동일 목적의 모델을 이유 없이 다시 만들지 않는다.

예: `app/pages/CalendarDetailPage`는 calendar의 조회·설정 UI, participant의 참가 세션·목록, vote의 편집·현황 UI를 각 공개 진입점에서 조합한다. slug, 참가자 UUID, 관리 가능 여부, 필요한 callback을 전달한다. vote가 calendar 내부 파일을 import하거나 shared가 auth store를 import하지 않는다.

공통 HTTP transport는 헤더·credentials·오류 해석 등 기계적 처리를 한다. 토큰 공급·회원 갱신 함수는 app provider에서 연결한다. Main/Participant 요청 구분은 호출자가 명시하고, shared가 URL 문자열로 권한을 추측하지 않는다.

## State Ownership

| 상태                                      | 소유·저장 방식                                                  |
| ----------------------------------------- | --------------------------------------------------------------- |
| 서버에서 확인한 캘린더·참가자·투표·공휴일 | 해당 도메인의 TanStack Query 캐시                               |
| 저장 전 폼·투표 선택                      | 해당 화면 또는 도메인 편집 상태. Query 응답과 별도 관리         |
| 합계·투표율 표시·후보 정렬                | 캐시로부터 계산. 별도 갱신 원본을 만들지 않음                   |
| 회원 인증 상태                            | auth의 세션 상태와 단일 refresh 작업                            |
| 캘린더별 참가 토큰                        | participant의 세션 상태. 보존·정리는 계약 문서 기준             |
| 프로필 표시용 사본                        | user가 소유. 서버의 최신 프로필 조회를 대신한다고 가정하지 않음 |
| 접속 상태·온라인 사용자                   | participant의 일시 상태. 투표 API 상태와 구분                   |
| 탭·모달·저장 중 상태                      | 화면 상태. 탭은 URL query로 표현                                |

Zustand는 필수 도구가 아니다. 실제 화면 간 클라이언트 상태 공유가 필요할 때만 사용하고 Query 캐시를 복제하지 않는다.

## Socket Lifecycle

연결 transport는 `shared/socket`, 연결 생성·교체·해제와 도메인 구독 조립은 app의 상세 페이지 수명에 맞춘다. 동시에 열린 상세 페이지 하나에는 해당 slug·참가 토큰의 연결 하나를 유지한다. 각 도메인은 자기 query key와 이벤트 처리 함수를 공개한다. 상세 페이지를 나가면 listener와 연결을 정리한다. 이벤트별 재조회·편집본 보호는 계약 문서를 따른다.

## 기술 선택과 실행 준비

현재 구현은 React 19 + TypeScript, Vite 7, React Router 7, TanStack Query 5, Socket.IO client, React Hook Form + Zod, Tailwind CSS 4, Vitest와 npm을 사용한다. 페이지 스타일은 Tailwind 유틸리티로 작성하고 공통 토큰·전역 기본값·애니메이션은 `src/shared/styles/tailwind.css`에서 관리한다.

개발 서버는 `npm run dev`, 타입 검사는 `npm run typecheck`, 회귀 테스트는 `npm test`, production build는 `npm run build`로 실행한다. 작업 범위에 맞는 검증을 실행하고 실행하지 않은 명령을 완료로 기록하지 않는다.

API/Socket 주소와 공개 설정은 프론트 환경 변수로 분리한다. 백엔드 비밀키나 운영자 토큰을 프론트 설정에 포함하지 않는다. 로컬 origin·credentials·OAuth 복귀 주소의 조건은 계약 문서를 따른다.
