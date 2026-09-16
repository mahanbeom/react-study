import { act } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import type * as ZustandExportedTypes from 'zustand';

// 가로채지 않는 나머지(useStore, 타입 등)는 그대로 흘려보낸다.
export * from 'zustand';

const { create: actualCreate, createStore: actualCreateStore } =
  await vi.importActual<typeof ZustandExportedTypes>('zustand');

/** 앱 안의 모든 스토어를 되돌리는 함수들. 16 의 그 패턴이다. */
export const storeResetFns = new Set<() => void>();

const createUncurried = <T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  const store = actualCreate(stateCreator);

  // TODO ① — 16 에서 만든 등록 패턴을 여기에 옮겨라.
  //   storeResetFns.add(() => {
  //     store.setState(store.getInitialState(), true);
  //   });
  // 비워두면 아래 afterEach 가 빈 Set 을 순회해 아무 일도 하지 않는다.
  // 먼저 그 상태로 pnpm test 를 돌려 "무엇이 깨지는지" 부터 볼 것.

  return store;
};

export const create = (<T>(stateCreator?: ZustandExportedTypes.StateCreator<T>) =>
  stateCreator ? createUncurried(stateCreator) : createUncurried) as typeof actualCreate;

const createStoreUncurried = <T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  const store = actualCreateStore(stateCreator);

  // TODO ① (계속) — createStore 로 만든 스토어도 같은 방식으로 등록한다.

  return store;
};

export const createStore = (<T>(stateCreator?: ZustandExportedTypes.StateCreator<T>) =>
  stateCreator
    ? createStoreUncurried(stateCreator)
    : createStoreUncurried) as typeof actualCreateStore;

// 테스트 하나가 끝날 때마다 전부 초기 상태로. act 로 감싸는 이유는 이 초기화가
// 구독 중인 컴포넌트의 리렌더를 유발하기 때문이다.
afterEach(() => {
  act(() => {
    storeResetFns.forEach((resetFn) => resetFn());
  });
});
