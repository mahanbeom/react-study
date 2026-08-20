# 2단계: 직원 목록 테이블 (검색/필터/페이지네이션)

> 결과 커밋: `949d047` (+ 레포 구조 변경 `f32780c`)

## Context

1단계(레이아웃/라우팅 뼈대)가 완료되고 프로젝트가 `hr-admin/`으로 이동된 상태.
2단계는 mock API 기반의 실무형 fetch 구조를 처음 도입하는 단계로, 이후 3~6단계가
전부 이 데이터 계층(MSW 핸들러, api client, TanStack Query) 위에서 동작한다.

목표: `/employees`에 검색(이름/이메일) / 필터(부서·재직 상태) / 페이지네이션이 되는
직원 목록 테이블. 테이블·페이지네이션 등 범용 UI는 `src/ui`에 도메인 무관하게 추가.

## 설치

- `@tanstack/react-query` — 서버 상태
- `msw` — mock API (`msw init public/`으로 service worker 생성)
- `vitest` — 테스트 러너 (필터링 로직 TDD용, node 환경만)

## 데이터 모델 (3~5단계까지 내다본 설계)

```ts
// features/employees/types.ts
type Department = 'engineering' | 'design' | 'product' | 'hr' | 'finance' | 'sales';
type EmployeeStatus = 'active' | 'onLeave' | 'resigned';
interface Employee {
  id: string;
  name: string;
  email: string;
  department: Department;
  position: string;
  status: EmployeeStatus;
  hiredAt: string; // ISO — 4단계 입퇴사 추이 차트에 사용
  resignedAt: string | null;
}
```

시드 데이터: 시드 고정 의사난수로 직원 ~50명 생성(입사일 최근 3년 분포, 일부 퇴사).
매 새로고침마다 동일한 데이터 → 검증·디버깅이 재현 가능.

## 파일 구조

```
hr-admin/src/
  lib/api.ts                     # fetch 래퍼: baseUrl /api, JSON 파싱, ApiError(status) throw
  mocks/
    db.ts                        # 시드 직원 데이터 생성
    employees.ts                 # ★ queryEmployees(db, params) 순수 함수 (검색/필터/페이지 적용)
    handlers.ts                  # GET /api/employees → queryEmployees 호출, delay(300)로 지연 시뮬레이션
    browser.ts                   # setupWorker
    employees.test.ts            # queryEmployees 단위 테스트 (TDD: 구현 전 작성)
  app/providers.tsx              # QueryClientProvider
  main.tsx                       # enableMocking() 후 render (실무 표준 MSW 부트스트랩)
  features/employees/
    api.ts                       # fetchEmployees(params) — 응답: {items,total,page,pageSize}
    queries.ts                   # employeeKeys + 목록 쿼리 (placeholderData: keepPreviousData)
    labels.ts                    # 부서/상태 한글 라벨·Badge 색 매핑
  ui/                            # ★ 도메인 무관 재사용 (기존 격리 규칙 유지)
    DataTable.tsx                # 제네릭 <T> 테이블: columns/rows/rowKey/onRowClick/빈·로딩 상태
    Pagination.tsx / Badge.tsx / SearchInput.tsx(디바운스) / Select.tsx
  app/pages/EmployeeListPage.tsx # 조립: URL searchParams ↔ 검색/필터/페이지 상태
```

## 핵심 설계 결정

- **검색/필터/페이지 상태는 URL(searchParams)에 둔다** — 새로고침·뒤로가기·링크 공유가
  동작하는 실무 패턴. 검색 입력만 300ms 디바운스 후 URL 반영(변경 시 page 1로 리셋).
- **MSW 핸들러의 필터링 로직은 순수 함수로 분리**(`queryEmployees`)해서 vitest로 TDD.
- **API 응답 형태** `{ items, total, page, pageSize }` — 서버 사이드 페이지네이션 시뮬레이션.
  실제 백엔드로 교체해도 프론트 무변경.
- 테이블 행 클릭 → `/employees/:id` 이동 (3단계 상세 페이지 연결 준비).
- 로딩은 placeholderData 유지 + opacity 처리, 초기 로딩만 스피너. 에러 상태 표시 포함.

## 구현 순서 (TDD)

1. 의존성 설치 + MSW service worker init + providers/main 부트스트랩
2. `queryEmployees` **테스트 먼저 작성** → 구현 → `pnpm test` 통과
3. db 시드 + handlers + lib/api + features/employees(api/queries/labels)
4. ui 컴포넌트(DataTable, Pagination, Badge, SearchInput, Select)
5. EmployeeListPage 조립 (URL 상태 연동)

## 검증 (완료 기준)

- `pnpm test`(vitest) + `pnpm lint` + `pnpm typecheck` 통과
- 브라우저 실제 확인: 목록 렌더링, 검색어 입력 → 결과 갱신 + URL 반영, 부서/상태 필터,
  페이지 이동, 새로고침 시 상태 유지, 빈 결과 상태, 행 클릭 → 상세 placeholder 이동
- 검증 후 커밋
