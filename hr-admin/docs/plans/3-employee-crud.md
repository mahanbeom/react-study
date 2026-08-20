# 3단계: 직원 상세 / 등록 / 수정 폼

> 결과 커밋: `f5622c7` (+ 대시보드 캐시 무효화 수정 `abbbe5e`)

## Context

2단계에서 목록 조회(fetch 계층 + MSW)가 완성됐다. 3단계는 쓰기(mutation)를 도입한다:
직원 상세 조회, 등록/수정 폼(react-hook-form + zod), 삭제. TanStack Query의
mutation → invalidateQueries 캐시 무효화 흐름과, 서버(mock) 검증 에러 처리까지
실무 CRUD 패턴 전체를 연습하는 단계.

## 설치

- `react-hook-form`, `zod`, `@hookform/resolvers`

## 라우트

- `/employees/:employeeId` — 상세 (정보 카드 + 수정/삭제 버튼)
- `/employees/:employeeId/edit` — 수정 폼 (기존 값 프리필)
- `/employees/new` — 등록 폼 (2단계 placeholder 교체)

## Mock API 확장 (실제 서버처럼 동작)

- 인메모리 mutable 저장소로 전환: `mocks/db.ts`에 find/insert/update/remove 함수 제공
  — 시드는 그대로, 변경은 새로고침 전까지 유지
- `GET /api/employees/:id` → 없으면 404
- `POST /api/employees` → **서버에서도 zod 스키마로 검증** 후 400, 이메일 중복 시 409, 성공 201
- `PUT /api/employees/:id` → 검증 + 404/409 처리
- `DELETE /api/employees/:id` → 204

## zod 스키마 (TDD 대상 — 테스트 먼저)

`features/employees/schema.ts` — `employeeFormSchema`:

- name: trim 후 1자 이상 / email: 이메일 형식 / department·status: enum / position: 1자 이상 / hiredAt: YYYY-MM-DD
- **교차 필드 규칙**(superRefine): status가 `resigned`면 resignedAt 필수 + `hiredAt` 이후,
  resigned가 아니면 resignedAt은 null로 정규화(transform)

테스트: 유효 케이스 / 이메일 형식 오류 / 퇴사인데 퇴사일 없음 / 퇴사일 < 입사일 / null 정규화

## 파일 구조 (신규/수정)

```
hr-admin/src/
  features/employees/
    schema.ts / schema.test.ts   # ★ TDD
    api.ts                       # fetchEmployee/create/update/delete 추가
    queries.ts                   # employeeKeys.detail(id) + 상세 쿼리 (404는 재시도 안 함)
    mutations.ts                 # useCreate/useUpdate/useDelete — 성공 시 invalidate
    components/EmployeeForm.tsx  # 등록/수정 공용 폼 (RHF + zodResolver, 서버 에러 배너)
  ui/                            # 도메인 무관 추가 (격리 규칙 유지)
    Button / FormField / Input / ConfirmDialog / DescriptionList
  app/pages/
    EmployeeDetailPage(404 처리) / EmployeeCreatePage / EmployeeEditPage(신규)
  app/router.tsx                 # /employees/:employeeId/edit 추가
  mocks/db.ts, handlers.ts       # 위 API 확장
```

## 핵심 설계 결정

- **스키마 1벌을 클라이언트(RHF resolver)와 mock 서버(핸들러 검증) 양쪽에서 재사용** —
  프론트/백 검증 규칙이 일치해야 하는 실무 구조를 그대로 재현.
- 텍스트 입력은 RHF `register`, 커스텀 Select는 `Controller` — 두 방식 모두 연습.
- 이메일 중복(409) 같은 서버 에러는 `ApiError.status`로 분기해 `setError('email', ...)`
  또는 폼 상단 배너로 표시.
- 삭제는 ConfirmDialog로 확인 후 실행, 성공 시 목록으로 이동.
- mutation 성공 시 `invalidateQueries(employeeKeys.all)`로 목록+상세 캐시 동시 무효화.

## 구현 순서 (TDD)

1. 의존성 설치
2. schema 테스트 작성 → schema 구현 → `pnpm test` 통과
3. mocks(db mutable화 + CRUD 핸들러), features(api/queries/mutations)
4. ui 컴포넌트 → EmployeeForm → 상세/등록/수정 페이지 + 라우트

## 검증 (완료 기준)

- `pnpm test` + `pnpm lint` + `pnpm typecheck` 통과
- 브라우저: 상세 표시/404, 등록 검증 에러 → 정상 등록, 이메일 중복 409 표시,
  수정 프리필 → 저장 반영, 삭제 확인 모달 → 목록 제거
- 검증 후 커밋

## 구현 중 결정 사항 (기록)

- Vite 8(rolldown) optimizer가 react-hook-form에 React 사본을 인라인하는 버그 발견 →
  `optimizeDeps.exclude: ['react-hook-form', '@hookform/resolvers']`로 회피 (vite.config.ts 주석 참고)
- 이후 사용자 피드백으로 직원 mutation이 **대시보드 캐시도 함께 무효화**하도록 수정
  (`invalidateEmployeeData` — 데이터에 의존하는 쿼리를 mutation이 책임지는 패턴)
