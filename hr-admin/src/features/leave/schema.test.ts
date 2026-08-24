import { describe, expect, it } from 'vitest';
import { leaveRequestFormSchema } from './schema';

const VALID = {
  employeeId: '3',
  type: 'annual',
  startDate: '2026-09-01',
  endDate: '2026-09-03',
  reason: '가족 여행',
};

function errorPaths(result: ReturnType<typeof leaveRequestFormSchema.safeParse>): string[] {
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
}

describe('leaveRequestFormSchema', () => {
  it('유효한 입력을 통과시킨다', () => {
    expect(leaveRequestFormSchema.safeParse(VALID).success).toBe(true);
  });

  it('직원 선택은 필수다', () => {
    const result = leaveRequestFormSchema.safeParse({ ...VALID, employeeId: '' });
    expect(errorPaths(result)).toContain('employeeId');
  });

  it('허용되지 않은 휴가 유형을 거부한다', () => {
    const result = leaveRequestFormSchema.safeParse({ ...VALID, type: 'vacation' });
    expect(errorPaths(result)).toContain('type');
  });

  it('날짜 형식을 검증한다', () => {
    const result = leaveRequestFormSchema.safeParse({ ...VALID, startDate: '2026/09/01' });
    expect(errorPaths(result)).toContain('startDate');
  });

  it('종료일이 시작일보다 빠르면 거부한다', () => {
    const result = leaveRequestFormSchema.safeParse({ ...VALID, endDate: '2026-08-31' });
    expect(errorPaths(result)).toContain('endDate');
  });

  it('시작일과 종료일이 같은 하루짜리 휴가는 허용한다', () => {
    const result = leaveRequestFormSchema.safeParse({ ...VALID, endDate: VALID.startDate });
    expect(result.success).toBe(true);
  });

  it('사유는 공백만으로 채울 수 없다', () => {
    const result = leaveRequestFormSchema.safeParse({ ...VALID, reason: '   ' });
    expect(errorPaths(result)).toContain('reason');
  });

  it('반차는 시작일과 종료일이 같으면 통과한다', () => {
    const result = leaveRequestFormSchema.safeParse({
      ...VALID,
      type: 'half',
      startDate: '2026-09-01',
      endDate: '2026-09-01',
    });
    expect(result.success).toBe(true);
  });

  it('반차인데 기간이 이틀 이상이면 종료일 에러가 난다', () => {
    const result = leaveRequestFormSchema.safeParse({
      ...VALID,
      type: 'half',
      startDate: '2026-09-01',
      endDate: '2026-09-02',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['endDate']);
    expect(result.error?.issues[0]?.message).toBe('반차는 하루만 신청할 수 있습니다');
  });
});
