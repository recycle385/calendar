# moim frontend

React + TypeScript + Vite 기반 프론트엔드.

Vite, React Router, TanStack Query와 Tailwind CSS v4를 사용한다. 개발 서버는 백엔드 OAuth 복귀 주소와 맞추기 위해 `http://localhost:8080`에서 실행된다.

스타일은 컴포넌트의 Tailwind 유틸리티 클래스로 관리한다. 공통 디자인 토큰과 전역 기본값, 애니메이션은 `src/shared/styles/tailwind.css`에 두며 별도의 페이지 전역 CSS는 사용하지 않는다.

## 실행

```bash
npm install
npm run dev
```

## 로컬 백엔드 연동

`.env.example`을 복사해 `.env`를 만들고, 실행 중인 백엔드 주소를 지정한다. 기본값은 로컬 백엔드(`http://localhost:3000`)와 공개 디자인 자산 주소를 사용한다.

```bash
Copy-Item .env.example .env
```

백엔드의 `CLIENT_URL`도 `http://localhost:8080`이어야 Google OAuth 콜백과 Refresh 쿠키가 정상 동작한다.

## 확인

```bash
npm run typecheck
npm run test
npm run build
```

## 구조

```text
src/
├─ app/
│  ├─ router/
│  ├─ providers/
│  ├─ guards/
│  └─ pages/
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

상세 아키텍처와 기능 계약은 `docs/` 문서를 따른다.
