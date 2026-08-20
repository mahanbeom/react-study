import { describe, expect, it } from 'vitest';
import type { Employee } from '../features/employees/types';
import { queryEmployees } from './employees';

function emp(overrides: Partial<Employee> & Pick<Employee, 'id'>): Employee {
  return {
    name: '직원' + overrides.id,
    email: `emp${overrides.id}@example.com`,
    department: 'engineering',
    position: '사원',
    status: 'active',
    hiredAt: '2024-01-01',
    resignedAt: null,
    ...overrides,
  };
}

const DB: Employee[] = [
  emp({ id: '1', name: '김민수', email: 'minsu.kim@example.com', hiredAt: '2023-03-15' }),
  emp({ id: '2', name: '이서연', department: 'design', hiredAt: '2024-06-01' }),
  emp({ id: '3', name: '박민서', department: 'design', status: 'onLeave', hiredAt: '2024-02-10' }),
  emp({
    id: '4',
    name: '최지훈',
    department: 'hr',
    status: 'resigned',
    hiredAt: '2022-11-20',
    resignedAt: '2025-01-31',
  }),
  emp({ id: '5', name: 'Alex Kim', email: 'alex@example.com', hiredAt: '2025-05-02' }),
];

describe('queryEmployees', () => {
  it('기본값: page 1, pageSize 10, 전체 반환', () => {
    const result = queryEmployees(DB, {});
    expect(result.total).toBe(5);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(result.items).toHaveLength(5);
  });

  it('최근 입사일 순으로 정렬한다', () => {
    const result = queryEmployees(DB, {});
    expect(result.items.map((e) => e.id)).toEqual(['5', '2', '3', '1', '4']);
  });

  it('이름 부분 일치로 검색한다', () => {
    const result = queryEmployees(DB, { search: '민서' });
    expect(result.items.map((e) => e.id)).toEqual(['3']);
  });

  it('이메일도 검색하고 대소문자를 무시한다', () => {
    const result = queryEmployees(DB, { search: 'ALEX' });
    expect(result.items.map((e) => e.id)).toEqual(['5']);
  });

  it('검색어 앞뒤 공백은 무시한다', () => {
    const result = queryEmployees(DB, { search: '  민수  ' });
    expect(result.items.map((e) => e.id)).toEqual(['1']);
  });

  it('부서로 필터링한다', () => {
    const result = queryEmployees(DB, { department: 'design' });
    expect(result.items.map((e) => e.id)).toEqual(['2', '3']);
  });

  it('재직 상태로 필터링한다', () => {
    const result = queryEmployees(DB, { status: 'resigned' });
    expect(result.items.map((e) => e.id)).toEqual(['4']);
  });

  it('검색과 필터를 조합한다', () => {
    const result = queryEmployees(DB, {
      search: 'example.com',
      department: 'design',
      status: 'onLeave',
    });
    expect(result.items.map((e) => e.id)).toEqual(['3']);
  });

  it('페이지를 나눈다 (2페이지에 나머지)', () => {
    const result = queryEmployees(DB, { page: 2, pageSize: 3 });
    expect(result.total).toBe(5);
    expect(result.items.map((e) => e.id)).toEqual(['1', '4']);
  });

  it('범위 밖 페이지는 빈 목록을 반환하되 total은 유지한다', () => {
    const result = queryEmployees(DB, { page: 99, pageSize: 3 });
    expect(result.items).toEqual([]);
    expect(result.total).toBe(5);
    expect(result.page).toBe(99);
  });

  it('필터링 결과 기준으로 페이지를 나눈다', () => {
    const result = queryEmployees(DB, { department: 'design', page: 2, pageSize: 1 });
    expect(result.total).toBe(2);
    expect(result.items.map((e) => e.id)).toEqual(['3']);
  });
});
