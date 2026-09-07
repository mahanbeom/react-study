# zustand

zustand 공식문서를 순서대로 따라가며 예제를 하나씩 구현하는 학습 프로젝트다.
(zustand 5.x / React 19 / Vite)

## 실행

```bash
pnpm dev        # 개발 서버 (http://localhost:5174)
pnpm lint       # 린트
pnpm typecheck  # 타입 검사
```

## 구조

- `src/examples/NN-*.tsx` — 문서 한 꼭지당 예제 파일 하나
  (파일 분리 자체가 주제인 경우 `NN-*/` 디렉터리)
- `src/examples/index.ts` — 예제 목록(공식문서 순서대로 추가)
- `src/App.tsx` — 왼쪽 목록에서 예제를 골라 보는 셸

## 진행 순서

공식문서 [Learn](https://github.com/pmndrs/zustand/blob/main/docs/learn/index.md) →
[Reference](https://github.com/pmndrs/zustand/blob/main/docs/reference/index.md) 순서를 따른다.

### Learn — Start here

- [x] Introduction
- [x] Comparison with other tools
- [x] Tutorial: Tic Tac Toe

### Learn — Core concepts

- [x] Updating state
- [x] Practice with no store actions
- [x] Slices pattern
- [x] Immutable state and merging
- [x] Maps and sets usage

### Learn — Performance and rendering

- [x] Prevent rerenders with useShallow
- [x] Connect to state with URL hash
- [x] Event handler in pre React 18 — 개념만 정리 (v5는 React 18+ 전용이라 재현 불가, 예제 없음)

### Learn — TypeScript path

- [x] Beginner TypeScript
- [x] Advanced TypeScript
- [x] Auto-generating selectors

### Learn — Frameworks and platforms

- [x] Next.js
- [x] SSR and hydration — 14 에 함께. Vite SPA 라 실제 서버는 없고,
      브라우저에서 renderToString + hydrateRoot 로 mismatch 를 실측한다
- [x] Initialize state with props

### Learn — Testing and quality

- [ ] Testing stores and components
- [ ] Flux-inspired practice
- [ ] How to reset state

### Reference — APIs

- [ ] `create`
- [ ] `createStore`
- [ ] `createWithEqualityFn`
- [ ] `shallow`

### Reference — Hooks

- [ ] `useStore`
- [ ] `useStoreWithEqualityFn`
- [ ] `useShallow`

### Reference — Middlewares

- [ ] `persist`
- [ ] `devtools`
- [ ] `redux`
- [ ] `immer`
- [ ] `combine`
- [ ] `subscribeWithSelector`

### Reference — Integrations

- [ ] Persisting store data
- [ ] Immer middleware
- [ ] Third-party libraries

### Reference — Migrations

- [ ] Migrating to v5
- [ ] Migrating to v4
