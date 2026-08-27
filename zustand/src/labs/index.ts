import type { ComponentType } from 'react';
import RenderCountLab from './render-count.tsx';
import PracticalPersist from './practical-persist.tsx';

export type Lab = {
  id: string;
  title: string;
  Component: ComponentType;
};

// 문서 예제와 별개로, 궁금한 걸 직접 확인해보는 실험장
export const labs: Lab[] = [
  {
    id: 'render-count',
    title: '무엇이 리렌더를 유발하는가',
    Component: RenderCountLab,
  },
  {
    id: 'practical-persist',
    title: '실무에서 쓰는 persist / URL 동기화',
    Component: PracticalPersist,
  },
];
