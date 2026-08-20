# 4단계: 대시보드 홈 (인원 현황 + 입퇴사 추이 차트)

> 결과 커밋: `d6daa21`

## Context

직원 CRUD(2·3단계)가 완성됐다. 4단계는 `/` 대시보드 placeholder를 실제 화면으로 교체한다:
인원 현황 통계 카드 + 최근 12개월 입퇴사 추이 차트(recharts). 집계는 mock 서버에서
수행해(실제 백엔드처럼) 프론트는 집계 API를 소비만 한다.

## 설치

- `recharts`

## Mock API

`GET /api/dashboard/summary` 응답:

```ts
interface DashboardSummary {
  headcount: { total: number; active: number; onLeave: number; resigned: number };
  // 최근 12개월, 과거→현재 순. 이벤트 없는 달은 0
  monthlyTrend: { month: string /* YYYY-MM */; hires: number; resignations: number }[];
}
```

집계 로직은 순수 함수로 분리해 TDD:

- `mocks/dashboard.ts` — `countHeadcount(employees)`, `buildMonthlyTrend(employees, endMonth, months)`
  (endMonth를 파라미터로 받아 순수하게 유지, 핸들러가 현재 달을 주입)
- 테스트: 상태별 집계 / 월 버킷팅 / 이벤트 없는 달 0 / 12개월 윈도우 경계 / 연도 경계

핸들러는 기존 `listEmployees()`(mocks/db.ts) 사용 — 직원을 등록/삭제하면 대시보드
숫자도 변한다.

## 파일 구조 (신규/수정)

```
hr-admin/src/
  mocks/dashboard.ts + dashboard.test.ts   # ★ TDD 집계 순수 함수
  mocks/handlers.ts                        # GET /api/dashboard/summary 추가
  features/dashboard/
    types.ts / api.ts / queries.ts
    components/HiresTrendChart.tsx         # recharts BarChart (입사/퇴사 2계열, 12개월)
  ui/StatCard.tsx                          # 도메인 무관 통계 카드 (label/value/icon/hint)
  app/pages/DashboardPage.tsx              # placeholder 교체: 카드 4장 + 차트 카드
```

## 화면 구성

- 상단 통계 카드 4장 (ui/StatCard, 그리드): 재직 / 휴직 / 이번 달 입사 / 이번 달 퇴사
  (이번 달 값은 monthlyTrend 마지막 항목에서 파생)
- 아래 차트 카드: 최근 12개월 입사·퇴사 BarChart
  - **차트 코드 작성 전에 `dataviz` 스킬을 로드**해 색·형태 가이드를 따른다
    (팔레트는 검증 스크립트 통과 필수, 12px 막대 + 4px 라운드 데이터 끝, hairline 그리드,
    2계열이므로 범례 필수, 축 라벨은 텍스트 토큰 색)
- 로딩/에러 상태는 기존 패턴(EmployeeListPage) 재사용

## 구현 순서 (TDD)

1. recharts 설치 (dev 서버 내린 상태에서 — 3단계에서 확인한 optimize 이슈 예방)
2. 집계 함수 테스트 작성 → 구현 → `pnpm test` 통과
3. mock 핸들러 + features/dashboard (api/queries/types)
4. dataviz 스킬 로드 → StatCard + HiresTrendChart + DashboardPage

## 검증 (완료 기준)

- `pnpm test` + `pnpm lint` + `pnpm typecheck` 통과
- 브라우저: 카드 4장 수치가 mock 데이터와 일치(52명 시드 기준 목록 API와 교차 검증),
  차트 12개월 렌더링·툴팁 동작, 직원 변경 후 대시보드 수치 변화 확인
- 검증 후 커밋
