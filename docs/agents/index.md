# Agent Rules Index

현재 작업과 무관한 문서 읽지 않음.

```text
일반 구현·수정
→ workflow.md

구조 변경·새 domain·dependency 변경
→ architecture.md
→ ../FRONTEND_ARCHITECTURE.md

Frontend 작업
→ frontend.md
→ ../FRONTEND_ARCHITECTURE.md

화면·사용자 흐름 구현
→ ../MOIM_PAGE_SPEC.md의 해당 페이지 및 공통 기능

API·인증·날짜·캐시·소켓 작업
→ ../FRONTEND_CONTRACTS.md의 해당 항목

테스트·검증
→ testing.md

리뷰
→ review.md

Git 작업
→ git.md
```

화면 동작은 페이지 명세, 코드 배치는 구조 문서, 서버 연동은 계약 문서를 기준으로 함.
진행·질문 기준은 workflow.md, 검증·완료 판정은 testing.md, 커밋·push 조건은 git.md에 정의함. 다른 문서에서 같은 규칙을 독립적으로 재정의하지 않음.

API 형식·현재 지원 여부 같은 사실은 해당 백엔드 코드로 확인함. 화면 동작·공개 범위는 페이지 명세, 코드 배치는 아키텍처 문서를 따름.

승인된 범위 안의 표현 오류·오래된 사실은 바로잡음. 제품 정책이나 권한 변경이 필요한 충돌은 기존 요청·지침으로 결정할 수 없는 의존 부분만 확인하고 독립적인 작업을 계속함.

후속 기능의 미정 계약은 해당 기능을 구현할 때 확정함. 현재 범위의 완료를 막는 선행 조건으로 취급하지 않음. 미지원 기능을 임의 API나 운영용 Mock으로 완성 처리하지 않음. 현재 사실의 확인만으로 후속 기능 공개나 백엔드 수정 권한이 생기지 않음.
