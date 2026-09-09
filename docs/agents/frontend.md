# Frontend

- 화면 동작은 [페이지 명세](../MOIM_PAGE_SPEC.md), 구조는 [아키텍처](../FRONTEND_ARCHITECTURE.md), 서버 연동은 [계약 문서](../FRONTEND_CONTRACTS.md)의 해당 항목을 따름.
- `shared`에서 domain, domain에서 `app` import 금지함.
- 다른 domain 내부 파일 직접 import 금지함. 허용되는 조합과 공개 진입점은 구조 문서에 따름.
- 서버에서 확인한 데이터는 TanStack Query에서 관리함. 편집본·인증 세션·소켓 접속 상태와 구분함.
- 서버 응답, 화면 합계, 편집본을 같은 store에 모두 복제하지 않음.
- socket transport와 이벤트 의미·캐시 처리 책임을 구분함.
- 재사용 예상만으로 domain 코드를 `shared`로 이동하지 않음.
- 모든 domain에 동일한 빈 폴더를 미리 만들지 않음.
- 실제 API가 없는 후속 화면은 현재 라우트·메뉴에 노출하지 않음. 별도 요청한 시안·Mock은 실제 연동 완료와 구분함.
- 미정 기술 선택은 최초 구성 시 기존 프론트 설정을 확인하고 결정 근거·실행 명령을 기록함. 이미 선택한 도구와 같은 목적의 도구를 중복 도입하지 않음.
