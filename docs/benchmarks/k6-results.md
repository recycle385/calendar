# k6 Benchmark Results

이 문서는 프로젝트에서 실제 사용한 k6 시나리오와 당시 측정 결과를 정리합니다.

테스트 목적은 두 종류로 구분했습니다.

1. **동시 투표 테스트**: 예상 서비스 규모에서 순간적인 동시 write가 겹칠 때 deadlock과 요청 실패가 발생하는지 재현
2. **조회 스트레스 테스트**: 예상 초기 동시 접속 규모를 크게 초과한 부하를 걸어 조회 병목과 성능 여유를 확인

초기 서비스는 동시 접속 약 20~30명, 많을 경우 50명 안팎을 가정했습니다. 따라서 20명이 같은 캘린더에 정확히 동시에 투표하는 조건은 일반적인 접속보다 강한 write 충돌 조건으로 잡았고, 조회는 그보다 넉넉하게 최대 300 VU까지 높였습니다.

---

## 1. 동시 투표 deadlock 재현

### 목적

같은 캘린더에서 여러 참가자의 투표가 동시에 저장될 때 DB deadlock과 요청 실패가 발생하는지 확인했습니다.

### 조건

- 도구: k6
- VU: 20
- executor: `per-vu-iterations`
- 각 VU: 1 iteration
- 참가자: setup 단계에서 20명 사전 생성
- 각 VU는 서로 다른 Participant Token 사용
- 대상: `POST /api/v1/calendars/:slug/votes`
- 같은 캘린더에 동시에 투표

이 테스트는 처리량 한계를 측정하는 벤치마크가 아니라 **동시 write 충돌을 의도적으로 재현하는 테스트**입니다. 요청 표본이 20개이므로 p95보다 성공/실패 여부와 DB deadlock 로그를 핵심 지표로 봤습니다.

### 당시 문제

초기 복수 투표 저장은 기존 투표를 삭제한 뒤 다시 INSERT하는 구조였고, `date_option_id` 접근 순서도 고정되어 있지 않았습니다. 동시 요청에서 `Deadlock found when trying to get lock`이 발생했습니다.

### 당시 개선

- DB 호출 전 `date_option_id` 오름차순 정렬
- 전체 `DELETE → INSERT` 방식 대신 Bulk UPSERT로 변경

이 두 변경을 함께 적용한 뒤 같은 20 VU 조건으로 다시 측정했습니다.

| 지표 | Before | After |
| --- | ---: | ---: |
| 투표 성공 | 8 / 20 | **20 / 20** |
| 성공률 | 40% | **100%** |
| 실패율 | 60% | **0%** |
| p95 | 324.79ms | **139.8ms** |

> `60% → 0%`는 당시 구조에서 동일 조건으로 재현한 요청 실패율입니다. 이후 기능 확장 과정에서 현재 투표 저장 구조는 명시적 lock ordering, 기존 PK 기준 삭제, Bulk INSERT, deadlock retry 방식으로 다시 변경되었습니다.

원본 k6 출력:

- [`results/concurrency-before.txt`](./results/concurrency-before.txt)
- [`results/concurrency-after.txt`](./results/concurrency-after.txt)

---

## 2. 투표 현황 조회 스트레스 테스트

### 목적

예상 초기 트래픽보다 높은 부하에서 투표 현황 조회의 DB 병목을 드러내고, 조회 구조 변경 전후를 비교했습니다.

### 조건

- 도구: k6
- 대상: `GET /api/v1/calendars/:slug/votes`
- 5초 동안 100 VU까지 증가
- 다음 15초 동안 최대 300 VU까지 증가
- 마지막 10초 동안 0 VU로 감소
- iteration 사이 `sleep(0.5)`

### 개선 내용

- 날짜 옵션/선택 투표 반복 조회를 `IN` 절 일괄 조회로 변경
- 조회 결과를 `Map` 기반으로 조립
- 참가자별 COUNT를 메인 조회에서 분리해 별도 집계 쿼리로 처리

직접적인 개선 전후 로그를 비교했습니다.

| 지표 | Before | After |
| --- | ---: | ---: |
| 평균 응답시간 | 1.10s | **262.37ms** |
| p95 | 2.36s | **742.35ms** |
| 처리량 | 111.65 req/s | **208.96 req/s** |
| HTTP 요청 실패율 | 0% | **0%** |

평균 응답시간은 약 **76% 단축**됐고 처리량은 약 **87% 증가**했습니다.

> 더 이른 초기 baseline에서 평균 1.24s, p95 6.52s, 약 105.6 req/s도 관측했지만, 위 표는 포트폴리오의 조회 구조 개선과 직접 대응되는 전후 테스트를 사용했습니다.

원본 k6 출력:

- [`results/read-before.txt`](./results/read-before.txt)
- [`results/read-after.txt`](./results/read-after.txt)

---

## 해석 시 주의사항

- `concurrency.js`는 동시성 오류 재현용입니다. 20개 요청만으로 일반적인 latency 분포나 최대 처리량을 주장하지 않습니다.
- `read-stress.js`의 300 VU는 예상 초기 사용자 수를 재현한 값이 아니라 병목을 드러내기 위한 스트레스 조건입니다.
- Before/After 비교는 같은 종류의 시나리오와 동일한 부하 조건에서 측정한 로그를 기준으로 합니다.
- 원본 결과에는 인증 토큰이나 API Key를 포함하지 않았습니다.
