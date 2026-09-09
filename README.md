# moim frontend

React + TypeScript + Vite 기본 보일러플레이트.

## 실행

```bash
npm install
npm run dev
```

## 확인

```bash
npm run typecheck
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
