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
- `src/examples/index.ts` — 예제 목록(공식문서 순서대로 추가)
- `src/App.tsx` — 왼쪽 목록에서 예제를 골라 보는 셸

## 진행 순서

공식문서 [Learn](https://github.com/pmndrs/zustand/blob/main/docs/learn/index.md) →
[Reference](https://github.com/pmndrs/zustand/blob/main/docs/reference/index.md) 순서를 따른다.

### Learn — Start here

- [x] Introduction
- [x] Comparison with other tools
- [ ] Tutorial: Tic Tac Toe

### Learn — Core concepts

- [ ] Updating state
- [ ] Practice with no store actions
- [ ] Slices pattern
- [ ] Immutable state and merging
- [ ] Maps and sets usage

### Learn — Performance and rendering

- [ ] Prevent rerenders with useShallow
- [ ] Connect to state with URL hash
- [ ] Event handler in pre React 18

### Learn — TypeScript path

- [ ] Beginner TypeScript
- [ ] Advanced TypeScript
- [ ] Auto-generating selectors

### Learn — Frameworks and platforms

- [ ] Next.js
- [ ] SSR and hydration
- [ ] Initialize state with props

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
