import { describe, expect, it } from 'vitest';
import { can } from './permissions';

describe('can — 역할별 권한 매트릭스', () => {
  it('관리자는 직원 쓰기가 가능하다', () => {
    expect(can('admin', 'employee.write')).toBe(true);
  });

  it('관리자는 휴가 승인/반려가 가능하다', () => {
    expect(can('admin', 'leave.decide')).toBe(true);
  });

  it('일반 사용자는 직원 쓰기가 불가능하다', () => {
    expect(can('member', 'employee.write')).toBe(false);
  });

  it('일반 사용자는 휴가 승인/반려가 불가능하다', () => {
    expect(can('member', 'leave.decide')).toBe(false);
  });

  it('휴가 신청은 두 역할 모두 가능하다', () => {
    expect(can('admin', 'leave.request')).toBe(true);
    expect(can('member', 'leave.request')).toBe(true);
  });
});
