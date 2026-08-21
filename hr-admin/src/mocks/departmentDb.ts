import type { Department } from '../features/departments/types';
import type { DepartmentId } from '../features/employees/types';
import { DEPARTMENTS } from '../features/employees/types';
import { listEmployees } from './db';

// 부서 이름의 원천(SSOT) — 기존 클라이언트 정적 매핑(DEPARTMENT_LABELS)이 서버 시드로 이동했다
const DEPARTMENT_NAMES: Record<DepartmentId, string> = {
  engineering: '개발',
  design: '디자인',
  product: '기획',
  hr: '인사',
  finance: '재무',
  sales: '영업',
};

/**
 * 부서장 = 해당 부서의 첫 active 직원 (직원 시드가 고정이라 결정적).
 * 부서장 직원이 이후 삭제·퇴사해도 mock 수준에서 무결성을 강제하지 않는다 —
 * isManager 파생이 false가 될 뿐이다.
 */
function generateDepartments(): Department[] {
  const employees = listEmployees();
  return DEPARTMENTS.map((id) => {
    const manager = employees.find((e) => e.department === id && e.status === 'active');
    if (!manager) throw new Error(`부서 시드 오류: ${id}에 active 직원이 없습니다`);
    return { id, name: DEPARTMENT_NAMES[id], managerEmployeeId: manager.id };
  });
}

// 인메모리 저장소 — 변경 사항은 새로고침 전까지 유지된다
let departments = generateDepartments();

export function listDepartments(): Department[] {
  return departments;
}

/** 테스트용: 시드 데이터로 저장소를 되돌린다 — 시드가 직원 목록을 읽으므로 resetDb 이후에 호출할 것 */
export function resetDepartmentDb(): void {
  departments = generateDepartments();
}
