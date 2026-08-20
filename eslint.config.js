import config from '@mahanbeom/kit/eslint';
import reactHooks from 'eslint-plugin-react-hooks';

// 프로젝트 고유 규칙: kit은 프레임워크 중립이므로 React hooks 규칙만 여기서 덧붙인다
export default [
  ...config,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
