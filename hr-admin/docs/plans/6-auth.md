# 6단계: 로그인 + 권한(관리자/일반) 화면 분기

## Context

1~5단계로 기능이 완성된 상태. 마지막 6단계는 인증/인가를 붙인다:
로그인해야 어드민에 들어올 수 있고, 역할(관리자 admin / 일반 member)에 따라
쓰기 액션이 화면과 mock 서버 양쪽에서 차단되는 실무 구조.
완료 시 SPEC의 최종 완료 기준(두 계정으로 권한 분기 확인)을 충족한다.

## 인증 설계 (mock이지만 실무 흐름 그대로)

- **토큰**: 로그인 성공 시 mock 서버가 `mock-token-<userId>` 형태의 무상태 토큰 발급.
  localStorage에 저장 → **새로고침해도 세션 유지** (인메모리 mock db가 리셋돼도
  토큰만으로 사용자 복원 가능하도록 무상태 설계).
- `lib/api.ts`가 모든 요청에 `Authorization: Bearer` 헤더 자동 첨부.
- Mock API:
  - `POST /api/auth/login` {email, password} → 성공 `{token, user}`, 실패 401
  - `GET /api/auth/me` → 토큰 검증 후 user, 무효 토큰 401
  - **기존 쓰기 엔드포인트에 인가 추가**: 직원 POST/PUT/DELETE, 휴가 decision은
    admin 아니면 **403**, 미인증은 401 (서버도 권한을 강제해야 실무와 같음)
- 데모 계정 2개 (`mocks/authDb.ts`): 김관리 admin@hrcorp.dev/admin123 (admin),
  이멤버 member@hrcorp.dev/member123 (member) — 로그인 화면에 안내 표시

## 권한 매트릭스 (TDD 대상)

`features/auth/permissions.ts` — `can(role, action)`:

| action           | admin | member |
| ---------------- | ----- | ------ |
| `employee.write` | ✓     | ✗      |
| `leave.decide`   | ✓     | ✗      |
| `leave.request`  | ✓     | ✓      |

화면과 mock 서버가 **같은 매트릭스를 공유** (zod 스키마 공유와 동일한 원칙).
`mocks/authDb.ts`의 `issueToken`/`resolveAuthHeader` 왕복도 테스트.

## 클라이언트 구조

```
features/auth/
  types.ts          # Role('admin'|'member'), AuthUser
  permissions.ts(+test)
  api.ts            # login / fetchMe (lib/api 재사용)
  schema.ts         # 로그인 폼 zod (이메일 형식, 비밀번호 필수)
  auth.ts           # useAuthUser(me 쿼리) / useLogin / useLogout
  labels.ts         # 역할 라벨·Badge
  components/RequireAuth.tsx   # 미로그인 → /login 리다이렉트 (원래 경로 state.from 보존)
  components/RequireRole.tsx   # 권한 없는 라우트 진입 → / 리다이렉트
lib/token.ts        # localStorage get/set/clear (lib에 둬서 lib→features 역참조 방지)
```

- 라우터: `RequireAuth`가 AdminLayout 전체를 감싸고, `/employees/new`·`/employees/:id/edit`은
  `RequireRole(employee.write)` 중첩. `/login`은 로그인 상태면 역리다이렉트.
- **UI 분기** (member에게 숨김): 직원 목록 "직원 등록" 버튼, 상세 "수정/삭제" 버튼,
  휴가 목록 승인/반려 버튼 — 전부 `can()` 사용.
- AdminLayout 사이드바 푸터: 하드코딩된 "관리자" → 실제 로그인 사용자
  (이름/이메일/역할 Badge) + 로그아웃 버튼.
- LoginPage: RHF + zod, 401이면 "이메일 또는 비밀번호가 올바르지 않습니다",
  성공 시 `state.from` 또는 `/`로 이동. 데모 계정 안내 카드 포함.

## 구현 순서 (TDD)

1. permissions / token(issue·resolve) 테스트 작성 → 구현 → 통과
2. mocks/authDb + auth 핸들러 + 기존 쓰기 핸들러에 401/403 인가 추가
3. lib/api Authorization 헤더 + features/auth (api/schema/auth/가드)
4. 라우터 가드 적용 + LoginPage + AdminLayout 푸터 + 화면별 `can()` 분기

## 검증 (완료 기준)

- `pnpm test` + `pnpm lint` + `pnpm typecheck` 통과
- 브라우저:
  - 미로그인으로 `/employees` 진입 → `/login` 리다이렉트 → 로그인 후 원래 경로 복귀
  - 잘못된 비밀번호 → 401 에러 메시지
  - **admin 로그인**: 등록/수정/삭제/승인/반려 전부 노출·동작, 새로고침 후 세션 유지
  - **member 로그인**: 위 버튼 전부 숨김, `/employees/new` 직접 진입 → `/` 리다이렉트,
    쓰기 API 직접 호출 → 403(무토큰 401), 휴가 신청은 가능
  - 로그아웃 → `/login` 이동, 보호 라우트 재차단
- 검증 후 커밋 (SPEC 최종 완료 기준 충족)

## 구현 중 결정 사항 (기록)

- 로그인 성공 후 이동을 `navigate(from)` 명령형 호출로 하면 `user` 캐시 세팅에 따른
  `<Navigate to="/">` 렌더와 경합해 from을 잃는 문제 발견 → 이동을 **선언적
  `<Navigate to={from} replace>` 하나로 통일** (user가 채워지면 리렌더로 이동)
