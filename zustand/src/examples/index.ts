import type { ComponentType } from 'react';
import Introduction from './01-introduction.tsx';
import Comparison from './02-comparison.tsx';
import UpdatingState from './03-updating-state.tsx';
import NoStoreActions from './04-no-store-actions.tsx';
import SlicesPattern from './05-slices-pattern/index.tsx';
import ImmutableMerging from './06-immutable-merging.tsx';
import MapsAndSets from './07-maps-and-sets.tsx';
import TicTacToe from './08-tic-tac-toe/index.tsx';
import UseShallow from './09-use-shallow.tsx';
import UrlHash from './10-url-hash.tsx';
import BeginnerTypeScript from './11-beginner-typescript.tsx';
import AdvancedTypeScript from './12-advanced-typescript.tsx';
import AutoGeneratingSelectors from './13-auto-generating-selectors.tsx';
import NextjsSsr from './14-nextjs-ssr.tsx';

export type Example = {
  id: string;
  title: string;
  /** 공식문서 원문 링크 */
  docs: string;
  Component: ComponentType;
};

// 공식문서에 나오는 순서대로 하나씩 추가한다
export const examples: Example[] = [
  {
    id: '01-introduction',
    title: 'Introduction',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/getting-started/introduction.md',
    Component: Introduction,
  },
  {
    id: '02-comparison',
    title: 'Comparison',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/getting-started/comparison.md',
    Component: Comparison,
  },
  {
    id: '03-updating-state',
    title: 'Updating state',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/updating-state.md',
    Component: UpdatingState,
  },
  {
    id: '04-no-store-actions',
    title: 'Practice with no store actions',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/practice-with-no-store-actions.md',
    Component: NoStoreActions,
  },
  {
    id: '05-slices-pattern',
    title: 'Slices pattern',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/slices-pattern.md',
    Component: SlicesPattern,
  },
  {
    id: '06-immutable-merging',
    title: 'Immutable state and merging',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/immutable-state-and-merging.md',
    Component: ImmutableMerging,
  },
  {
    id: '07-maps-and-sets',
    title: 'Maps and sets usage',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/maps-and-sets-usage.md',
    Component: MapsAndSets,
  },
  {
    id: '08-tic-tac-toe',
    title: 'Tutorial: Tic Tac Toe',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/tutorial-tic-tac-toe.md',
    Component: TicTacToe,
  },
  {
    id: '09-use-shallow',
    title: 'Prevent rerenders with useShallow',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/prevent-rerenders-with-use-shallow.md',
    Component: UseShallow,
  },
  {
    id: '10-url-hash',
    title: 'Connect to state with URL hash',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/connect-to-state-with-url-hash.md',
    Component: UrlHash,
  },
  {
    id: '11-beginner-typescript',
    title: 'Beginner TypeScript',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/beginner-typescript.md',
    Component: BeginnerTypeScript,
  },
  {
    id: '12-advanced-typescript',
    title: 'Advanced TypeScript',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/advanced-typescript.md',
    Component: AdvancedTypeScript,
  },
  {
    id: '13-auto-generating-selectors',
    title: 'Auto Generating Selectors',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/auto-generating-selectors.md',
    Component: AutoGeneratingSelectors,
  },
  {
    id: '14-nextjs-ssr',
    title: 'Next.js & SSR/hydration',
    docs: 'https://github.com/pmndrs/zustand/blob/main/docs/learn/guides/nextjs.md',
    Component: NextjsSsr,
  },
];
