# Git

이 규칙은 향후 프론트 저장소의 Git 작업용임. 임시 frontMd 문서 정리에 Git 추적·commit을 추가하지 않음.

- 기존 변경 reset/revert 금지함. 사용자 변경의 편집·보호 기준은 [workflow.md](workflow.md)를 따름.
- 사용자 변경은 임의로 commit하지 않으며, 관련 없는 변경을 포함하지 않음.
- 승인된 구현 작업에서 기능·수정 한 덩어리가 끝나면 commit함. 너무 작은 commit과 여러 기능이 섞인 큰 commit을 피함. 읽기 전용 리뷰·계획 요청을 이유로 파일을 수정하거나 commit하지 않음.
- commit 전 git status·git diff·관련 검증 결과를 확인함. 최소한 컴파일 또는 실행 가능한 상태여야 하며, 깨진 상태로 commit하지 않음. 검증의 적용 범위와 결과 판정은 [testing.md](testing.md)를 따름.
- 메시지는 feat:, fix:, refactor:, docs:, test:, chore: 중 하나를 사용하고 prefix 뒤 내용은 한국어로 작성함.
- 일반 push도 사용자 명시적 허락 없이 진행하지 않음. push가 필요하면 먼저 알림.
- force push 임의 수행 금지함.
- history rewrite 임의 수행 금지함.
- 같은 파일 병렬 수정 금지함.
