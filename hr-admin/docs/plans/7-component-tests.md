# 7단계: 컴포넌트 테스트 도입 (Vitest + Testing Library + MSW)

## Context

1~6단계까지의 테스트 56개는 전부 순수 함수(스키마·워크플로우·권한·mock 쿼리 로직)
대상이라 **UI 계층 — 폼 검증 흐름, 서버 에러 표시, URL 상태, 권한별 화면 분기 — 은
테스트가 없었고**, 매 단계 브라우저 실증으로만 검증해 왔다. 이 공백을
Testing Library + MSW 통합 테스트(실무 표준)로 메운다. 이후 심화 패턴(낙관적
업데이트 등)의 검증 기반이기도 하다.

ESS/MSS 확장 논의가 있었으나 컴포넌트 테스트를 우선하기로 결정 (확장 전 안전망 확보).

## 핵심 설계 결정

- **jsdom 채택** (happy-dom 대신): RTL 문서 기본값이자 실무 표준. 폼·포커스·이벤트
  스펙 충실도가 높아 RHF + user-event 테스트에서 가짜 실패가 없다.
- **Vitest 4 `test.projects`로 2분리**: `*.test.ts` = node 단위(기존 무변경),
  `*.test.tsx` = jsdom 컴포넌트(전용 setupFile `src/test/setup.ts`). 파일명 변경 없음.
- **핸들러 1벌 재사용**: `mocks/server.ts`의 `setupServer(...handlers)` — 브라우저
  worker와 동일한 핸들러를 Node 테스트에서 공유. `onUnhandledRequest: 'error'`로
  핸들러 누락을 즉시 드러낸다.
- **delay 무력화는 env 분기 래퍼** (`mocks/latency.ts`의 `networkDelay`): fake
  timers(MSW·user-event와 조합이 취약)나 per-test override(핸들러 중복) 대신
  `import.meta.env.MODE === 'test'`면 즉시 응답.
- **`createMemoryRouter(routes)`로 실제 라우트 트리 렌더** (`test/renderWithProviders.tsx`
  의 `renderApp`): 가드 중첩·리다이렉트·`useSearchParams` URL 상태를 프로덕션과
  동일하게 검증. URL 단언은 `router.state.location`. `router.tsx`는 routes 배열만
  분리 export.
- 테스트 격리: afterEach에서 `resetHandlers` + RTL `cleanup`(globals:false라 수동) +
  `localStorage.clear()` + mock DB reset (`resetDb` → `resetLeaveDb`, leave 시드가
  직원 목록을 읽으므로 순서 고정).
- `loginAs(role)` 헬퍼: 무상태 토큰(`mock-token-u1`/`u2`)을 직접 주입해 UI 로그인
  절차 없이 인증 상태를 만든다.
- Vitest 4는 rolldown optimizer를 쓰지 않으므로 dev 서버의 RHF 중복 React 버그는
  테스트에 영향 없음. TS 설정 변경 없음 (jest-dom 7 자체 타입 + vitest 명시 import 유지).
- 부수 정리: 레포 루트에 잘못 설치돼 있던 react-hook-form/zod/@hookform/resolvers를
  `hr-admin/package.json`으로 이동, 루트 package.json/lockfile 제거.

## 슬라이스 (커밋 단위)

| slice | 대상             | 검증 내용                                                                                       |
| ----- | ---------------- | ----------------------------------------------------------------------------------------------- |
| 0     | 인프라           | 의존성·config·헬퍼 + 스모크 1개, 브라우저 회귀 확인                                             |
| 1     | LoginPage        | zod 검증 / 401 root 에러 / 성공 리다이렉트 / from 복귀 / 제출 중 비활성화                       |
| 2     | EmployeeForm     | 필수 검증 / transform 값 / 409·500 에러 / 퇴사 분기 + 실제 핸들러 409 통합                      |
| 3     | EmployeeListPage | 목록·건수 / 검색 디바운스→URL / 페이지 이동 / 필터 시 page 리셋 / URL 복원 / member 버튼 미노출 |
| 4     | 가드             | RequireAuth(무토큰·무효 토큰·복원 중) / RequireRole(member 차단·admin 통과)                     |

## 시행착오 기록

- required 필드의 label은 별표가 붙어 `getByLabelText('이름')` 정확 매칭이 실패한다
  → `/^이름/` 접두 정규식으로 조회.
- "대시보드" 같은 텍스트는 사이드바 링크와 페이지 양쪽에 존재 → 페이지 고유
  텍스트(예: "재직 인원")로 단언.
