# Frontend Contracts

이 문서의 확인·동의·재시도 선택은 별도 언급이 없으면 앱 사용자의 화면 동작을 뜻한다. 해당 UI 구현을 시작하기 위한 에이전트 승인 요구가 아니다. 실제 데이터나 운영 환경을 변경하는 에이전트 작업의 승인 조건을 대체하지 않는다.

2026-09-09 기준 calendar-backend의 실제 route·controller·validation을 바탕으로 한다. 화면 행동은 [페이지 명세](MOIM_PAGE_SPEC.md), 배치는 [아키텍처](FRONTEND_ARCHITECTURE.md)를 따른다. 이 문서는 백엔드 기능 추가를 지시하지 않는다. 이후 API 변경 시 관련 항목과 테스트를 함께 갱신한다.

## 1. HTTP와 현재 지원 범위

API prefix는 `/api/v1`이다. 아래 표의 경로는 prefix 이후 경로다. 응답 전체를 공통 `data` 필드로 감싸는 형태가 아니므로 endpoint별 DTO를 사용한다.

| 요청                                                    | 인증                    | 주요 계약                                                                                        |
| ------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| GET `/auth/google`                                      | 없음                    | 브라우저 이동으로 OAuth 시작                                                                     |
| GET `/auth/google/callback?code=...&state=...`          | 쿠키                    | 로그인 `{accessToken,user,isNewUser}` 또는 `{signupToken}`                                       |
| POST `/auth/register`                                   | signupToken             | `{signupToken,isTermsAgreed:true}` → `{accessToken,user}`                                        |
| POST `/auth/refresh`                                    | Refresh 쿠키            | `{accessToken}`. 사용자 프로필은 반환하지 않음                                                   |
| POST `/auth/logout`                                     | Refresh 쿠키            | 회원 세션 종료                                                                                   |
| POST `/calendars`                                       | Main                    | `{title,description?,hostNickname,start_date,end_date,vote_start_date,vote_end_date}` → `{calendar,shareUrl,participantToken}` |
| GET `/calendars/my`                                     | Main                    | 내가 만든 목록 `{calendars,count}`. 각 항목에 `participant_count` 포함                            |
| GET `/calendars/:slug`                                  | 없음                    | `{calendar}`                                                                                     |
| PATCH `/calendars/:slug`                                | Main + DB owner         | 수정 후 `{calendar}`. 빈 수정 요청은 보내지 않음                                                 |
| DELETE `/calendars/:slug`                               | Main + DB owner         | 삭제                                                                                             |
| POST `/calendars/:slug/close`                           | Main + DB owner         | 마감                                                                                             |
| POST `/calendars/:slug/participants`                    | 회원 Main / 비회원 없음 | 회원 `{nickname,profileType:account\|alias}`, 비회원 `{nickname,password}` → `{participant,participantToken}` |
| POST `/calendars/:slug/participants/login`              | 회원 Main / 비회원 없음 | 회원 `{}`, 비회원 `{nickname,password}` → `{participant,participantToken}`                       |
| GET `/calendars/:slug/participants`                     | 없음                    | `{participants,count}`                                                                           |
| GET `/calendars/:slug/participants/reconciliation`      | Main + guest header     | 익명 게스트와 현재 계정 참가자의 상태·투표 수 비교                                                |
| POST `/calendars/:slug/participants/reconciliation`     | Main + guest header     | 선택한 한쪽 투표 기록을 유지하거나 게스트 프로필을 계정에 연결하고 새 Participant Token 발급       |
| GET `/calendars/joined`                                 | Main                    | 내가 방장 또는 계정/별명으로 참여한 목록 `{calendars,count}`. 각 항목에 현재 참여 역할·프로필 포함 |
| DELETE `/calendars/:slug/participants/self`             | Participant             | 일반 참가자 탈퇴                                                                                 |
| DELETE `/calendars/:slug/participants/:participantUuid` | Main + DB owner         | 강퇴                                                                                             |
| POST `/calendars/:slug/votes`                           | Participant             | `{votes:[{date,voteType}]}` → `{votes,votedCount}`                                               |
| GET `/calendars/:slug/votes`                            | 없음                    | `{calendar,voteStatus}`                                                                          |
| GET `/calendars/:slug/votes/:participantUuid`           | 없음                    | `{participant,votes,voteCount}`                                                                  |
| GET `/date-infos/:year`                                 | 없음                    | 공휴일·기념일 배열                                                                               |

인증은 `Authorization: Bearer ...`를 사용한다. 회원 재입장 요청에 Participant Token을 보내지 않는다. 사용자 프로필 조회·수정, 관리자 인증·관리·통계·로그 API는 현재 없다. 해당 기능을 현재 API처럼 호출하지 않는다.

### DTO와 식별자

- 캘린더는 `slug`, 참가자 응답은 `uuid`, 회원은 `user_uuid`를 사용한다.
- `calendar.hostParticipantUuid`는 참가자 UUID다. 회원 UUID와 비교하지 않는다.
- 관리 UI는 현재 회원으로 재입장해 확인한 참가자 UUID와 `hostParticipantUuid`가 일치할 때 표시한다. Main Token의 `role: host`만으로 모든 캘린더의 방장으로 판단하지 않는다. 최종 권한은 서버 응답을 따른다.
- 참가자 로그인 응답에는 `role`이 없을 수 있다. 일반 참가자 목록에도 role을 가정하지 않는다.
- 투표 제출은 `date/voteType`, 개인 투표 조회는 `date_value/vote_type`, 전체 현황은 날짜별 `votes` 배열이다. 도메인 API에서 편집 모델로 변환한다.
- 전체 현황의 `participant_id`는 숫자 DB ID다. 참가자 UUID로 변환했다고 가정하지 않는다. 개인 투표 API는 참가자 목록의 `uuid`로 요청한다.
- 백엔드 TypeScript의 `Date` 타입을 그대로 브라우저 DTO에 복사하지 않는다. JSON timestamp는 문자열이다.

## 2. 인증 세션과 OAuth

### 저장·복원

- Main Access Token은 auth 메모리 상태에서 관리하고 localStorage/sessionStorage에 저장하지 않는다. 앱 시작 시 쿠키 기반 refresh를 한 번 수행해 복원한다.
- 회원 상태는 `복원 중 / 인증됨 / 비로그인 / 일시적 복원 실패`를 구분한다. 복원 중에는 로그인 화면으로 성급하게 redirect하지 않는다.
- Participant Token은 slug별로 메모리와 sessionStorage에 보존한다. 회원 연결 여부와 user UUID를 함께 구분한다. 탭을 닫은 뒤에는 회원 자동 재입장 또는 비회원 비밀번호 재입장을 사용한다. 비밀번호는 보존하지 않는다.
- 로그인 회원의 `alias` 참여는 별명만 공개 화면에 사용하고 `user_id`에는 연결한다. 따라서 비밀번호 없이 Main Token으로 재입장할 수 있다. `alias`는 서버와도 연결되지 않는 완전 익명을 뜻하지 않는다.
- 익명 게스트 세션을 가진 상태에서 로그인하면 상세 화면의 편집·Socket 연결을 잠시 막고 참여 정보 정리를 먼저 수행한다. Main Token은 `Authorization`, 기존 게스트 토큰은 `X-Participant-Token`으로 보낸다. 기존 계정 참가자가 있으면 계정 또는 게스트 투표 중 하나의 전체 기록만 남기며 날짜별로 병합하지 않는다. 단, 마감되었거나 KST 기준 투표 기간이 끝난 뒤에는 결과를 바꾸는 기록 삭제·교체를 허용하지 않고 기존 계정 참여로 복구한다. 기존 계정 참가자가 없으면 투표를 변경하지 않고 게스트 기록을 계정 이름(`account`) 또는 현재 별명(`alias`)으로 연결할 수 있다.
- 저장된 참가자 정보는 UI 복원용이다. JWT 만료·slug를 확인하고 최신 캘린더·참가자 조회 및 인증된 요청으로 상태를 확인한다. 토큰 decode를 서버 권한 검증으로 취급하지 않는다.
- 로그인 응답의 표시용 프로필은 user UUID와 함께 sessionStorage에 보존할 수 있다. refresh로 확인한 회원 UUID와 다르면 버린다. 표시용 사본이 없으면 기본 사용자 표시를 쓰고, 미지원 `/me` API를 만들지 않는다. 다른 탭에서도 최신 프로필을 복원하는 기능은 백엔드 확장 대상이다.
- 명시적 로그아웃은 서버 logout을 요청하고 앱의 회원·참가 토큰, 프로필 사본, 회원별 캐시와 소켓을 정리한다. 참가 DB 데이터를 삭제하는 동작은 아니다. 서버 logout 실패 시 서버 세션 종료를 성공으로 표시하지 않는다.
- 회원 인증 만료 처리에서는 해당 회원에 연결된 참가 세션과 개인 캐시를 정리한다. 독립적인 비회원 참가 세션까지 오류로 지우지 않는다. 다른 계정 로그인 시 이전 회원 참가 세션을 재사용하지 않는다.

### OAuth 흐름

1. 복귀할 내부 경로를 보존하고 백엔드 `GET /auth/google`로 브라우저를 이동한다. 앱 내부의 허용된 경로만 복귀 대상으로 사용한다.
2. Google은 프론트 `/auth/callback`으로 돌아온다. 이 페이지에서 `code`, `state`를 읽어 백엔드 callback API에 credentials를 포함해 전달한다. OAuth state는 백엔드 쿠키와 검증하며 프론트가 대체하지 않는다.
3. 한 code의 교환은 한 번만 수행한다. StrictMode 재실행·컴포넌트 재마운트로 중복 제출하지 않도록 auth가 진행 중 작업을 공유한다. 요청 후 URL의 code/state를 제거하고, 실패·결과 불명 시 같은 code를 무한 재전송하지 않는다.
4. `{accessToken,user}`이면 인증을 설정하고 보존한 경로로 복귀한다. 복귀 경로가 없으면 홈이다.
5. `{signupToken}`이면 `/signup`으로 이동한다. `SIGNUP_MODE=pending`에서 이 응답을 받으며, `immediate`는 신규 사용자도 바로 로그인 응답을 받는다. 프론트는 두 응답을 처리한다. 약관 확인을 가입 전 필수로 제공하는 배포는 백엔드 pending 설정이 필요하다.
6. Google 취소·state 누락·교환 실패는 이유와 로그인 재시작 버튼을 보여준다.

현재 signupToken은 프로필이 담긴 JWT가 아니라 서버에 저장된 가입 정보의 임의 토큰이다. callback의 가입 대기 응답에는 이름·프로필이 없으므로 가입 전 계정 정보 표시를 구현하지 않는다. 토큰은 짧은 가입 흐름의 메모리에만 두며 새로고침·만료 시 로그인 재시작을 안내한다. 유효기간은 현재 10분이고 한 번 소비되므로 가입 요청 실패를 무조건 자동 재전송하지 않는다.

이용약관과 개인정보 동의는 화면에서 각각 확인하되 두 항목을 충족하면 현재 API의 단일 `isTermsAgreed: true`로 보낸다. 항목별 동의 이력 저장 기능이 있다고 표시하지 않는다.

### 401과 재시도

| 상황                          | 처리                                                                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Main 인증이 필요한 요청의 401 | 단일 refresh 작업을 공유하고 새 토큰으로 원 요청을 최대 한 번 재시도                                                                 |
| refresh의 401                 | 회원 인증 만료 처리. refresh 자신은 갱신·재시도 대상에서 제외                                                                        |
| refresh의 네트워크 오류·5xx   | 일시 실패 UI와 재시도 제공. 계정 탈퇴나 확정 로그아웃으로 해석하지 않음                                                              |
| Participant 요청의 401        | 해당 slug 세션 재검증. 회원은 Main 기반 재입장을 한 번 시도, 비회원은 재입장 화면. Main refresh로 Participant Token을 교체할 수 없음 |
| 비회원 재입장 비밀번호 오류   | 폼 오류 표시. 회원 refresh·전체 로그아웃을 호출하지 않음                                                                             |
| OAuth·signup 오류             | 해당 화면에서 처리. 공통 refresh에 넣지 않음                                                                                         |
| 403                           | 권한 없음 표시·최신 권한 재확인. refresh 반복 금지                                                                                   |
| 404                           | 캘린더/참가자/경로 맥락에 따라 분기. 모든 404를 캘린더 삭제로 보지 않음                                                              |
| 409                           | 참가 중복·닉네임 충돌 등을 폼에서 처리                                                                                               |
| 429                           | 잠시 후 재시도 안내. 즉시 반복 요청하지 않음                                                                                         |

오류 본문은 주로 `{success:false,message,code?,details?}`다. code는 선택적이므로 요청 맥락·HTTP 상태를 함께 사용한다. mutation의 네트워크 실패는 처리 결과가 불명확할 수 있다. 최신 데이터를 확인하고 사용자가 재시도하도록 하며 임의의 무한 자동 재시도를 금지한다.

### 배포·로컬 연동

callback·refresh·logout·register 요청은 credentials를 포함한다. 프론트 origin은 백엔드 `CLIENT_URL`과 일치해야 하고 Google 복귀 주소는 `<CLIENT_URL>/auth/callback`이다. 프론트 프록시를 사용하면 OAuth 시작부터 callback까지 쿠키가 동일한 API 호스트·경로로 전달되도록 구성한다.

현재 Refresh 쿠키는 HttpOnly이고 production에서 Secure다. 완전히 다른 사이트 간 쿠키 전송이 지원된다고 가정하지 않는다. API·Socket URL은 각각 공개 환경 설정으로 공급한다.

실제 배포 origin의 OAuth·refresh 브라우저 검증은 배포 준비 또는 인증·쿠키·origin 설정 변경의 검증 항목이다. 일반 화면 변경마다 요구하지 않는다.

환경이 없으면 로컬에서 가능한 검증을 수행하고 배포 검증을 미실행 항목으로 남긴다. 완료 판정은 [testing.md](agents/testing.md)를 따른다. 이 요구는 배포나 운영 설정 변경에 대한 승인을 부여하지 않는다.

## 3. 날짜와 입력 검증

| 값                                                             | 처리                                                |
| -------------------------------------------------------------- | --------------------------------------------------- |
| start_date, end_date, vote_start_date, vote_end_date, 투표 date/date_value | 유효한 `YYYY-MM-DD`. 시간대 변환 없이 날짜로 사용   |
| 공휴일 locationDate                                            | `YYYYMMDD`를 날짜 문자열로 정규화. 시간대 변환 없음 |
| created_at, joined_at, expired_at, updatedAt, 이벤트 timestamp | UTC timestamp를 `Asia/Seoul`로 표시                 |

브라우저 지역과 무관하게 표시 시간대는 KST다. 날짜 전용 값을 `new Date()`와 `toISOString()` 사이에서 왕복시켜 날짜를 결정하지 않는다.

제목은 trim 후 1~100자, 방장·참가 닉네임은 1~20자, 비회원 비밀번호는 trim 후 4~50자다. 설명은 선택이다. 후보 날짜와 투표 기간은 각각 시작일 ≤ 종료일이고 양 끝을 포함해 최대 366일이다. 수정 시 기존 값과 합친 최종 범위를 검증한다. `expired_at`은 서버가 `vote_end_date + 30일`로 계산한다. 백엔드가 허용하지 않는 추가 기간 제한을 임의로 넣지 않는다.

투표는 실제 현황의 날짜 옵션 중 `is_enabled=true`만 가능하다. 날짜 중복과 유효하지 않은 날짜를 거부한다. 서버는 `vote_start_date ≤ KST 오늘 ≤ vote_end_date && is_closed=false`일 때만 저장을 허용하며 자동 마감도 KST 날짜를 사용한다. 프론트 타이머는 보조 표시일 뿐 최신 서버 응답이 최종 기준이다.

## 4. 투표 편집과 저장

현재 구현은 날짜별 `가능(available) / 미정(maybe) / 불가능(unavailable) / 미투표(항목 없음)`를 구분한다. 자동 저장 없이 저장 버튼으로 제출한다.

```json
{
  "votes": [
    { "date": "2026-09-10", "voteType": "available" },
    { "date": "2026-09-11", "voteType": "maybe" },
    { "date": "2026-09-12", "voteType": "unavailable" }
  ]
}
```

한 요청은 참가자의 전체 목록을 교체한다. 누락 날짜는 취소이고 `{"votes":[]}`는 전체 취소다. 불가능과 미투표를 합치지 않는다. 제출 응답 `votedCount`는 교체 후 저장된 항목 수다.

- 진입 시 개인 투표를 조회하고 편집본을 만든다. 일반 refetch나 타인의 투표 이벤트가 dirty 편집본을 덮어쓰지 않는다.
- 저장 중에는 추가 저장과 선택 변경을 막아 제출 순서를 직렬화한다. 성공 시 제출본을 저장 기준으로 확정하고 관련 조회를 갱신한다. 실패 시 편집본을 유지한다.
- 초기화는 편집본만 비운다. 저장할 때 전체 취소되며 화면을 떠나면 미저장 변경 확인을 제공한다.
- 다른 탭 등에서 내 투표가 바뀐 것을 확인하면 충돌 안내와 다시 불러오기/현재 편집본 저장 선택을 제공한다. 백엔드에는 버전 기반 충돌 거부가 없으며 마지막으로 처리된 전체 제출이 저장된다.
- 기간·활성 날짜가 변경되면 저장을 잠시 막고 최신 옵션을 조회한다. 제외된 선택을 안내하고 유효한 편집본만 다시 확인받아 저장한다. 자동으로 재제출하지 않는다.
- 편집 중 마감되면 입력·저장을 막고 미저장 안내를 표시한다. 삭제되면 편집·소켓을 종료하고 삭제 안내로 이동한다.

## 5. Query 캐시와 Socket

query key는 도메인별로 소유한다. 캘린더 상세·참가자 목록·투표 현황은 slug, 개인 투표는 slug와 participant UUID, 내 캘린더는 user UUID, 공휴일은 연도를 포함한다. 세션 전환 시 개인 캐시를 제거한다. 응답 형태가 다른 조회는 같은 key로 합치지 않는다.

Socket은 Participant Token으로 `transports: ['websocket'], auth: {token}` 연결한다. 연결 성공마다 인자 없이 `joinCalendarRoom`을 보낸다. 캘린더 이동·토큰 교체 시 이전 listener와 연결을 해제한다.

기본 정책은 이벤트를 계기로 관련 Query를 invalidate/refetch하는 것이다. 서버 이벤트에는 순서 보장을 위한 revision이 없으므로 도착한 payload로 편집본과 여러 캐시를 무조건 덮어쓰지 않는다.

| 이벤트/동작              | 처리 대상                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| voteUpdated              | 전체 현황·참가자 통계·현재 열람 중인 개인 투표 재조회. 이벤트의 식별자 필드명은 `participantUuId`임 |
| calendarUpdated          | 상세·내 목록 갱신. 기간 변경 가능성이 있으므로 날짜 현황·개인 투표·참가자 통계 재조회               |
| calendarClosed           | 즉시 쓰기 UI 중지, 상세·목록·최종 현황 재조회                                                       |
| calendarDeleted          | 해당 slug 연결·캐시 정리, 삭제 안내 표시, 내 목록 갱신                                              |
| onlineUsers              | `{sub,nickname,role}[]` 온라인 스냅샷 수신. sub는 participant UUID                                  |
| userOnline / userOffline | UUID 기준 접속 표시 갱신. 참가 DB 등록·삭제로 해석하지 않음                                         |
| participantsUpdated      | 계정·게스트 참여 정보 정리 후 참가자·투표 현황 재조회                                              |
| 참가·탈퇴·강퇴 API 성공  | 해당 slug 참가자·현황·개인 투표 및 필요한 목록 재조회                                               |
| 재연결 성공              | 방 재입장 후 상세·참가자·현황·개인 투표 재조회                                                      |

접속 끊김 동안 온라인 표시는 확인 중으로 바꾼다. 현재 서버는 같은 참가자의 여러 연결 중 하나가 끊겨도 userOffline을 보낼 수 있어 온라인 목록은 참고 정보다. 정확한 다중 탭 접속 집계를 보장한다고 표시하지 않는다.

현재 참가자 등록·삭제 전용 이벤트는 없다. 참가자 탭 진입과 창 포커스 복귀 때 목록을 재조회한다. 일반 참가자 목록의 모든 변화를 즉시 받는다고 가정하지 않는다.

강퇴는 전용 이벤트 없이 서버가 소켓을 끊는다. 끊김 자체를 강퇴 확정으로 보지 않는다. 최신 캘린더·참가자 상태를 확인하고, 삭제면 삭제 안내, 참가자가 없으면 해당 세션을 지우고 재입장 안내, 유효하면 연결 재시도를 제공한다. `io server disconnect`는 상태 확인 없이 무조건 반복 연결하지 않는다. 비회원도 HTTP로 최신 참가자 존재를 확인할 수 있으며, 서버가 특정 강퇴 사유를 반환한다고 가정하지 않는다.

## 6. 연동 확인의 근거

백엔드 저장소 상대 경로 기준: `src/routes`, `src/controllers`, `src/middlewares/validation.ts`, `src/middlewares/auth.ts`, `src/sockets/socket.container.ts`, `src/sockets/socket.controller.ts`, `src/services/auth.service.ts`, `src/repositories/redisSignup.repository.ts`, `src/repositories/vote.repository.ts`.

Swagger는 구현 시 참고하되 실제 controller·validation과 다르면 불일치를 기록하고 현재 구현으로 확인한다. 프론트 화면 가드는 UX용이며 백엔드의 공개 조회 API를 비공개로 바꾸는 보안 경계가 아니다.
