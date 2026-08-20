# 1단계: 사이드바/헤더 레이아웃과 라우팅 뼈대

> 결과 커밋: `658ff6f` (+ SPEC 작성 `f974ba0`)

## Context

실무 어드민 구조 연습용 HR 대시보드를 React + Vite로 새로 시작한다. 저장소는 README만 있는 빈 상태.
전체 범위는 6단계(레이아웃 → 직원 테이블 → 폼 → 대시보드 차트 → 휴가 워크플로우 → 로그인/권한)이며,
이 단계에서는 **SPEC.md 작성 + 1단계(사이드바/헤더 레이아웃 + 라우팅 뼈대)** 까지만 구현한다.

핵심 제약: 사이드바·헤더 같은 범용 UI는 **나중에 별도 모듈(패키지)로 분리할 수 있도록** 도메인 코드와 격리해서 만든다.

## 기술 결정

- 스타일링: **Tailwind CSS v4** (`@tailwindcss/vite` 플러그인, CSS-first 설정) — 사용자 선택
- 라우팅: **react-router** (라이브러리 모드, `createBrowserRouter`) — 계획은 v7, 실제 설치는 v8(동일 API)
- 공통 설정: `@mahanbeom/kit` (전역 `setup.sh` 실행, TypeScript 6.x 고정)
- 패키지 매니저: pnpm
- TanStack Query / RHF+zod / recharts / MSW는 **해당 단계에서 설치** (뼈대를 가볍게 유지)

## 폴더 구조 (모듈 분리를 염두)

```
src/
  app/          # 도메인 인지 영역: 라우터, 레이아웃 조립, (추후) 프로바이더
    router.tsx
    layouts/AdminLayout.tsx   # ui 컴포넌트 조립 + HR 메뉴 정의 주입
    pages/                    # 단계별 placeholder 페이지
  ui/           # ★ 도메인 무관 재사용 컴포넌트 — 추후 패키지 분리 대상
    layout/AppShell.tsx       # sidebar + header + content 영역 골격
    layout/Sidebar.tsx        # 메뉴 항목을 props로 받음 (도메인 하드코딩 금지)
    layout/Header.tsx         # 타이틀/우측 슬롯 props
  features/     # (2단계부터) employees, dashboard, leave, auth
  lib/          # (2단계부터) api client 등
```

**격리 규칙 (SPEC.md에 명문화):** `src/ui`는 `app`/`features`/`lib`를 import하지 않는다.
react-router 같은 범용 라이브러리 의존은 허용(분리 시 peer dependency가 됨), 도메인 데이터는 전부 props 주입.

## 구현 순서

1. **SPEC.md 작성** — 무엇을(6단계 기능 범위), 왜(실무 어드민 구조 연습), 완료 기준(단계별 검증 조건 + UI 격리 규칙)
2. **스캐폴드** — `pnpm create vite`(react-ts 템플릿)를 임시 디렉터리에 생성 후 저장소로 이동(기존 README/.git 보존), 데모 코드 제거
3. **공통 설정** — `~/.claude/templates/js-ts/setup.sh .` 실행. Vite 템플릿의 tsconfig는 `@mahanbeom/kit/tsconfig` extends로 정리하고 Vite 필수 옵션만 오버라이드
4. **Tailwind v4 + react-router 설치** — `@tailwindcss/vite` 플러그인 등록, `index.css`에 `@import "tailwindcss"`
5. **ui/ 레이아웃 컴포넌트** — AppShell / Sidebar(items props, NavLink 활성 표시) / Header(title, 우측 슬롯)
6. **라우팅 뼈대** — `AdminLayout`(사이드바 메뉴: 대시보드/직원/휴가) 하위에
   `/`(대시보드 홈), `/employees`, `/employees/new`, `/employees/:id`, `/leave` — 각각 placeholder 페이지.
   레이아웃 밖에 `/login` placeholder, 404 페이지

## 검증 (완료 기준)

- `pnpm lint` + `tsc` 통과
- dev 서버 구동 후 브라우저로 실제 확인: 각 라우트 이동, 사이드바 활성 메뉴 표시, 404 동작
- 검증 완료 후 커밋 (SPEC 커밋 + 1단계 커밋 분리)

## 구현 중 결정 사항 (기록)

- 최신 Vite 템플릿의 기본 린터(oxlint)를 제거하고 kit 표준 ESLint + `eslint-plugin-react-hooks`로 통일
- TS 6에서 `baseUrl` deprecated → `paths`만으로 `@/` 별칭 설정
- react-router는 v8이 설치됨 (v7과 동일한 라이브러리 모드 API)
