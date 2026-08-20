# 5단계: 휴가 신청/승인 워크플로우

> 결과 커밋: `ab4b7a9`

## Context

직원 CRUD와 대시보드가 완성된 상태. 5단계는 새 도메인(휴가)을 추가해
**상태 전이가 있는 워크플로우**(대기 → 승인/반려, 승인·반려는 종결 상태)를 연습한다.
전이 규칙을 순수 함수로 분리해 TDD하고, mock 서버가 규칙 위반을 409로 거부하는
실무형 구조. 기존 패턴(fetch 계층, URL 상태, zod 공유, 캐시 무효화)을 그대로 재사용한다.

## 데이터 모델

```ts
type LeaveType = 'annual' | 'half' | 'sick'; // 연차/반차/병가
type LeaveStatus = 'pending' | 'approved' | 'rejected'; // 대기/승인/반려
interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string; // 목록 표시용 비정규화 (실무에서 흔한 패턴)
  type: LeaveType;
  startDate: string;
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: LeaveStatus;
  createdAt: string;
  decidedAt: string | null;
  rejectReason: string | null; // 반려 시 필수
}
```

## TDD 대상 (테스트 먼저)

1. **`features/leave/workflow.ts`** — `decide(request, {action, rejectReason?, decidedAt})`:
   - pending → approved / rejected만 허용, 그 외 전이는 에러 반환(판별 유니언 `{ok} | {error}`)
   - 반려에는 rejectReason 필수, decidedAt 기록, 원본 불변
2. **`features/leave/schema.ts`** — `leaveRequestFormSchema`:
   - employeeId/유형 필수, 날짜 형식, **종료일 ≥ 시작일**(교차 필드), 사유 1자 이상
3. **`mocks/leave.ts`** — `queryLeaveRequests(list, {status, page, pageSize})`:
   - 상태 필터 + 신청일 최신순 + 페이지네이션 (queryEmployees와 동일 계약)

## Mock API

- 시드: `mocks/leaveDb.ts` — 시드 고정 난수로 직원과 연결된 휴가 신청 ~18건
  (대기/승인/반려 혼합), 인메모리 mutable 저장소 (db.ts 패턴)
- `GET /api/leave-requests?status=&page=` — queryLeaveRequests 사용, delay 300
- `POST /api/leave-requests` — 스키마 검증(400), employeeId 존재 확인(400), pending으로 생성(201)
- `PATCH /api/leave-requests/:id/decision` — body `{action: 'approve'|'reject', rejectReason?}`,
  workflow.decide 사용 → 전이 위반 시 **409**, 없는 id 404

## 화면 (라우트: /leave, /leave/new)

- **LeavePage**: 상태 탭(대기·승인·반려·전체, URL `?status=` 기본 pending) + DataTable
  (신청자/유형/기간/사유/상태 Badge/신청일) + Pagination + 우측 상단 "휴가 신청" 버튼.
  - 대기 행에만 승인/반려 버튼 (행 클릭 이동은 없음 — 액션 중심 화면)
  - 승인: ConfirmDialog 재사용 / 반려: **RejectDialog**(사유 textarea 필수)
  - 승인·반려 성공 시 leaveKeys 무효화. 409 응답이면 "이미 처리된 신청입니다" 안내 후 목록 갱신
- **LeaveCreatePage**: RHF + zod 폼 — 직원 select(재직자만, employees 쿼리 재사용),
  유형 select, 시작/종료일, 사유 textarea. 성공 시 /leave?status=pending 이동

## 파일 구조 (신규)

```
features/leave/
  types.ts / schema.ts(+test) / workflow.ts(+test) / labels.ts
  api.ts / queries.ts / mutations.ts
  components/RejectDialog.tsx
mocks/leaveDb.ts, mocks/leave.ts(+test), handlers.ts 확장
ui/Textarea.tsx / ui/Tabs.tsx          # 도메인 무관 추가
app/pages/LeavePage.tsx, LeaveCreatePage.tsx, router.tsx에 /leave/new
```

기존 재사용: DataTable/Pagination/Badge/Button/FormField/Input/Select/ConfirmDialog,
lib/api, queryOptions 패턴, URL searchParams 패턴 (EmployeeListPage 참고).

## 구현 순서 (TDD)

1. workflow / schema / queryLeaveRequests 테스트 작성 → 구현 → 통과
2. leaveDb 시드 + 핸들러 + features(api/queries/mutations/labels)
3. ui(Textarea, Tabs) + RejectDialog + LeavePage + LeaveCreatePage + 라우트

## 검증 (완료 기준)

- `pnpm test` + `pnpm lint` + `pnpm typecheck` 통과
- 브라우저: 탭 필터+URL 반영, 대기 건 승인 → 승인 탭에서 확인, 반려(사유 입력) → 반려 탭
  확인, 신청 폼 검증 에러(종료일 < 시작일 등) → 정상 신청 시 대기 탭에 표시,
  이미 처리된 건 재처리 시도(API 직접 호출) → 409 안내
- 검증 후 커밋
