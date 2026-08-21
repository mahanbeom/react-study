import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import { loginAs, renderApp, renderWithProviders } from '@/test/renderWithProviders';
import { EmployeeForm } from './EmployeeForm';

function renderForm(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const view = renderWithProviders(
    <EmployeeForm submitLabel="저장" onSubmit={onSubmit} onCancel={vi.fn()} />,
  );
  return { onSubmit, ...view };
}

// required 필드는 label 텍스트가 "이름*"처럼 별표를 포함하므로 접두 매칭을 쓴다
async function fillValidForm(user: ReturnType<typeof renderForm>['user']) {
  await user.type(screen.getByLabelText(/^이름/), '홍길동');
  await user.type(screen.getByLabelText(/^이메일/), 'new@hrcorp.dev');
  // 부서/상태 Select는 label 연결이 없어 combobox 순서로 접근한다 (0: 부서, 1: 상태)
  // 부서 옵션은 API(GET /api/departments)에서 오므로 렌더될 때까지 기다린다
  await screen.findByRole('option', { name: '개발' });
  const [departmentSelect] = screen.getAllByRole('combobox');
  await user.selectOptions(departmentSelect!, '개발');
  await user.type(screen.getByLabelText(/^직급/), '대리');
  await user.type(screen.getByLabelText(/^입사일/), '2024-01-02');
}

describe('EmployeeForm', () => {
  it('빈 폼 제출 시 필수 검증 에러를 보여주고 onSubmit을 호출하지 않는다', async () => {
    const { user, onSubmit } = renderForm();

    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('이름을 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('올바른 이메일 형식이 아닙니다')).toBeInTheDocument();
    expect(screen.getByText('부서를 선택하세요')).toBeInTheDocument();
    expect(screen.getByText('직급을 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('입사일을 입력하세요')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('유효한 입력이면 zod transform을 거친 값으로 onSubmit을 호출한다', async () => {
    const { user, onSubmit } = renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      name: '홍길동',
      email: 'new@hrcorp.dev',
      department: 'engineering',
      position: '대리',
      status: 'active',
      hiredAt: '2024-01-02',
      resignedAt: null, // 재직 상태면 transform이 퇴사일을 null로 정규화한다
    });
  });

  it('onSubmit이 ApiError(409)를 던지면 이메일 필드 에러로 보여준다', async () => {
    const { user } = renderForm(vi.fn().mockRejectedValue(new ApiError(409, 'conflict')));

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('이미 사용 중인 이메일입니다')).toBeInTheDocument();
  });

  it('onSubmit이 그 외 에러를 던지면 root 에러로 보여준다', async () => {
    const { user } = renderForm(vi.fn().mockRejectedValue(new ApiError(500, 'server error')));

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: '저장' }));

    expect(
      await screen.findByText('저장에 실패했습니다. 잠시 후 다시 시도해주세요.'),
    ).toBeInTheDocument();
  });

  it('상태를 퇴사로 바꾸면 퇴사일 입력이 활성화되고, 비워두면 검증에 걸린다', async () => {
    const { user, onSubmit } = renderForm();

    const resignedAtInput = screen.getByLabelText(/^퇴사일/);
    expect(resignedAtInput).toBeDisabled();

    await fillValidForm(user);
    const [, statusSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(statusSelect!, '퇴사');
    expect(resignedAtInput).toBeEnabled();

    await user.click(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('퇴사일을 입력하세요')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('[통합] 직원 추가 화면에서 중복 이메일이면 실제 핸들러의 409를 표시한다', async () => {
    loginAs('admin');
    const { user } = renderApp('/employees/new');

    await user.type(await screen.findByLabelText(/^이름/), '홍길동');
    // 시드 데이터에 항상 존재하는 이메일 (id 1번 직원)
    await user.type(screen.getByLabelText(/^이메일/), 'member01@hrcorp.dev');
    await screen.findByRole('option', { name: '개발' });
    const [departmentSelect] = screen.getAllByRole('combobox');
    await user.selectOptions(departmentSelect!, '개발');
    await user.type(screen.getByLabelText(/^직급/), '대리');
    await user.type(screen.getByLabelText(/^입사일/), '2024-01-02');
    await user.click(screen.getByRole('button', { name: /추가|저장|등록/ }));

    expect(await screen.findByText('이미 사용 중인 이메일입니다')).toBeInTheDocument();
  });
});
