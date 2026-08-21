# 8단계: 심화 패턴 — 토스트 알림 + 낙관적 업데이트

## Context

7단계의 컴포넌트 테스트 인프라 위에 실무 심화 패턴 2가지를 얹었다: **전역 토스트
알림**과 **낙관적 업데이트(onMutate/rollback)**. 낙관적 업데이트의 핵심인 "실패 시
롤백"은 브라우저로 재현하기 까다로워 MSW 에러 주입 + 컴포넌트 테스트가 정확한 검증
수단이다. 새 런타임 의존성 없음 (hand-rolled).

## 설계 결정

- **토스트는 `src/ui/toast/`** (ToastProvider + useToast): 도메인 무관 순수 UI 관심사.
  Context + useState, 포털 없는 fixed viewport(z-60 우하단) — ConfirmDialog와 같은
  inline 패턴. a11y: success `role="status"`(polite) / error `role="alert"`(assertive).
  자동 닫힘(4s/6s, prop 오버라이드 가능 — 테스트에서 50ms) + 수동 닫기.
  참고: 더 큰 앱은 standalone toast() + MutationCache 전역 onError(sonner 방식)가
  흔하지만, context 훅이 의존 관계가 명시적이라 학습 목적으로 채택.
- **마운트는 providers.tsx 루트**: AdminLayout에 두면 레이아웃 밖(LoginPage) 토스트가
  조용히 사라진다. 토스트는 QueryClient 같은 전역 인프라. 테스트 렌더 헬퍼
  (renderApp/renderWithProviders)에도 동일 배선 필수.
- **토스트 발화는 뮤테이션 훅(features)**: "뮤테이션이 일어났다"는 피드백은 호출부와
  무관하게 동일해야 하므로 훅의 onSuccess/onError에. 내비게이션·다이얼로그 닫기 등
  화면 고유 후속만 호출부의 `mutate(vars, {onSuccess})`에 (v5는 둘 다 실행).
  **경계 원칙: 화면에 컨텍스트가 남아 있으면 인라인 에러(EmployeeForm 409 필드 에러),
  컨텍스트가 사라진 뒤 도착하는 결과는 토스트.**
- **낙관적 업데이트는 leave decide만**: 목록 배지가 즉시 바뀌는 가시적 전이 + 기존
  409 동시성 경로. employee delete/create/update는 invalidate 유지 — 삭제는 목록
  이동 후 refetch라 이득 0, 페이지네이션 낙관적 삭제는 total/시프트 복잡도만 증가.
- **행 상태만 변경, 제거 안 함**: 행 제거는 total·페이지 시프트까지 지어내야 함.
  상태만 바꾸면 배지 전환 + pending 조건 버튼 소멸로 "처리됨"이 즉시 보이고, 필터
  불일치는 onSettled invalidate가 정리.
- **다이얼로그는 mutate 직후 즉시 닫기**: 낙관적 UI의 목적이 "기다리지 않는 것".
  결과 피드백 채널이 다이얼로그 → 토스트로 이동. 409도 롤백 + invalidate 수렴,
  토스트 문구만 분기.

## 낙관적 업데이트 구조 (`features/leave/`)

- `optimistic.ts` — `applyDecisionToList` 순수 함수(TDD): pending 행만
  status/rejectReason(트림) 변경, decidedAt은 지어내지 않음, total 불변
- `mutations.ts` — `useDecideLeaveRequest`:
  - onMutate: `cancelQueries(lists)` → `getQueriesData` 멀티 키 스냅샷 →
    `setQueriesData` 패치 → `{snapshots}` context 반환
  - onSuccess: 성공 토스트 / onError: 스냅샷 복원 + 에러 토스트(409 분기)
  - onSettled: `invalidateQueries(all)` — 성공·실패 모두 서버 진실 수렴

## 테스트 기법 (기록할 가치)

- **응답 보류 핸들러** `server.use(http.patch(..., () => new Promise(() => {})))`:
  이후의 모든 단언이 "서버 응답 전"임을 구조적으로 보장 — 낙관적 반영 검증의 핵심
- 500 주입 → 롤백 + `role="alert"` 토스트 / 409 주입 → 전용 문구 + refetch 수렴
- "승인/반려/대기"가 탭·다이얼로그·배지·버튼에 모두 등장 → `within(row)` 스코프 필수

## 커밋

| slice | 커밋      | 내용                                                |
| ----- | --------- | --------------------------------------------------- |
| 1     | `38e72a9` | 토스트 시스템 + 테스트 3개                          |
| 2     | `3e21d8d` | 뮤테이션 성공 토스트 (훅 레벨) + 삭제 플로우 테스트 |
| 3     | `2aa9d90` | applyDecisionToList (TDD 선행)                      |
| 4     | `f54513a` | 낙관적 업데이트 + LeavePage 테스트 4개              |

브라우저 실증: 승인 클릭 → 다이얼로그 즉시 닫힘 + 토스트 + refetch 후 대기 탭 정리 확인.
최종 테스트 91개 / lint / tsc -b 클린.
