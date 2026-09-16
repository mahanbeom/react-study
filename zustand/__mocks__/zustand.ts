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

  // 16 의 등록 패턴 그대로. 스토어가 태어날 때 자기 리셋 함수를 등록해두고,
  // 아래 afterEach 가 테스트 하나가 끝날 때마다 전부 돌린다.
  storeResetFns.add(() => {
    store.setState(store.getInitialState(), true);
  });

  return store;
};

export const create = (<T>(stateCreator?: ZustandExportedTypes.StateCreator<T>) =>
  stateCreator ? createUncurried(stateCreator) : createUncurried) as typeof actualCreate;

const createStoreUncurried = <T>(stateCreator: ZustandExportedTypes.StateCreator<T>) => {
  const store = actualCreateStore(stateCreator);

  // createStore 로 만든 스토어도 같은 방식으로 등록한다. Context 판은 사실
  // 테스트마다 새로 만들어져 오염될 일이 없지만, 앱 어디선가 vanilla 스토어를
  // 모듈 최상단에 두는 순간 필요해진다.
  storeResetFns.add(() => {
    store.setState(store.getInitialState(), true);
  });

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
