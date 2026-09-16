import { describe, expect, test } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { counterStoreCreator, type CounterStore } from './counter-store-creator.ts';

// 스토어 단위 테스트 — React 도 RTL 도 필요 없다.
// 렌더 없이 로직만 확인하고 싶을 때 가장 빠르고 안정적인 층이다.
//
// 이 파일은 __mocks__ 의 자동 리셋이 없어도 안전하다. 테스트마다 createStore 를
// 새로 부르기 때문이다 — 스토어가 테스트 하나보다 오래 살지 않는다.
// 반대로 use-counter-store.ts 처럼 모듈 최상단에서 한 번 만들면 오염이 시작된다.
// (Counter.test.tsx 가 그래서 mock 을 필요로 했다)

describe('counterStoreCreator', () => {
  test('초기 count 는 1 이다', () => {
    const store = createStore<CounterStore>()(counterStoreCreator);

    expect(store.getState().count).toBe(1);
  });

  test('inc 를 두 번 부르면 3 이 된다', () => {
    const store = createStore<CounterStore>()(counterStoreCreator);

    store.getState().inc();
    store.getState().inc();

    expect(store.getState().count).toBe(3);
  });
});
