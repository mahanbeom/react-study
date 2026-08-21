import { describe, expect, it } from 'vitest';
import { DEPARTMENTS } from '../features/employees/types';
import { listEmployees } from './db';
import { listDepartments, resetDepartmentDb } from './departmentDb';

describe('부서 시드', () => {
  it('DEPARTMENTS 순서대로 6개 부서를 생성한다', () => {
    const departments = listDepartments();
    expect(departments.map((d) => d.id)).toEqual([...DEPARTMENTS]);
  });

  it('부서 이름은 기존 한국어 라벨을 그대로 잇는다', () => {
    const names = Object.fromEntries(listDepartments().map((d) => [d.id, d.name]));
    expect(names).toEqual({
      engineering: '개발',
      design: '디자인',
      product: '기획',
      hr: '인사',
      finance: '재무',
      sales: '영업',
    });
  });

  it('부서장은 해당 부서 소속의 active 직원이다', () => {
    const employees = listEmployees();
    for (const department of listDepartments()) {
      const manager = employees.find((e) => e.id === department.managerEmployeeId);
      expect(manager, `${department.id} 부서장(${department.managerEmployeeId})`).toBeDefined();
      expect(manager?.department).toBe(department.id);
      expect(manager?.status).toBe('active');
    }
  });

  it('리셋해도 같은 시드가 나온다 (결정적)', () => {
    const before = listDepartments();
    resetDepartmentDb();
    expect(listDepartments()).toEqual(before);
  });
});
