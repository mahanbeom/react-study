# SPEC — HR 대시보드/관리자 사이트

## 무엇을

React + Vite 기반 HR 어드민 사이트. 백엔드 없이 mock API(MSW)로 실무와 동일한
fetch 구조를 연습한다.

### 기술 스택

- React + Vite + TypeScript (6.x 고정)
- react-router v7 (라이브러리 모드)
- TanStack Query — 서버 상태
- react-hook-form + zod — 폼/검증
- recharts — 차트
- MSW — mock API
- Tailwind CSS v4 — 스타일링
- 공통 설정: `@mahanbeom/kit` (ESLint/Prettier/TypeScript)

### 기능 범위 (구현 순서)

1. **레이아웃/라우팅 뼈대** — 사이드바 + 헤더 레이아웃, 전체 라우트 placeholder
2. **직원 목록 테이블** — 검색 / 필터(부서·상태) / 페이지네이션
3. **직원 상세/등록/수정 폼** — RHF + zod 검증, 생성/수정/삭제 mutation
4. **대시보드 홈** — 인원 현황 카드, 입퇴사 추이 차트
5. **휴가 워크플로우** — 신청 → 대기 → 승인/반려 상태 전이
6. **로그인 + 권한** — 관리자/일반 역할별 화면 분기

## 왜

- 실무 어드민의 표준 구조(라우팅, 서버 상태, 폼, 권한)를 한 프로젝트에서 연습
- mock API 기반이지만 fetch 계층은 실제 백엔드가 붙어도 그대로 쓸 수 있는 형태로 유지

## 아키텍처 규칙

```
src/
  app/       # 도메인 인지: 라우터, 프로바이더, 레이아웃 조립, 페이지
  ui/        # ★ 도메인 무관 재사용 UI — 추후 별도 패키지로 분리 대상
  features/  # 도메인별: employees, dashboard, leave, auth
  lib/       # api client 등 공용 유틸
  mocks/     # MSW 핸들러
```

- **UI 격리 규칙**: `src/ui`는 `app`/`features`/`lib`/`mocks`를 import하지 않는다.
  도메인 데이터(메뉴 항목, 컬럼 정의 등)는 전부 props로 주입한다.
  react-router 등 범용 라이브러리 의존은 허용(패키지 분리 시 peer dependency).
- 설정 변경은 프로젝트가 아니라 kit 저장소에서 한다 (프로젝트 고유 규칙만 예외).

## 완료 기준

- 각 단계: `pnpm lint` + `tsc` 통과, dev 서버에서 실제 구동 확인 후 커밋
- 테스트 가능한 로직(필터링, 상태 전이, zod 스키마 등)은 테스트 선행(TDD)
- 최종: 6단계 전부 동작 + 관리자/일반 계정으로 로그인해 권한 분기 확인
