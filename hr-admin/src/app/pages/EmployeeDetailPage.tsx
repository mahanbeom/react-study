import { useParams } from 'react-router';
import { PagePlaceholder } from './PagePlaceholder';

export function EmployeeDetailPage() {
  const { employeeId } = useParams();
  return (
    <PagePlaceholder step="3단계" description={`직원 상세/수정 폼 (employeeId: ${employeeId})`} />
  );
}
