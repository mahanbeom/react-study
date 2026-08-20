import { describe, expect, it } from 'vitest';
import { employeeFormSchema } from './schema';

const VALID = {
  name: '김민수',
  email: 'minsu.kim@hrcorp.dev',
  department: 'engineering',
  position: '대리',
  status: 'active',
  hiredAt: '2024-03-15',
  resignedAt: '',
};

function errorPaths(result: ReturnType<typeof employeeFormSchema.safeParse>): string[] {
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
}

describe('employeeFormSchema', () => {
  it('유효한 입력을 통과시키고 비퇴사자의 resignedAt을 null로 정규화한다', () => {
    const result = employeeFormSchema.safeParse(VALID);
    expect(result.success).toBe(true);
    expect(result.data?.resignedAt).toBeNull();
  });

  it('이름 공백만 있으면 거부한다', () => {
    const result = employeeFormSchema.safeParse({ ...VALID, name: '   ' });
    expect(errorPaths(result)).toContain('name');
  });

  it('이메일 형식을 검증한다', () => {
    const result = employeeFormSchema.safeParse({ ...VALID, email: 'not-an-email' });
    expect(errorPaths(result)).toContain('email');
  });

  it('허용되지 않은 부서를 거부한다', () => {
    const result = employeeFormSchema.safeParse({ ...VALID, department: 'marketing' });
    expect(errorPaths(result)).toContain('department');
  });

  it('입사일은 YYYY-MM-DD 형식이어야 한다', () => {
    const result = employeeFormSchema.safeParse({ ...VALID, hiredAt: '2024/03/15' });
    expect(errorPaths(result)).toContain('hiredAt');
  });

  it('퇴사 상태인데 퇴사일이 없으면 거부한다', () => {
    const result = employeeFormSchema.safeParse({ ...VALID, status: 'resigned', resignedAt: '' });
    expect(errorPaths(result)).toContain('resignedAt');
  });

  it('퇴사일이 입사일보다 빠르면 거부한다', () => {
    const result = employeeFormSchema.safeParse({
      ...VALID,
      status: 'resigned',
      resignedAt: '2023-01-01',
    });
    expect(errorPaths(result)).toContain('resignedAt');
  });

  it('정상적인 퇴사 입력은 퇴사일을 유지한다', () => {
    const result = employeeFormSchema.safeParse({
      ...VALID,
      status: 'resigned',
      resignedAt: '2025-06-30',
    });
    expect(result.success).toBe(true);
    expect(result.data?.resignedAt).toBe('2025-06-30');
  });

  it('휴직 상태에 남아있는 퇴사일 값은 null로 정규화한다', () => {
    const result = employeeFormSchema.safeParse({
      ...VALID,
      status: 'onLeave',
      resignedAt: '2025-06-30',
    });
    expect(result.success).toBe(true);
    expect(result.data?.resignedAt).toBeNull();
  });

  it('이름 앞뒤 공백은 잘라낸다', () => {
    const result = employeeFormSchema.safeParse({ ...VALID, name: '  김민수  ' });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe('김민수');
  });
});
