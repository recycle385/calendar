# k6 Load Tests

실시간 일정 투표 서비스의 동시성 오류 재현과 조회 병목 확인에 사용한 k6 스크립트입니다.

## 구성

- `concurrency.js`: 같은 캘린더에서 20명의 참가자가 동시에 1회 투표합니다. 최대 처리량 측정보다 동시 write 충돌과 deadlock 재현이 목적입니다.
- `read-stress.js`: 조회 VU를 100에서 300까지 높여 예상 초기 트래픽을 초과한 상황의 조회 병목을 확인합니다.
- `write-load.js`: 참가자 생성 후 투표까지 이어지는 end-to-end write 부하를 확인합니다.
- `socket-broadcast.js`: Socket.IO 연결, room join, `voteUpdated` 수신 여부를 확인하는 부하/스모크 테스트입니다.
- `common.js`: 테스트용 캘린더 생성/삭제와 환경변수 처리를 담당합니다.

## 실행 전 환경변수

토큰은 파일에 저장하지 않고 실행 환경에서 주입합니다.

### Bash

```bash
export HOST_ACCESS_TOKEN="your-host-access-token"
export BASE_URL="http://localhost:3000/api/v1"
export WS_URL="ws://localhost:3000/socket.io/?EIO=4&transport=websocket"
```

### PowerShell

```powershell
$env:HOST_ACCESS_TOKEN="your-host-access-token"
$env:BASE_URL="http://localhost:3000/api/v1"
$env:WS_URL="ws://localhost:3000/socket.io/?EIO=4&transport=websocket"
```

## 실행

저장소 루트에서 실행하는 기준입니다.

```bash
k6 run back-end/tests/k6/concurrency.js
k6 run back-end/tests/k6/read-stress.js
k6 run back-end/tests/k6/write-load.js
k6 run back-end/tests/k6/socket-broadcast.js
```

과거 측정 결과와 해석은 `docs/benchmarks/k6-results.md`에 정리합니다.
