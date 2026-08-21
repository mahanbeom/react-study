# 9단계: 계정↔직원 연결 + 부서 엔티티

SPEC v2(ESS/MSS 확장)의 첫 단계 — 데이터 모델 기반 작업. 계정(AuthUser)과
직원(Employee)이 무관해 "내 휴가"가 불가능하고, 부서가 문자열 union이라
부서장(결재 관계)을 표현할 수 없던 것을 해소한다. 원칙: **저장은 관계 한 곳,
파생은 서버 응답 조립 시점**. role은 admin/member 2종 유지 — 부서장 여부는
관계에서 파생한다.

## 설계 결정

1. **Department.id = 기존 union 값 유지** ('engineering' 등). URL 파라미터·
   `Employee.department`·시드·테스트 픽스처가 그대로 삶. union 타입은
   `DepartmentId`로 rename, 엔티티는 `features/departments/types.ts`:
   `Department { id: DepartmentId; name: string; managerEmployeeId: string }`.
2. **z.enum(DEPARTMENTS) 유지** — 튜플이 부서 id의 SSOT, departments 시드가
   튜플에서 파생하므로 이중 소스가 아니다. 클라이언트/서버 스키마 공유 유지.
3. **DEPARTMENT_LABELS 제거 → API 조회 전환.** 이름의 SSOT는 mock 시드
   (`departmentDb.ts`의 DEPARTMENT_NAMES). 클라이언트는 `departmentListQuery`
   (staleTime Infinity — 세션 내 불변 마스터 데이터, 앱 전체 1회 요청).
4. **login/me 응답 = AuthProfile.** `AuthUser`(저장형, employeeId 추가)와
   `AuthProfile extends AuthUser { isManager; department }`(응답 DTO) 분리.
   조립은 순수 함수 `buildAuthProfile` — login/me 두 핸들러가 공유해
   useLogin의 setQueryData(me) 캐시와 형태 일치 보장.
5. **시드**: 부서장 = 해당 부서의 첫 active 직원(listEmployees 파생, 결정적).
   계정 u1 admin(employeeId null) / u2 윤하은(직원 '22', 개발 비부서장) /
   u3 조우진(manager@hrcorp.dev, 직원 '1', 개발 부서장, role은 member).
   u2·u3가 같은 부서라 12단계 MSS 데모가 한 부서에서 완결된다.
   u3 하드코딩↔시드 파생 정합성은 authDb.test에서 고정.
6. **loginAs 페르소나 확장**: `'admin' | 'member' | 'manager'` — 기존 호출 무변경.
7. **리셋 순서**: `resetDb() → resetDepartmentDb() → resetLeaveDb()`
   (departments/leave 시드가 employees를 읽는다).

## Slice (TDD → 구현 → 검증 → 커밋)

| Slice | 내용                                                                   | 커밋      |
| ----- | ---------------------------------------------------------------------- | --------- |
| 1     | Department 엔티티 + 시드 + GET /api/departments (departmentDb TDD)     | `e92539e` |
| 2     | 클라이언트 부서 전환 — 목록/폼/상세 옵션·라벨 API 조회, 정적 매핑 제거 | `7d911d7` |
| 3     | 계정↔직원 연결 + buildAuthProfile 순수 함수(TDD) + login/me 조립       | `bd92407` |
| 4     | 사이드바 푸터 부서·부서장 배지(컴포넌트 테스트) + loginAs('manager')   | `1b0cae3` |

## 검증 결과

- 테스트 104개(기존 91 + 신규 13) / lint / `tsc -b` 클린
- 브라우저 실증: GET /api/departments 세션 내 1회(페이지 이동에도 재요청 없음),
  admin은 부서 정보 없음 / member는 "개발"만 / manager는 "개발 + 부서장 배지",
  새로고침에도 me 복원으로 유지
